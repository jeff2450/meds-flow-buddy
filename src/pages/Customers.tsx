import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { useOrganization } from "@/hooks/useOrganization";

const Customers = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAdmin } = useUserRole();
  const { organizationId } = useOrganization();
  const [open, setOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", notes: "" });
  const [pay, setPay] = useState({ amount: "", payment_method: "cash", reference_number: "" });

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("customers").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const totalDebt = customers.reduce((s: number, c: any) => s + Number(c.credit_balance || 0), 0);

  const handleAdd = async () => {
    if (!form.name.trim()) { toast({ variant: "destructive", title: "Name required" }); return; }
    const { error } = await supabase.from("customers").insert({ ...form, organization_id: organizationId });
    if (error) { toast({ variant: "destructive", title: "Error", description: error.message }); return; }
    toast({ title: "Customer added" });
    setForm({ name: "", phone: "", email: "", address: "", notes: "" });
    setOpen(false);
    queryClient.invalidateQueries({ queryKey: ["customers"] });
  };

  const handlePayment = async () => {
    if (!selected || !pay.amount) return;
    const { error } = await supabase.from("payments").insert({
      organization_id: organizationId,
      customer_id: selected.id,
      amount: parseFloat(pay.amount),
      payment_method: pay.payment_method,
      reference_number: pay.reference_number || null,
    });
    if (error) { toast({ variant: "destructive", title: "Error", description: error.message }); return; }
    toast({ title: "Payment recorded", description: `TZS ${pay.amount} from ${selected.name}` });
    setPay({ amount: "", payment_method: "cash", reference_number: "" });
    setPayOpen(false);
    setSelected(null);
    queryClient.invalidateQueries({ queryKey: ["customers"] });
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar
        activeTab="customers"
        onTabChange={(t) => (t === "dashboard" ? navigate("/") : navigate(`/${t}`))}
        showAdminTabs={isAdmin}
        onLogout={async () => { await supabase.auth.signOut(); navigate("/auth"); }}
      />
      <div className="flex-1 flex flex-col">
        <header className="bg-card border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Users className="h-6 w-6 text-primary" />Customers</h1>
            <p className="text-sm text-muted-foreground">Manage customers and credit balances</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Add Customer</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New Customer</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                  <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                </div>
                <div><Label>Address</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
                <div><Label>Notes</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              </div>
              <DialogFooter><Button onClick={handleAdd}>Add</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </header>

        <main className="flex-1 p-6 overflow-auto space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Total Customers</p><p className="text-2xl font-bold">{customers.length}</p></CardContent></Card>
            <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Outstanding Debt</p><p className="text-2xl font-bold text-amber-600">TZS {totalDebt.toLocaleString()}</p></CardContent></Card>
          </div>

          <Card>
            <CardHeader><CardTitle>All Customers</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Credit Balance</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((c: any) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell>{c.phone || "—"}</TableCell>
                      <TableCell>{c.email || "—"}</TableCell>
                      <TableCell>
                        {Number(c.credit_balance) > 0 ? (
                          <Badge variant="destructive">TZS {Number(c.credit_balance).toLocaleString()}</Badge>
                        ) : (
                          <Badge variant="secondary">No debt</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {Number(c.credit_balance) > 0 && (
                          <Button size="sm" variant="outline" onClick={() => { setSelected(c); setPayOpen(true); }}>
                            <DollarSign className="h-3 w-3 mr-1" />Record Payment
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {customers.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No customers yet</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </main>
      </div>

      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Payment from {selected?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="p-3 bg-muted rounded text-sm">Outstanding: <strong>TZS {Number(selected?.credit_balance || 0).toLocaleString()}</strong></div>
            <div><Label>Amount (TZS) *</Label><Input type="number" step="0.01" value={pay.amount} onChange={(e) => setPay({ ...pay, amount: e.target.value })} /></div>
            <div>
              <Label>Method</Label>
              <Select value={pay.payment_method} onValueChange={(v) => setPay({ ...pay, payment_method: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  <SelectItem value="bank">Bank</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Reference #</Label><Input value={pay.reference_number} onChange={(e) => setPay({ ...pay, reference_number: e.target.value })} /></div>
          </div>
          <DialogFooter><Button onClick={handlePayment}>Record</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Customers;
