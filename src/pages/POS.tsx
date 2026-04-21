import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Search, Plus, Minus, Trash2, ShoppingCart, Receipt, X, ScanLine, Pause, Play, Percent } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { ReceiptDialog } from "@/components/pos/ReceiptDialog";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { navigateForTab } from "@/lib/sidebarNav";

interface Medicine {
  id: string;
  name: string;
  current_stock: number;
  selling_price: number | null;
  cost_price: number | null;
}

interface CartItem {
  medicine: Medicine;
  qty: number;
  price: number;
  discount: number; // per-line discount in TZS
}

interface HeldSale {
  id: string;
  cart: CartItem[];
  heldAt: string;
  label: string;
}

const HOLD_KEY = "pos_held_sales";

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  credit_balance: number;
}

const POS = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAdmin } = useUserRole();
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "mobile_money" | "credit" | "bank">("cash");
  const [amountPaid, setAmountPaid] = useState("");
  const [customerId, setCustomerId] = useState<string>("");
  const [paymentRef, setPaymentRef] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [heldSales, setHeldSales] = useState<HeldSale[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(HOLD_KEY) || "[]");
    } catch {
      return [];
    }
  });
  const searchRef = useRef<HTMLInputElement>(null);
  const paidRef = useRef<HTMLInputElement>(null);

  const { data: medicines = [] } = useQuery({
    queryKey: ["pos-medicines"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("medicines")
        .select("id, name, current_stock, selling_price, cost_price")
        .gt("current_stock", 0)
        .order("name");
      if (error) throw error;
      return data as Medicine[];
    },
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["pos-customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("id, name, phone, credit_balance")
        .order("name");
      if (error) throw error;
      return data as Customer[];
    },
  });

  const filtered = useMemo(() => {
    const q = search.replace(/^(\d+)\s*[*x]\s*/i, "").trim();
    if (!q) return medicines.slice(0, 50);
    const s = q.toLowerCase();
    return medicines.filter((m) => m.name.toLowerCase().includes(s)).slice(0, 50);
  }, [medicines, search]);

  const addToCart = (m: Medicine) => {
    setCart((prev) => {
      const ex = prev.find((c) => c.medicine.id === m.id);
      if (ex) {
        if (ex.qty >= m.current_stock) {
          toast({ variant: "destructive", title: "Stock limit", description: `Only ${m.current_stock} in stock` });
          return prev;
        }
        return prev.map((c) => (c.medicine.id === m.id ? { ...c, qty: c.qty + 1 } : c));
      }
      return [...prev, { medicine: m, qty: 1, price: m.selling_price || 0, discount: 0 }];
    });
  };

  const handleScan = async (code: string) => {
    setScannerOpen(false);
    // Try medicine barcode first, then batch barcode
    const { data: med } = await supabase
      .from("medicines")
      .select("id, name, current_stock, selling_price, cost_price")
      .eq("barcode", code)
      .gt("current_stock", 0)
      .maybeSingle();
    if (med) {
      addToCart(med as Medicine);
      toast({ title: "Added", description: med.name });
      return;
    }
    const { data: batch } = await supabase
      .from("medicine_batches")
      .select("medicine_id, medicines(id, name, current_stock, selling_price, cost_price)")
      .eq("barcode", code)
      .gt("quantity_remaining", 0)
      .maybeSingle();
    const m: any = batch?.medicines;
    if (m && m.current_stock > 0) {
      addToCart(m as Medicine);
      toast({ title: "Added", description: m.name });
      return;
    }
    toast({ variant: "destructive", title: "Not found", description: `No medicine for code ${code}` });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.medicine.id !== id) return c;
          const newQty = c.qty + delta;
          if (newQty <= 0) return null;
          if (newQty > c.medicine.current_stock) {
            toast({ variant: "destructive", title: "Stock limit", description: `Only ${c.medicine.current_stock} in stock` });
            return c;
          }
          return { ...c, qty: newQty };
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const updatePrice = (id: string, price: number) => {
    setCart((prev) => prev.map((c) => (c.medicine.id === id ? { ...c, price } : c)));
  };

  const updateDiscount = (id: string, discount: number) => {
    setCart((prev) => prev.map((c) => (c.medicine.id === id ? { ...c, discount: Math.max(0, discount) } : c)));
  };

  const removeItem = (id: string) => setCart((prev) => prev.filter((c) => c.medicine.id !== id));

  // Quick-quantity syntax: "3*paracetamol" or "3x paracetamol"
  const parseQuickQty = (input: string): { qty: number; query: string } => {
    const m = input.match(/^(\d+)\s*[*x]\s*(.+)$/i);
    if (m) return { qty: parseInt(m[1], 10), query: m[2].trim() };
    return { qty: 1, query: input };
  };
  const { qty: quickQty, query: searchQuery } = parseQuickQty(search);

  const handleSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && filtered.length > 0) {
      e.preventDefault();
      const m = filtered[0];
      const addQty = Math.min(quickQty, m.current_stock);
      setCart((prev) => {
        const ex = prev.find((c) => c.medicine.id === m.id);
        if (ex) {
          const newQty = Math.min(ex.qty + addQty, m.current_stock);
          return prev.map((c) => (c.medicine.id === m.id ? { ...c, qty: newQty } : c));
        }
        return [...prev, { medicine: m, qty: addQty, price: m.selling_price || 0, discount: 0 }];
      });
      setSearch("");
    } else if (e.key === "Escape") {
      setSearch("");
    }
  };

  // Hold / resume
  const persistHeld = (next: HeldSale[]) => {
    setHeldSales(next);
    localStorage.setItem(HOLD_KEY, JSON.stringify(next));
  };
  const holdSale = () => {
    if (cart.length === 0) return;
    const label = `Hold #${heldSales.length + 1} · ${cart.length} item${cart.length > 1 ? "s" : ""}`;
    persistHeld([...heldSales, { id: crypto.randomUUID(), cart, heldAt: new Date().toISOString(), label }]);
    setCart([]);
    toast({ title: "Sale held", description: label });
  };
  const resumeSale = (id: string) => {
    const h = heldSales.find((x) => x.id === id);
    if (!h) return;
    if (cart.length > 0) {
      toast({ variant: "destructive", title: "Cart not empty", description: "Hold or clear current cart first" });
      return;
    }
    setCart(h.cart);
    persistHeld(heldSales.filter((x) => x.id !== id));
  };
  const deleteHeld = (id: string) => persistHeld(heldSales.filter((x) => x.id !== id));

  const subtotal = cart.reduce((sum, c) => sum + c.qty * c.price, 0);
  const totalDiscount = cart.reduce((sum, c) => sum + c.discount, 0);
  const total = Math.max(subtotal - totalDiscount, 0);
  const paidNum = parseFloat(amountPaid) || 0;
  const balance = Math.max(total - paidNum, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast({ variant: "destructive", title: "Empty cart" });
      return;
    }
    if (paymentMethod === "credit" && !customerId) {
      toast({ variant: "destructive", title: "Customer required", description: "Select a customer for credit sale" });
      return;
    }
    setSubmitting(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const finalPaid = paymentMethod === "credit" ? paidNum : (amountPaid ? paidNum : total);

      const rows = cart.map((c) => {
        const lineGross = c.qty * c.price;
        const lineNet = Math.max(lineGross - c.discount, 0);
        const effectiveUnit = c.qty > 0 ? lineNet / c.qty : c.price;
        return {
          medicine_id: c.medicine.id,
          sale_date: today,
          quantity_sold: c.qty,
          unit_price: effectiveUnit,
          is_prescription: false,
          payment_method: paymentMethod,
          amount_paid: total > 0 ? (finalPaid / total) * lineNet : 0,
          balance_due: total > 0 ? ((total - finalPaid) / total) * lineNet : 0,
          customer_id: customerId || null,
          payment_reference: paymentRef || null,
        };
      });

      const { data, error } = await supabase.from("medicine_sales").insert(rows).select("*, medicines(name)");
      if (error) throw error;

      const customer = customers.find((x) => x.id === customerId);
      setLastSale({
        items: data,
        cart,
        total,
        paid: finalPaid,
        balance: total - finalPaid,
        method: paymentMethod,
        customer: customer?.name || null,
        date: new Date(),
        receiptNumber: data[0]?.receipt_number,
      });
      setShowReceipt(true);

      // Reset
      setCart([]);
      setAmountPaid("");
      setCustomerId("");
      setPaymentRef("");
      setPaymentMethod("cash");

      queryClient.invalidateQueries({ queryKey: ["pos-medicines"] });
      queryClient.invalidateQueries({ queryKey: ["pos-customers"] });
      queryClient.invalidateQueries({ queryKey: ["medicine-sales"] });

      toast({ title: "Sale recorded", description: `Receipt: ${data[0]?.receipt_number}` });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    } finally {
      setSubmitting(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName || "").toLowerCase();
      const inField = tag === "input" || tag === "textarea" || tag === "select";
      if (e.key === "F2") {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      } else if (e.key === "F4") {
        e.preventDefault();
        if (cart.length > 0 && !submitting) handleCheckout();
      } else if (e.key === "F6") {
        e.preventDefault();
        holdSale();
      } else if (e.key === "F7") {
        e.preventDefault();
        setScannerOpen(true);
      } else if (e.key === "Escape" && !inField) {
        setCart([]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart, total, heldSales, submitting]);

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar
        activeTab="pos"
        onTabChange={(t) => {
          if (t === "pos") return;
          navigateForTab(t, navigate);
        }}
        showAdminTabs={isAdmin}
        onLogout={async () => {
          await supabase.auth.signOut();
          navigate("/auth");
        }}
      />
      <div className="flex-1 flex flex-col">
        <header className="bg-card border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ShoppingCart className="h-6 w-6 text-primary" />
              Point of Sale
            </h1>
            <p className="text-sm text-muted-foreground">Fast selling — search, scan, sell</p>
          </div>
          <div className="flex items-center gap-2">
            {heldSales.length > 0 && (
              <Select onValueChange={resumeSale}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder={`Resume (${heldSales.length})`} />
                </SelectTrigger>
                <SelectContent>
                  {heldSales.map((h) => (
                    <SelectItem key={h.id} value={h.id}>
                      {h.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button variant="outline" size="sm" onClick={holdSale} disabled={cart.length === 0} title="F6">
              <Pause className="h-4 w-4 mr-1" />Hold
            </Button>
            <Button variant="outline" size="sm" onClick={() => setScannerOpen(true)} title="F7">
              <ScanLine className="h-4 w-4 mr-1" />Scan
            </Button>
          </div>
        </header>
        <div className="px-6 py-1 border-b bg-muted/30 text-xs text-muted-foreground">
          <kbd className="px-1.5 py-0.5 rounded bg-muted border">F2</kbd> search ·{" "}
          <kbd className="px-1.5 py-0.5 rounded bg-muted border">Enter</kbd> add first match ·{" "}
          <kbd className="px-1.5 py-0.5 rounded bg-muted border">3*name</kbd> qty ·{" "}
          <kbd className="px-1.5 py-0.5 rounded bg-muted border">F4</kbd> checkout ·{" "}
          <kbd className="px-1.5 py-0.5 rounded bg-muted border">F6</kbd> hold ·{" "}
          <kbd className="px-1.5 py-0.5 rounded bg-muted border">F7</kbd> scan
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-4 p-4 overflow-hidden">
          {/* Products grid */}
          <div className="lg:col-span-3 flex flex-col gap-4 overflow-hidden">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchRef}
                autoFocus
                placeholder="Search medicines... (try '3*paracetamol' then Enter)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleSearchKey}
                className="pl-9 h-12 text-base"
              />
            </div>
            <ScrollArea className="flex-1 border rounded-lg p-2 bg-card">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {filtered.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => addToCart(m)}
                    className="text-left p-3 rounded-lg border bg-background hover:bg-accent hover:border-primary transition-colors active:scale-95"
                  >
                    <div className="font-medium text-sm line-clamp-2 min-h-[2.5rem]">{m.name}</div>
                    <div className="flex items-center justify-between mt-2">
                      <Badge variant="secondary" className="text-xs">
                        {m.current_stock} in stock
                      </Badge>
                      <span className="font-bold text-primary text-sm">
                        TZS {(m.selling_price || 0).toLocaleString()}
                      </span>
                    </div>
                  </button>
                ))}
                {filtered.length === 0 && (
                  <div className="col-span-full text-center text-muted-foreground py-12">
                    No medicines found
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Cart */}
          <Card className="lg:col-span-2 flex flex-col overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Cart ({cart.length})
                </span>
                {cart.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => setCart([])}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-3 overflow-hidden">
              <ScrollArea className="flex-1 -mx-2 px-2">
                {cart.length === 0 ? (
                  <div className="text-center text-muted-foreground py-12 text-sm">
                    Click a product to add to cart
                  </div>
                ) : (
                  <div className="space-y-2">
                    {cart.map((c) => (
                      <div key={c.medicine.id} className="border rounded-lg p-2 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm line-clamp-1">{c.medicine.name}</p>
                            <p className="text-xs text-muted-foreground">
                              TZS {Math.max(c.qty * c.price - c.discount, 0).toLocaleString()}
                              {c.discount > 0 && (
                                <span className="line-through ml-1 opacity-60">
                                  {(c.qty * c.price).toLocaleString()}
                                </span>
                              )}
                            </p>
                          </div>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeItem(c.medicine.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center border rounded">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateQty(c.medicine.id, -1)}>
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center text-sm font-medium">{c.qty}</span>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateQty(c.medicine.id, 1)}>
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <Input
                            type="number"
                            value={c.price}
                            onChange={(e) => updatePrice(c.medicine.id, parseFloat(e.target.value) || 0)}
                            className="h-7 text-xs"
                            placeholder="Price"
                          />
                          <div className="relative w-20">
                            <Percent className="absolute left-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                            <Input
                              type="number"
                              value={c.discount || ""}
                              onChange={(e) => updateDiscount(c.medicine.id, parseFloat(e.target.value) || 0)}
                              className="h-7 text-xs pl-6"
                              placeholder="0"
                              title="Line discount (TZS)"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              <Separator />

              <div className="space-y-2">
                <Select value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">💵 Cash</SelectItem>
                    <SelectItem value="mobile_money">📱 Mobile Money</SelectItem>
                    <SelectItem value="bank">🏦 Bank</SelectItem>
                    <SelectItem value="credit">📝 Credit</SelectItem>
                  </SelectContent>
                </Select>

                {(paymentMethod === "credit" || paymentMethod === "mobile_money") && (
                  <Select value={customerId} onValueChange={setCustomerId}>
                    <SelectTrigger>
                      <SelectValue placeholder={paymentMethod === "credit" ? "Select customer (required)" : "Select customer (optional)"} />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} {c.phone && `· ${c.phone}`}
                          {c.credit_balance > 0 && ` (debt: TZS ${c.credit_balance.toLocaleString()})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {paymentMethod === "mobile_money" && (
                  <Input placeholder="Reference / Txn ID" value={paymentRef} onChange={(e) => setPaymentRef(e.target.value)} />
                )}

                <Input
                  type="number"
                  placeholder={paymentMethod === "credit" ? "Amount paid (optional)" : `Amount paid (default ${total.toLocaleString()})`}
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                />

                {totalDiscount > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>TZS {subtotal.toLocaleString()}</span>
                  </div>
                )}
                {totalDiscount > 0 && (
                  <div className="flex justify-between text-xs text-success">
                    <span>Discount</span>
                    <span>− TZS {totalDiscount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm pt-1">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-bold">TZS {total.toLocaleString()}</span>
                </div>
                {amountPaid && balance > 0 && (
                  <div className="flex justify-between text-sm text-amber-600">
                    <span>Balance due</span>
                    <span className="font-bold">TZS {balance.toLocaleString()}</span>
                  </div>
                )}

                <Button className="w-full h-12 text-base" onClick={handleCheckout} disabled={submitting || cart.length === 0}>
                  <Receipt className="h-4 w-4 mr-2" />
                  {submitting ? "Processing..." : `Checkout TZS ${total.toLocaleString()}`}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {lastSale && (
        <ReceiptDialog open={showReceipt} onOpenChange={setShowReceipt} sale={lastSale} />
      )}
      <BarcodeScanner open={scannerOpen} onClose={() => setScannerOpen(false)} onScan={handleScan} />
    </div>
  );
};

export default POS;
