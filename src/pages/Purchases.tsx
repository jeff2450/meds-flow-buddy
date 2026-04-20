import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PackagePlus, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { useOrganization } from "@/hooks/useOrganization";
import { format } from "date-fns";

const Purchases = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAdmin } = useUserRole();
  const { organizationId } = useOrganization();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    medicine_id: "",
    supplier_id: "",
    quantity: "",
    unit_cost: "",
    batch_number: "",
    expiry_date: "",
    payment_status: "paid" as "paid" | "partial" | "unpaid",
    amount_paid: "",
    invoice_number: "",
    notes: "",
  });

  const { data: purchases = [] } = useQuery({
    queryKey: ["purchases"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchases")
        .select("*, medicines(name), suppliers(name)")
        .order("purchase_date", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  const { data: medicines = [] } = useQuery({
    queryKey: ["medicines-list"],
    queryFn: async () => {
      const { data } = await supabase.from("medicines").select("id, name").order("name");
      return data || [];
    },
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers-list"],
    queryFn: async () => {
      const { data } = await supabase.from("suppliers").select("id, name").order("name");
      return data || [];
    },
  });

  const handleAdd = async () => {
    if (!form.medicine_id || !form.quantity || !form.unit_cost) {
      toast({ variant: "destructive", title: "Missing fields", description: "Medicine, quantity, and cost required" });
      return;
    }
    const qty = parseInt(form.quantity);
    const cost = parseFloat(form.unit_cost);
    const total = qty * cost;
    const paid = form.payment_status === "paid" ? total : (parseFloat(form.amount_paid) || 0);

    const { error } = await supabase.from("purchases").insert({
      organization_id: organizationId,
      medicine_id: form.medicine_id,
      supplier_id: form.supplier_id || null,
      quantity: qty,
      unit_cost: cost,
      batch_number: form.batch_number || null,
      expiry_date: form.expiry_date || null,
      payment_status: form.payment_status,
      amount_paid: paid,
      invoice_number: form.invoice_number || null,
      notes: form.notes || null,
    });
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
      return;
    }
    toast({ title: "Purchase recorded", description: `Stock updated automatically` });
    setForm({ medicine_id: "", supplier_id: "", quantity: "", unit_cost: "", batch_number: "", expiry_date: "", payment_status: "paid", amount_paid: "", invoice_number: "", notes: "" });
    setOpen(false);
    queryClient.invalidateQueries({ queryKey: ["purchases"] });
    queryClient.invalidateQueries({ queryKey: ["medicines"] });
    queryClient.invalidateQueries({ queryKey: ["pos-medicines"] });
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar
        activeTab="purchases"
        onTabChange={(t) => { if (t !== "purchases") navigateForTab(t, navigate); }}
        showAdminTabs={isAdmin}
        onLogout={async () => { await supabase.auth.signOut(); navigate("/auth"); }}
      />
      <div className="flex-1 flex flex-col">
        <header className="bg-card border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><PackagePlus className="h-6 w-6 text-primary" />Purchases & Restock</h1>
            <p className="text-sm text-muted-foreground">Add stock from suppliers — auto-updates inventory</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />New Purchase</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Record Purchase</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Medicine *</Label>
                  <Select value={form.medicine_id} onValueChange={(v) => setForm({ ...form, medicine_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select medicine" /></SelectTrigger>
                    <SelectContent>
                      {medicines.map((m: any) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Supplier</Label>
                  <Select value={form.supplier_id} onValueChange={(v) => setForm({ ...form, supplier_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                    <SelectContent>
                      {suppliers.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Quantity *</Label><Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></div>
                  <div><Label>Unit Cost (TZS) *</Label><Input type="number" step="0.01" value={form.unit_cost} onChange={(e) => setForm({ ...form, unit_cost: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Batch Number</Label><Input value={form.batch_number} onChange={(e) => setForm({ ...form, batch_number: e.target.value })} /></div>
                  <div><Label>Expiry Date</Label><Input type="date" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Payment Status</Label>
                    <Select value={form.payment_status} onValueChange={(v: any) => setForm({ ...form, payment_status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="partial">Partial</SelectItem>
                        <SelectItem value="unpaid">Unpaid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {form.payment_status === "partial" && (
                    <div><Label>Amount Paid</Label><Input type="number" value={form.amount_paid} onChange={(e) => setForm({ ...form, amount_paid: e.target.value })} /></div>
                  )}
                </div>
                <div><Label>Invoice #</Label><Input value={form.invoice_number} onChange={(e) => setForm({ ...form, invoice_number: e.target.value })} /></div>
                {form.quantity && form.unit_cost && (
                  <div className="p-3 bg-muted rounded text-sm">Total: <strong>TZS {(parseInt(form.quantity || "0") * parseFloat(form.unit_cost || "0")).toLocaleString()}</strong></div>
                )}
              </div>
              <DialogFooter><Button onClick={handleAdd}>Record Purchase</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          <Card>
            <CardHeader><CardTitle>Recent Purchases ({purchases.length})</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Medicine</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Unit Cost</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchases.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell>{format(new Date(p.purchase_date), "PP")}</TableCell>
                      <TableCell className="font-medium">{p.medicines?.name}</TableCell>
                      <TableCell>{p.suppliers?.name || "—"}</TableCell>
                      <TableCell>{p.quantity}</TableCell>
                      <TableCell>TZS {Number(p.unit_cost).toLocaleString()}</TableCell>
                      <TableCell className="font-bold">TZS {Number(p.total_cost).toLocaleString()}</TableCell>
                      <TableCell>{p.batch_number || "—"}</TableCell>
                      <TableCell>{p.expiry_date ? format(new Date(p.expiry_date), "PP") : "—"}</TableCell>
                      <TableCell>
                        <Badge variant={p.payment_status === "paid" ? "secondary" : p.payment_status === "partial" ? "outline" : "destructive"}>
                          {p.payment_status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {purchases.length === 0 && (
                    <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No purchases yet</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default Purchases;
