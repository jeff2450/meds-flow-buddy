import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, Package, AlertTriangle, TrendingUp } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { startOfDay, endOfDay } from "date-fns";

export const DashboardStats = () => {
  const { language } = useLanguage();
  
  const { data: medicines } = useQuery({
    queryKey: ["medicines"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("medicines")
        .select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: todaySales } = useQuery({
    queryKey: ["today-sales"],
    queryFn: async () => {
      const today = new Date();
      const { data, error } = await supabase
        .from("medicine_sales")
        .select("total_amount")
        .gte("sale_date", startOfDay(today).toISOString())
        .lte("sale_date", endOfDay(today).toISOString());
      if (error) throw error;
      return data;
    },
  });

  const totalMedicines = medicines?.length || 0;
  const lowStockCount = medicines?.filter(med => med.current_stock <= med.min_stock_level).length || 0;
  const inventoryValue = medicines?.reduce((sum, med) => sum + (med.current_stock * (med.cost_price || 0)), 0) || 0;
  const todayTotal = todaySales?.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) || 0;

  const stats = [
    {
      title: language === "sw" ? "Mauzo ya Leo" : "Today's Sales",
      value: `TZS ${todayTotal.toLocaleString()}`,
      icon: DollarSign,
      description: language === "sw" ? "+12.5% vs jana" : "+12.5% vs yesterday",
      gradient: "from-primary to-primary-glow",
      descColor: "text-success",
    },
    {
      title: language === "sw" ? "Jumla ya Bidhaa" : "Total Products",
      value: totalMedicines,
      icon: Package,
      description: "",
      gradient: "from-blue-500 to-blue-600",
      descColor: "",
    },
    {
      title: language === "sw" ? "Bidhaa Chache" : "Low Stock Items",
      value: lowStockCount,
      icon: AlertTriangle,
      description: "",
      gradient: lowStockCount > 0 ? "from-destructive to-red-600" : "from-muted to-muted-foreground",
      descColor: "",
    },
    {
      title: language === "sw" ? "Thamani ya Hisa" : "Inventory Value",
      value: `TZS ${inventoryValue.toLocaleString()}`,
      icon: TrendingUp,
      description: "",
      gradient: "from-accent to-purple-600",
      descColor: "",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-card">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium mb-1">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                {stat.description && (
                  <p className={`text-xs mt-1 font-medium ${stat.descColor}`}>
                    {stat.description}
                  </p>
                )}
              </div>
              <div className={`p-2.5 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-sm`}>
                <stat.icon className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
