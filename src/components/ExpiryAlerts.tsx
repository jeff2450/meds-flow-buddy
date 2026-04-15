import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertTriangle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { differenceInDays, format } from "date-fns";

export const ExpiryAlerts = () => {
  const { language } = useLanguage();

  const { data: expiringMedicines } = useQuery({
    queryKey: ["expiring-medicines"],
    queryFn: async () => {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const { data, error } = await supabase
        .from("medicines")
        .select("id, name, expiry_date, current_stock, batch_number")
        .not("expiry_date", "is", null)
        .lte("expiry_date", format(thirtyDaysFromNow, "yyyy-MM-dd"))
        .gt("current_stock", 0)
        .order("expiry_date", { ascending: true })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
  });

  const count = expiringMedicines?.length || 0;

  return (
    <Card className="w-80">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10">
            <Clock className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold">
              {language === "sw" ? "Onyo la Kuisha Muda" : "Expiry Alerts"}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {count} {language === "sw" ? "bidhaa zinaisha muda" : "items expiring soon"}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {expiringMedicines?.slice(0, 5).map((med) => {
          const daysLeft = differenceInDays(new Date(med.expiry_date!), new Date());
          const isExpired = daysLeft < 0;

          return (
            <div key={med.id} className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{med.name}</p>
                <p className="text-xs text-muted-foreground">
                  {med.batch_number ? `Batch: ${med.batch_number}` : `${med.current_stock} units`}
                </p>
              </div>
              <Badge
                variant={isExpired ? "destructive" : "secondary"}
                className={!isExpired ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" : ""}
              >
                {isExpired
                  ? (language === "sw" ? "Imeisha" : "Expired")
                  : `${daysLeft}d`}
              </Badge>
            </div>
          );
        })}
        {count === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            {language === "sw" ? "Hakuna dawa zinazoisha muda" : "No medicines expiring soon"}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
