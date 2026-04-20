import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import { useNavigate } from "react-router-dom";
import { navigateForTab } from "@/lib/sidebarNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Wallet, Plus, TrendingDown, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { useOrganization } from "@/hooks/useOrganization";
import { format, startOfMonth, endOfMonth } from "date-fns";

const CATEGORIES = ["rent", "salary", "utility", "supplies", "transport", "marketing", "maintenance", "other"];

const Expenses = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAdmin } = useUserRole();
  const { organizationId } = useOrganization();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    category: "rent",
    description: "",
    amount: "",
    expense_date: format(new Date(), "yyyy-MM-dd"),
    payment_method: "cash",
    reference_number: "",
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ["expenses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("expenses").select("*").order("expense_date", { ascending: false }).limit(200);
      if (error) throw error;
      return data;
    },
  });

  // Net profit calculation: this month sales - this month cost - this month expenses
  const { data: profitData } = useQuery({
    queryKey: ["profit-this-month"],
    queryFn: async () => {
      const start = format(startOfMonth(new Date()), "yyyy-MM-dd");
      const end = format(endOfMonth(new Date()), "yyyy-MM-dd");
      const [sales, cogs, exp] = await Promise.all([
        supabase.from("medicine_sales").select("total_amount").gte("sale_date", start).lte("sale_date", end),
        supabase.from("medicine_sales").select("quantity_sold, medicines(cost_price)").gte("sale_date", start).lte("sale_date", end),
        supabase.from("expenses").select("amount").gte("expense_date", start).lte("expense_date", end),
      ]);
      const revenue = (sales.data || []).reduce((s, r: any) => s + Number(r.total_amount || 0), 0);
      const costOfGoods = (cogs.data || []).reduce((s, r: any) => s + r.quantity_sold * Number(r.medicines?.cost_price || 0), 0);
      const totalExpenses = (exp.data || []).reduce((s, r: any) => s + Number(r.amount), 0);
      return { revenue, costOfGoods, totalExpenses, grossProfit: revenue - costOfGoods, netProfit: revenue - costOfGoods - totalExpenses };
    },
  });

  const monthTotal = useMemo(() => {
    const start = startOfMonth(new Date());
    return expenses.filter((e: any) => new Date(e.expense_date) >= start).reduce((s, e: any) => s + Number(e.amount), 0);
  }, [expenses]);

  const handleAdd = async () => {
    if (!form.description || !form.amount) {
      toast({ variant: "destructive", title: "Missing fields" });
      return;
    }
    const { error } = await supabase.from("expenses").insert({
      organization_id: organizationId,
      category: form.category,
      description: form.description,
      amount: parseFloat(form.amount),
      expense_date: form.expense_date,
      payment_method: form.payment_method,
      reference_number: form.reference_number || null,
    });
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
      return;
    }
    toast({ title: "Expense recorded" });
    setForm({ category: "rent", description: "", amount: "", expense_date: format(new Date(), "yyyy-MM-dd"), payment_method: "cash", reference_number: "" });
    setOpen(false);
    queryClient.invalidateQueries({ queryKey: ["expenses"] });
    queryClient.invalidateQueries({ queryKey: ["profit-this-month"] });
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar
        activeTab="expenses"
        onTabChange={(t) => { if (t !== "expenses") navigateForTab(t, navigate); }}
        showAdminTabs={isAdmin}
        onLogout={async () => { await supabase.auth.signOut(); navigate("/auth"); }}
      />
      <div className="flex-1 flex flex-col">
        <header className="bg-card border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Wallet className="h-6 w-6 text-primary" />Expenses & Profit</h1>
            <p className="text-sm text-muted-foreground">Track expenses and net profit</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Add Expense</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New Expense</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Category</Label>
                    <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Date</Label><Input type="date" value={form.expense_date} onChange={(e) => setForm({ ...form, expense_date: e.target.value })} /></div>
                </div>
                <div><Label>Description *</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Amount (TZS) *</Label><Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
                  <div>
                    <Label>Payment</Label>
                    <Select value={form.payment_method} onValueChange={(v) => setForm({ ...form, payment_method: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="mobile_money">Mobile Money</SelectItem>
                        <SelectItem value="bank">Bank</SelectItem>
                        <SelectItem value="credit">Credit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div><Label>Reference #</Label><Input value={form.reference_number} onChange={(e) => setForm({ ...form, reference_number: e.target.value })} /></div>
              </div>
              <DialogFooter><Button onClick={handleAdd}>Add</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </header>

        <main className="flex-1 p-6 overflow-auto space-y-4">
          {/* Profit summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Revenue (month)</p><p className="text-2xl font-bold">TZS {(profitData?.revenue || 0).toLocaleString()}</p></CardContent></Card>
            <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Cost of Goods</p><p className="text-2xl font-bold">TZS {(profitData?.costOfGoods || 0).toLocaleString()}</p></CardContent></Card>
            <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Expenses (month)</p><p className="text-2xl font-bold text-amber-600">TZS {monthTotal.toLocaleString()}</p></CardContent></Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  Net Profit {(profitData?.netProfit || 0) >= 0 ? <TrendingUp className="h-3 w-3 text-green-600" /> : <TrendingDown className="h-3 w-3 text-destructive" />}
                </p>
                <p className={`text-2xl font-bold ${(profitData?.netProfit || 0) >= 0 ? "text-green-600" : "text-destructive"}`}>
                  TZS {(profitData?.netProfit || 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Recent Expenses</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Ref #</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((e: any) => (
                    <TableRow key={e.id}>
                      <TableCell>{format(new Date(e.expense_date), "PP")}</TableCell>
                      <TableCell><Badge variant="outline">{e.category}</Badge></TableCell>
                      <TableCell>{e.description}</TableCell>
                      <TableCell className="font-bold">TZS {Number(e.amount).toLocaleString()}</TableCell>
                      <TableCell>{e.payment_method.replace("_", " ")}</TableCell>
                      <TableCell>{e.reference_number || "—"}</TableCell>
                    </TableRow>
                  ))}
                  {expenses.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No expenses yet</TableCell></TableRow>
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

export default Expenses;
