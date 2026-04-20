import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import { navigateForTab } from "@/lib/sidebarNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { CalendarClock, AlertTriangle, Package, Search } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { differenceInDays, format } from "date-fns";

const Expiry = () => {
  const navigate = useNavigate();
  const { isAdmin } = useUserRole();
  const [search, setSearch] = useState("");

  const { data: batches = [] } = useQuery({
    queryKey: ["batches-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("medicine_batches")
        .select("*, medicines(name), suppliers(name)")
        .gt("quantity_remaining", 0)
        .order("expiry_date", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const today = new Date();
  const expired = useMemo(
    () => batches.filter((b: any) => b.expiry_date && differenceInDays(new Date(b.expiry_date), today) < 0),
    [batches]
  );
  const soon = useMemo(
    () =>
      batches.filter((b: any) => {
        if (!b.expiry_date) return false;
        const d = differenceInDays(new Date(b.expiry_date), today);
        return d >= 0 && d <= 90;
      }),
    [batches]
  );

  const filterFn = (list: any[]) => {
    if (!search.trim()) return list;
    const s = search.toLowerCase();
    return list.filter(
      (b) =>
        b.medicines?.name?.toLowerCase().includes(s) ||
        b.batch_number?.toLowerCase().includes(s) ||
        b.suppliers?.name?.toLowerCase().includes(s)
    );
  };

  const renderTable = (list: any[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Medicine</TableHead>
          <TableHead>Batch</TableHead>
          <TableHead>Supplier</TableHead>
          <TableHead>Qty Left</TableHead>
          <TableHead>Expiry</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {list.length === 0 && (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
              No batches in this view
            </TableCell>
          </TableRow>
        )}
        {list.map((b: any) => {
          const days = b.expiry_date ? differenceInDays(new Date(b.expiry_date), today) : null;
          const variant: any =
            days === null ? "outline" : days < 0 ? "destructive" : days <= 30 ? "destructive" : days <= 90 ? "secondary" : "outline";
          const label =
            days === null ? "No expiry" : days < 0 ? `Expired ${-days}d ago` : days === 0 ? "Expires today" : `${days}d left`;
          return (
            <TableRow key={b.id}>
              <TableCell className="font-medium">{b.medicines?.name ?? "—"}</TableCell>
              <TableCell>{b.batch_number ?? "—"}</TableCell>
              <TableCell>{b.suppliers?.name ?? "—"}</TableCell>
              <TableCell>{b.quantity_remaining} / {b.quantity_received}</TableCell>
              <TableCell>{b.expiry_date ? format(new Date(b.expiry_date), "PP") : "—"}</TableCell>
              <TableCell><Badge variant={variant}>{label}</Badge></TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar
        activeTab="expiry"
        onTabChange={(t) => { if (t !== "expiry") navigateForTab(t, navigate); }}
        showAdminTabs={isAdmin}
        onLogout={async () => { await supabase.auth.signOut(); navigate("/auth"); }}
      />
      <div className="flex-1 flex flex-col">
        <header className="bg-card border-b px-6 py-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarClock className="h-6 w-6 text-primary" />
            Expiry & Batches
          </h1>
          <p className="text-sm text-muted-foreground">Track expiring stock and batch lots — FEFO compliance</p>
        </header>

        <main className="flex-1 p-6 overflow-auto space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Expired</p>
                  <p className="text-3xl font-bold text-destructive">{expired.length}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-destructive opacity-50" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Expiring ≤ 90 days</p>
                  <p className="text-3xl font-bold text-amber-600">{soon.length}</p>
                </div>
                <CalendarClock className="h-8 w-8 text-amber-600 opacity-50" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Active Batches</p>
                  <p className="text-3xl font-bold">{batches.length}</p>
                </div>
                <Package className="h-8 w-8 text-primary opacity-50" />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <CardTitle>Batch Inventory</CardTitle>
                <div className="relative w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Search medicine, batch, supplier"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="soon">
                <TabsList>
                  <TabsTrigger value="soon">Expiring Soon ({soon.length})</TabsTrigger>
                  <TabsTrigger value="expired">Expired ({expired.length})</TabsTrigger>
                  <TabsTrigger value="all">All Batches ({batches.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="soon">{renderTable(filterFn(soon))}</TabsContent>
                <TabsContent value="expired">{renderTable(filterFn(expired))}</TabsContent>
                <TabsContent value="all">{renderTable(filterFn(batches))}</TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default Expiry;
