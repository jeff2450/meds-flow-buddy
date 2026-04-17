import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, AlertTriangle, Package, DollarSign } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { format, startOfMonth, endOfMonth, subDays } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";
import { Badge } from "@/components/ui/badge";

const Reports = () => {
  const navigate = useNavigate();
  const { isAdmin } = useUserRole();

  const today = format(new Date(), "yyyy-MM-dd");
  const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");
  const sevenAgo = format(subDays(new Date(), 6), "yyyy-MM-dd");

  const { data } = useQuery({
    queryKey: ["reports-data"],
    queryFn: async () => {
      const [todaySales, monthSales, lowStock, topProducts, weekSales, expenses] = await Promise.all([
        supabase.from("medicine_sales").select("total_amount").eq("sale_date", today),
        supabase.from("medicine_sales").select("total_amount, quantity_sold, medicines(cost_price)").gte("sale_date", monthStart).lte("sale_date", monthEnd),
        supabase.from("medicines").select("id, name, current_stock, min_stock_level").lte("current_stock", 20).order("current_stock"),
        supabase.from("medicine_sales").select("quantity_sold, total_amount, medicines(name)").gte("sale_date", monthStart),
        supabase.from("medicine_sales").select("sale_date, total_amount").gte("sale_date", sevenAgo),
        supabase.from("expenses").select("amount").gte("expense_date", monthStart).lte("expense_date", monthEnd),
      ]);

      const todayRevenue = (todaySales.data || []).reduce((s, r: any) => s + Number(r.total_amount || 0), 0);
      const monthRevenue = (monthSales.data || []).reduce((s, r: any) => s + Number(r.total_amount || 0), 0);
      const monthCogs = (monthSales.data || []).reduce((s, r: any) => s + r.quantity_sold * Number(r.medicines?.cost_price || 0), 0);
      const monthExpenses = (expenses.data || []).reduce((s, r: any) => s + Number(r.amount), 0);

      // Top products aggregation
      const productMap = new Map<string, { qty: number; revenue: number }>();
      (topProducts.data || []).forEach((s: any) => {
        const name = s.medicines?.name;
        if (!name) return;
        const cur = productMap.get(name) || { qty: 0, revenue: 0 };
        cur.qty += s.quantity_sold;
        cur.revenue += Number(s.total_amount || 0);
        productMap.set(name, cur);
      });
      const top = Array.from(productMap.entries())
        .map(([name, v]) => ({ name, ...v }))
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 10);

      // 7-day trend
      const trendMap = new Map<string, number>();
      for (let i = 6; i >= 0; i--) {
        const d = format(subDays(new Date(), i), "yyyy-MM-dd");
        trendMap.set(d, 0);
      }
      (weekSales.data || []).forEach((s: any) => {
        trendMap.set(s.sale_date, (trendMap.get(s.sale_date) || 0) + Number(s.total_amount || 0));
      });
      const trend = Array.from(trendMap.entries()).map(([date, total]) => ({
        date: format(new Date(date), "MMM d"),
        total,
      }));

      return {
        todayRevenue,
        monthRevenue,
        grossProfit: monthRevenue - monthCogs,
        netProfit: monthRevenue - monthCogs - monthExpenses,
        lowStock: lowStock.data || [],
        top,
        trend,
      };
    },
  });

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar
        activeTab="reports-dashboard"
        onTabChange={(t) => (t === "dashboard" ? navigate("/") : navigate(`/${t}`))}
        showAdminTabs={isAdmin}
        onLogout={async () => { await supabase.auth.signOut(); navigate("/auth"); }}
      />
      <div className="flex-1 flex flex-col">
        <header className="bg-card border-b px-6 py-4">
          <h1 className="text-2xl font-bold flex items-center gap-2"><BarChart3 className="h-6 w-6 text-primary" />Reports Dashboard</h1>
          <p className="text-sm text-muted-foreground">Real-time business intelligence</p>
        </header>

        <main className="flex-1 p-6 overflow-auto space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Today's Sales</p>
                    <p className="text-2xl font-bold">TZS {(data?.todayRevenue || 0).toLocaleString()}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-primary opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Month Revenue</p>
                    <p className="text-2xl font-bold">TZS {(data?.monthRevenue || 0).toLocaleString()}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-muted-foreground">Gross Profit</p>
                <p className="text-2xl font-bold text-green-600">TZS {(data?.grossProfit || 0).toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-muted-foreground">Net Profit</p>
                <p className={`text-2xl font-bold ${(data?.netProfit || 0) >= 0 ? "text-green-600" : "text-destructive"}`}>
                  TZS {(data?.netProfit || 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle>Daily Sales (Last 7 days)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={data?.trend || []}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="date" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip formatter={(v: any) => `TZS ${v.toLocaleString()}`} />
                    <Line type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Top Selling Medicines</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={data?.top || []} layout="vertical">
                    <XAxis type="number" fontSize={12} />
                    <YAxis dataKey="name" type="category" width={100} fontSize={11} />
                    <Tooltip />
                    <Bar dataKey="qty" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Low Stock Items ({data?.lowStock.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data?.lowStock.length === 0 ? (
                <p className="text-center text-muted-foreground py-6">All stock levels healthy ✓</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {data?.lowStock.map((m: any) => (
                    <div key={m.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{m.name}</span>
                      </div>
                      <Badge variant={m.current_stock === 0 ? "destructive" : "outline"}>
                        {m.current_stock} left
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default Reports;
