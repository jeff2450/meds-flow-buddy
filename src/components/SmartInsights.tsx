import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TrendingUp, PackageX, ShoppingBag } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface SaleRow {
  medicine_id: string;
  quantity_sold: number;
  total_amount: number | null;
  sale_date: string;
  medicines: { name: string; current_stock: number; min_stock_level: number } | null;
}

export const SmartInsights = () => {
  const { language } = useLanguage();
  const tr = (en: string, sw: string) => (language === "sw" ? sw : en);

  const { data: insights } = useQuery({
    queryKey: ["smart-insights"],
    queryFn: async () => {
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: sales } = await supabase
        .from("medicine_sales")
        .select("medicine_id, quantity_sold, total_amount, sale_date, medicines(name, current_stock, min_stock_level)")
        .gte("sale_date", sixtyDaysAgo.toISOString().split("T")[0]);

      const { data: allMeds } = await supabase
        .from("medicines")
        .select("id, name, current_stock, min_stock_level");

      const rows = (sales || []) as unknown as SaleRow[];

      // Top sellers (by qty in last 30 days)
      const sellerMap = new Map<string, { name: string; qty: number; revenue: number }>();
      rows
        .filter((r) => new Date(r.sale_date) >= thirtyDaysAgo)
        .forEach((r) => {
          const ex = sellerMap.get(r.medicine_id);
          const name = r.medicines?.name || "Unknown";
          if (ex) {
            ex.qty += r.quantity_sold;
            ex.revenue += r.total_amount || 0;
          } else {
            sellerMap.set(r.medicine_id, { name, qty: r.quantity_sold, revenue: r.total_amount || 0 });
          }
        });
      const topSellers = Array.from(sellerMap.values())
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 5);

      // Reorder suggestions: 30-day velocity > current stock / 14 (i.e. <2 weeks left)
      const velocityMap = new Map<string, number>();
      rows
        .filter((r) => new Date(r.sale_date) >= thirtyDaysAgo)
        .forEach((r) => {
          velocityMap.set(r.medicine_id, (velocityMap.get(r.medicine_id) || 0) + r.quantity_sold);
        });
      const reorder = (allMeds || [])
        .map((m) => {
          const sold30 = velocityMap.get(m.id) || 0;
          const dailyRate = sold30 / 30;
          const daysLeft = dailyRate > 0 ? Math.floor(m.current_stock / dailyRate) : Infinity;
          return { ...m, sold30, dailyRate, daysLeft };
        })
        .filter((m) => m.dailyRate > 0 && m.daysLeft <= 14)
        .sort((a, b) => a.daysLeft - b.daysLeft)
        .slice(0, 5);

      // Dead stock: medicines with stock > 0 and no sales in 60 days
      const soldIds = new Set(rows.map((r) => r.medicine_id));
      const deadStock = (allMeds || [])
        .filter((m) => m.current_stock > 0 && !soldIds.has(m.id))
        .slice(0, 5);

      return { topSellers, reorder, deadStock };
    },
  });

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Top Sellers */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-success" />
            {tr("Top Sellers (30d)", "Vinavyouzwa Zaidi (siku 30)")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-48">
            {insights?.topSellers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                {tr("No sales yet", "Hakuna mauzo bado")}
              </p>
            ) : (
              <div className="space-y-2">
                {insights?.topSellers.map((s, i) => (
                  <div key={i} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{s.name}</p>
                      <p className="text-xs text-muted-foreground">
                        TZS {s.revenue.toLocaleString()}
                      </p>
                    </div>
                    <Badge variant="secondary">{s.qty}</Badge>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Reorder Suggestions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-amber-500" />
            {tr("Reorder Soon", "Agiza Tena")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-48">
            {insights?.reorder.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                {tr("All stocked", "Hisa tosha")}
              </p>
            ) : (
              <div className="space-y-2">
                {insights?.reorder.map((m) => (
                  <div key={m.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{m.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {tr(`${m.daysLeft}d left · ${m.dailyRate.toFixed(1)}/day`, `Siku ${m.daysLeft} · ${m.dailyRate.toFixed(1)}/siku`)}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-amber-600 border-amber-300">
                      {m.current_stock}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Dead Stock */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <PackageX className="h-4 w-4 text-destructive" />
            {tr("Dead Stock (60d)", "Hisa Iliyolala (siku 60)")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-48">
            {insights?.deadStock.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                {tr("Nothing stale", "Hakuna iliyolala")}
              </p>
            ) : (
              <div className="space-y-2">
                {insights?.deadStock.map((m) => (
                  <div key={m.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{m.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {tr("No sales in 60 days", "Hakuna mauzo siku 60")}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-destructive border-destructive/40">
                      {m.current_stock}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
