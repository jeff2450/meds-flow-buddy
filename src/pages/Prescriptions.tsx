import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import { navigateForTab } from "@/lib/sidebarNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Plus, ShieldAlert, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { useOrganization } from "@/hooks/useOrganization";
import { format, differenceInDays, addDays } from "date-fns";

interface Item {
  medicine_id: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity_prescribed: number;
}

const empty: Item = { medicine_id: "", dosage: "", frequency: "", duration: "", quantity_prescribed: 1 };

const Prescriptions = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAdmin } = useUserRole();
  const { organizationId } = useOrganization();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    patient_name: "",
    patient_phone: "",
    patient_age: "",
    prescriber_name: "",
    prescriber_license: "",
    prescriber_contact: "",
    prescription_number: "",
    diagnosis: "",
    notes: "",
    is_controlled: false,
    issued_date: format(new Date(), "yyyy-MM-dd"),
    valid_until: format(addDays(new Date(), 30), "yyyy-MM-dd"),
    max_refills: "0",
    customer_id: "",
  });
  const [items, setItems] = useState<Item[]>([{ ...empty }]);

  const { data: list = [] } = useQuery({
    queryKey: ["prescriptions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prescriptions")
        .select("*, customers(name), prescription_items(*, medicines(name))")
        .order("issued_date", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: medicines = [] } = useQuery({
    queryKey: ["pres-medicines"],
    queryFn: async () => {
      const { data } = await supabase.from("medicines").select("id, name, medicine_type").order("name");
      return data ?? [];
    },
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["pres-customers"],
    queryFn: async () => {
      const { data } = await supabase.from("customers").select("id, name").order("name");
      return data ?? [];
    },
  });

  const reset = () => {
    setForm({
      patient_name: "", patient_phone: "", patient_age: "",
      prescriber_name: "", prescriber_license: "", prescriber_contact: "",
      prescription_number: "", diagnosis: "", notes: "",
      is_controlled: false,
      issued_date: format(new Date(), "yyyy-MM-dd"),
      valid_until: format(addDays(new Date(), 30), "yyyy-MM-dd"),
      max_refills: "0", customer_id: "",
    });
    setItems([{ ...empty }]);
  };

  const handleSave = async () => {
    if (!form.patient_name || !form.prescriber_name) {
      toast({ variant: "destructive", title: "Missing fields", description: "Patient and prescriber names required" });
      return;
    }
    const validItems = items.filter((i) => i.medicine_id && i.quantity_prescribed > 0);
    if (validItems.length === 0) {
      toast({ variant: "destructive", title: "No items", description: "Add at least one medicine" });
      return;
    }

    const { data: pres, error } = await supabase
      .from("prescriptions")
      .insert({
        organization_id: organizationId!,
        patient_name: form.patient_name,
        patient_phone: form.patient_phone || null,
        patient_age: form.patient_age ? parseInt(form.patient_age) : null,
        prescriber_name: form.prescriber_name,
        prescriber_license: form.prescriber_license || null,
        prescriber_contact: form.prescriber_contact || null,
        prescription_number: form.prescription_number || null,
        diagnosis: form.diagnosis || null,
        notes: form.notes || null,
        is_controlled: form.is_controlled,
        issued_date: form.issued_date,
        valid_until: form.valid_until || null,
        max_refills: parseInt(form.max_refills || "0"),
        customer_id: form.customer_id || null,
      })
      .select()
      .single();

    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
      return;
    }

    const itemsRows = validItems.map((i) => ({
      prescription_id: pres.id,
      medicine_id: i.medicine_id,
      dosage: i.dosage || null,
      frequency: i.frequency || null,
      duration: i.duration || null,
      quantity_prescribed: i.quantity_prescribed,
    }));
    const { error: e2 } = await supabase.from("prescription_items").insert(itemsRows);
    if (e2) {
      toast({ variant: "destructive", title: "Items error", description: e2.message });
      return;
    }

    toast({ title: "Prescription saved", description: `${validItems.length} item(s) recorded` });
    reset();
    setOpen(false);
    queryClient.invalidateQueries({ queryKey: ["prescriptions"] });
  };

  const statusBadge = (p: any) => {
    if (p.status === "cancelled") return <Badge variant="outline">Cancelled</Badge>;
    if (p.status === "completed") return <Badge variant="secondary">Completed</Badge>;
    if (p.valid_until && differenceInDays(new Date(p.valid_until), new Date()) < 0)
      return <Badge variant="destructive">Expired</Badge>;
    return <Badge>Active</Badge>;
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar
        activeTab="prescriptions"
        onTabChange={(t) => { if (t !== "prescriptions") navigateForTab(t, navigate); }}
        showAdminTabs={isAdmin}
        onLogout={async () => { await supabase.auth.signOut(); navigate("/auth"); }}
      />
      <div className="flex-1 flex flex-col">
        <header className="bg-card border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />Prescriptions
            </h1>
            <p className="text-sm text-muted-foreground">Patient prescriptions, refills & controlled-drug compliance</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />New Prescription</Button></DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>New Prescription</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div><Label>Patient Name *</Label><Input value={form.patient_name} onChange={(e) => setForm({ ...form, patient_name: e.target.value })} /></div>
                  <div><Label>Phone</Label><Input value={form.patient_phone} onChange={(e) => setForm({ ...form, patient_phone: e.target.value })} /></div>
                  <div><Label>Age</Label><Input type="number" value={form.patient_age} onChange={(e) => setForm({ ...form, patient_age: e.target.value })} /></div>
                </div>
                <div>
                  <Label>Linked Customer (optional)</Label>
                  <Select value={form.customer_id} onValueChange={(v) => setForm({ ...form, customer_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                    <SelectContent>
                      {customers.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div><Label>Prescriber Name *</Label><Input value={form.prescriber_name} onChange={(e) => setForm({ ...form, prescriber_name: e.target.value })} /></div>
                  <div><Label>License #</Label><Input value={form.prescriber_license} onChange={(e) => setForm({ ...form, prescriber_license: e.target.value })} /></div>
                  <div><Label>Contact</Label><Input value={form.prescriber_contact} onChange={(e) => setForm({ ...form, prescriber_contact: e.target.value })} /></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div><Label>Prescription #</Label><Input value={form.prescription_number} onChange={(e) => setForm({ ...form, prescription_number: e.target.value })} /></div>
                  <div><Label>Issued</Label><Input type="date" value={form.issued_date} onChange={(e) => setForm({ ...form, issued_date: e.target.value })} /></div>
                  <div><Label>Valid Until</Label><Input type="date" value={form.valid_until} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} /></div>
                  <div><Label>Max Refills</Label><Input type="number" value={form.max_refills} onChange={(e) => setForm({ ...form, max_refills: e.target.value })} /></div>
                </div>

                <div><Label>Diagnosis</Label><Input value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} /></div>

                <div className="flex items-center gap-3 p-3 rounded-md border bg-muted/40">
                  <ShieldAlert className="h-5 w-5 text-amber-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Controlled drug prescription</p>
                    <p className="text-xs text-muted-foreground">Requires extra audit logging</p>
                  </div>
                  <Switch checked={form.is_controlled} onCheckedChange={(v) => setForm({ ...form, is_controlled: v })} />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Items</Label>
                    <Button size="sm" variant="outline" onClick={() => setItems([...items, { ...empty }])}>
                      <Plus className="h-3 w-3 mr-1" />Add Item
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {items.map((it, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2 items-end p-2 border rounded">
                        <div className="col-span-4">
                          <Label className="text-xs">Medicine</Label>
                          <Select value={it.medicine_id} onValueChange={(v) => {
                            const next = [...items]; next[idx] = { ...it, medicine_id: v }; setItems(next);
                          }}>
                            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent>
                              {medicines.map((m: any) => (
                                <SelectItem key={m.id} value={m.id}>
                                  {m.name}{m.medicine_type === "controlled" ? " ⚠" : ""}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2"><Label className="text-xs">Dosage</Label><Input value={it.dosage} onChange={(e) => { const n = [...items]; n[idx] = { ...it, dosage: e.target.value }; setItems(n); }} /></div>
                        <div className="col-span-2"><Label className="text-xs">Frequency</Label><Input value={it.frequency} placeholder="3x/day" onChange={(e) => { const n = [...items]; n[idx] = { ...it, frequency: e.target.value }; setItems(n); }} /></div>
                        <div className="col-span-2"><Label className="text-xs">Duration</Label><Input value={it.duration} placeholder="7 days" onChange={(e) => { const n = [...items]; n[idx] = { ...it, duration: e.target.value }; setItems(n); }} /></div>
                        <div className="col-span-1"><Label className="text-xs">Qty</Label><Input type="number" value={it.quantity_prescribed} onChange={(e) => { const n = [...items]; n[idx] = { ...it, quantity_prescribed: parseInt(e.target.value) || 0 }; setItems(n); }} /></div>
                        <div className="col-span-1">
                          <Button size="icon" variant="ghost" onClick={() => setItems(items.filter((_, i) => i !== idx))}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              </div>
              <DialogFooter><Button onClick={handleSave}>Save Prescription</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          <Card>
            <CardHeader><CardTitle>Recent Prescriptions ({list.length})</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Prescriber</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Refills</TableHead>
                    <TableHead>Valid Until</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.length === 0 && (
                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No prescriptions yet</TableCell></TableRow>
                  )}
                  {list.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell>{format(new Date(p.issued_date), "PP")}</TableCell>
                      <TableCell className="font-medium">
                        {p.patient_name}
                        {p.is_controlled && <Badge variant="destructive" className="ml-2">Controlled</Badge>}
                      </TableCell>
                      <TableCell>{p.prescriber_name}</TableCell>
                      <TableCell>
                        {p.prescription_items?.map((i: any) => i.medicines?.name).filter(Boolean).join(", ") || "—"}
                      </TableCell>
                      <TableCell>{p.refills_used} / {p.max_refills}</TableCell>
                      <TableCell>{p.valid_until ? format(new Date(p.valid_until), "PP") : "—"}</TableCell>
                      <TableCell>{statusBadge(p)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default Prescriptions;
