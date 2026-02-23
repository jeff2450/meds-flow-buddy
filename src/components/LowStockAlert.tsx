import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export const LowStockAlert = () => {
  const { language } = useLanguage();

  const { data: lowStockMedicines } = useQuery({
    queryKey: ["low-stock-medicines"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("medicines")
        .select("id, name, current_stock, min_stock_level, category_id, medicine_categories(name)")
        .order("current_stock", { ascending: true })
        .limit(10);
      if (error) throw error;
      return data?.filter(med => med.current_stock <= med.min_stock_level) || [];
    },
  });

  const count = lowStockMedicines?.length || 0;

  return (
    <Card className="w-80">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-destructive/10">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold">
              {language === "sw" ? "Onyo la Hisa Chache" : "Low Stock Alert"}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {count} {language === "sw" ? "bidhaa zinahitaji kujazwa" : "items need restocking"}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {lowStockMedicines?.slice(0, 5).map((med) => (
          <div key={med.id} className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{med.name}</p>
              <p className="text-xs text-muted-foreground">
                {med.medicine_categories?.name || (language === "sw" ? "Bila kategoria" : "Uncategorized")}
              </p>
            </div>
            <span className={`text-sm font-semibold ${
              med.current_stock === 0 
                ? "text-destructive" 
                : "text-orange-500"
            }`}>
              {med.current_stock === 0
                ? (language === "sw" ? "Imeisha" : "Out of Stock")
                : `${med.current_stock} ${language === "sw" ? "zimebaki" : "left"}`
              }
            </span>
          </div>
        ))}
        {count === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            {language === "sw" ? "Hakuna bidhaa zenye hisa chache" : "No low stock items"}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
