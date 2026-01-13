import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatDistanceToNow } from "date-fns";

export const RecentSales = () => {
  const { t, language } = useLanguage();

  const { data: sales } = useQuery({
    queryKey: ["recent-sales-dashboard"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("medicine_sales")
        .select(`
          id,
          quantity_sold,
          total_amount,
          sale_date,
          recorded_by,
          medicines (name)
        `)
        .order("sale_date", { ascending: false })
        .limit(6);
      if (error) throw error;
      return data;
    },
  });

  const { data: profiles } = useQuery({
    queryKey: ["profiles-for-sales"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name");
      if (error) throw error;
      return data;
    },
  });

  const getProfileName = (userId: string | null) => {
    if (!userId) return "Unknown";
    const profile = profiles?.find((p) => p.id === userId);
    return profile?.full_name || "Staff";
  };

  const formatTimeAgo = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  return (
    <Card className="flex-1">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <ShoppingCart className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold">
              {language === "sw" ? "Mauzo ya Hivi Karibuni" : "Recent Sales"}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {language === "sw" ? "Miamala ya hivi karibuni" : "Latest transactions"}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {sales?.map((sale, index) => (
          <div
            key={sale.id}
            className="flex items-center justify-between py-3 border-b border-border last:border-0"
          >
            <div>
              <p className="font-medium text-sm">
                #S{String(index + 1).padStart(3, "0")} • {sale.quantity_sold} {language === "sw" ? "bidhaa" : "items"}
              </p>
              <p className="text-xs text-muted-foreground">
                {getProfileName(sale.recorded_by)} • {formatTimeAgo(sale.sale_date)}
              </p>
            </div>
            <span className="font-semibold text-foreground">
              TZS {(sale.total_amount || 0).toLocaleString()}
            </span>
          </div>
        ))}
        {(!sales || sales.length === 0) && (
          <p className="text-sm text-muted-foreground text-center py-4">
            {language === "sw" ? "Hakuna mauzo ya hivi karibuni" : "No recent sales"}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
