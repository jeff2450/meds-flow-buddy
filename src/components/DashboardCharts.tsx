import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { TrendingUp, BarChart3 } from "lucide-react";

export const DashboardCharts = () => {
  const { language } = useLanguage();

  // Daily sales trend (last 14 days)
  const { data: dailySales } = useQuery({
    queryKey: ["daily-sales-trend"],
    queryFn: async () => {
      const days = 14;
      const startDate = startOfDay(subDays(new Date(), days - 1));
      
      const { data, error } = await supabase
        .from("medicine_sales")
        .select("sale_date, total_amount")
        .gte("sale_date", format(startDate, "yyyy-MM-dd"));
      
      if (error) throw error;

      // Aggregate by date
      const map = new Map<string, number>();
      for (let i = 0; i < days; i++) {
        const d = format(subDays(new Date(), days - 1 - i), "yyyy-MM-dd");
        map.set(d, 0);
      }
      
      data?.forEach((sale) => {
        const existing = map.get(sale.sale_date) || 0;
        map.set(sale.sale_date, existing + (Number(sale.total_amount) || 0));
      });

      return Array.from(map.entries()).map(([date, total]) => ({
        date: format(new Date(date), "MMM dd"),
        total,
      }));
    },
  });

  // Top selling medicines (this month)
  const { data: topMedicines } = useQuery({
    queryKey: ["top-selling-medicines"],
    queryFn: async () => {
      const firstOfMonth = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "yyyy-MM-dd");
      
      const { data, error } = await supabase
        .from("medicine_sales")
        .select("quantity_sold, total_amount, medicines(name)")
        .gte("sale_date", firstOfMonth);
      
      if (error) throw error;

      // Aggregate by medicine name
      const map = new Map<string, { quantity: number; revenue: number }>();
      data?.forEach((sale) => {
        const name = (sale.medicines as any)?.name || "Unknown";
        const existing = map.get(name) || { quantity: 0, revenue: 0 };
        map.set(name, {
          quantity: existing.quantity + sale.quantity_sold,
          revenue: existing.revenue + (Number(sale.total_amount) || 0),
        });
      });

      return Array.from(map.entries())
        .map(([name, stats]) => ({ name: name.length > 15 ? name.slice(0, 15) + "…" : name, ...stats }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 8);
    },
  });

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Daily Sales Trend */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-primary" />
            {language === "sw" ? "Mwenendo wa Mauzo" : "Sales Trend"}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {language === "sw" ? "Siku 14 zilizopita" : "Last 14 days"}
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailySales || []}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--foreground))",
                  }}
                  formatter={(value: number) => [`TZS ${value.toLocaleString()}`, language === "sw" ? "Mauzo" : "Sales"]}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#salesGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Top Selling Medicines */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5 text-primary" />
            {language === "sw" ? "Dawa Zinazouzwa Zaidi" : "Top Selling Medicines"}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {language === "sw" ? "Mwezi huu" : "This month"}
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topMedicines || []} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <YAxis dataKey="name" type="category" width={100} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--foreground))",
                  }}
                  formatter={(value: number) => [`TZS ${value.toLocaleString()}`, language === "sw" ? "Mapato" : "Revenue"]}
                />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
