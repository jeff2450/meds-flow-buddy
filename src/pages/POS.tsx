import { useState, useMemo, useEffect } from "react";
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
import { Search, Plus, Minus, Trash2, ShoppingCart, Receipt, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { ReceiptDialog } from "@/components/pos/ReceiptDialog";

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
}

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
    if (!search.trim()) return medicines.slice(0, 50);
    const s = search.toLowerCase();
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
      return [...prev, { medicine: m, qty: 1, price: m.selling_price || 0 }];
    });
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

  const removeItem = (id: string) => setCart((prev) => prev.filter((c) => c.medicine.id !== id));

  const total = cart.reduce((sum, c) => sum + c.qty * c.price, 0);
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

      const rows = cart.map((c) => ({
        medicine_id: c.medicine.id,
        sale_date: today,
        quantity_sold: c.qty,
        unit_price: c.price,
        is_prescription: false,
        payment_method: paymentMethod,
        amount_paid: (finalPaid / total) * (c.qty * c.price),
        balance_due: ((total - finalPaid) / total) * (c.qty * c.price),
        customer_id: customerId || null,
        payment_reference: paymentRef || null,
      }));

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

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar
        activeTab="pos"
        onTabChange={(t) => {
          if (t === "pos") return;
          navigateForTab(t, navigate);
          return;
          if (t === "dashboard") navigate("/");
          else navigate(`/${t}`);
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
        </header>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-4 p-4 overflow-hidden">
          {/* Products grid */}
          <div className="lg:col-span-3 flex flex-col gap-4 overflow-hidden">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                autoFocus
                placeholder="Search medicines..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
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
                              TZS {(c.qty * c.price).toLocaleString()}
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
    </div>
  );
};

export default POS;
