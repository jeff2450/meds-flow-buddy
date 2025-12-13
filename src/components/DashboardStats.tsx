import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, TrendingDown, TrendingUp, AlertTriangle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export const DashboardStats = () => {
  const { t, language } = useLanguage();
  
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

  const { data: transactions } = useQuery({
    queryKey: ["recent-transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stock_transactions")
        .select("*")
        .order("transaction_date", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  const totalMedicines = medicines?.length || 0;
  const totalStock = medicines?.reduce((sum, med) => sum + med.current_stock, 0) || 0;
  const lowStockCount = medicines?.filter(med => med.current_stock <= med.min_stock_level).length || 0;
  
  const recentIntake = transactions?.filter(t => t.transaction_type === "intake").length || 0;
  const recentOuttake = transactions?.filter(t => t.transaction_type === "outtake").length || 0;

  const stats = [
    {
      title: t("totalMedicines"),
      value: totalMedicines,
      icon: Package,
      description: language === "sw" ? `${totalStock} vitengo kwenye hisa` : `${totalStock} units in stock`,
      gradient: "from-primary to-primary-glow",
    },
    {
      title: language === "sw" ? "Upokeaji wa Hivi Karibuni" : "Recent Intake",
      value: recentIntake,
      icon: TrendingUp,
      description: language === "sw" ? "Miamala 10 ya mwisho" : "Last 10 transactions",
      gradient: "from-success to-emerald-500",
    },
    {
      title: language === "sw" ? "Utoaji wa Hivi Karibuni" : "Recent Outtake",
      value: recentOuttake,
      icon: TrendingDown,
      description: language === "sw" ? "Miamala 10 ya mwisho" : "Last 10 transactions",
      gradient: "from-accent to-purple-600",
    },
    {
      title: t("lowStock"),
      value: lowStockCount,
      icon: AlertTriangle,
      description: language === "sw" ? "Chini ya kiwango cha chini" : "Below minimum level",
      gradient: lowStockCount > 0 ? "from-destructive to-red-600" : "from-muted to-muted-foreground",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title} className="overflow-hidden shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {stat.title}
            </CardTitle>
            <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.gradient}`}>
              <stat.icon className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
