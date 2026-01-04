import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Receipt, Pill, Activity } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface SalesSummaryProps {
  totalValue: number;
  totalTransactions: number;
  prescriptionSales: number;
  otcSales: number;
  averageSaleValue: number;
  previousMonthValue: number;
}

const SalesSummarySection = ({
  totalValue,
  totalTransactions,
  prescriptionSales,
  otcSales,
  averageSaleValue,
  previousMonthValue,
}: SalesSummaryProps) => {
  const { t } = useLanguage();
  
  const percentChange = previousMonthValue > 0 
    ? ((totalValue - previousMonthValue) / previousMonthValue) * 100 
    : 0;
  const isIncrease = percentChange > 0;
  const isDecrease = percentChange < 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          {t("salesSummary")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">{t("totalSalesValue")}</p>
            <p className="text-xl font-bold text-primary">{t("currency")} {totalValue.toLocaleString()}</p>
          </div>
          
          <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">{t("totalTransactions")}</p>
            <p className="text-xl font-bold">{totalTransactions}</p>
          </div>
          
          <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">{t("prescriptionSales")}</p>
            <p className="text-xl font-bold">{t("currency")} {prescriptionSales.toLocaleString()}</p>
          </div>
          
          <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">{t("otcSales")}</p>
            <p className="text-xl font-bold">{t("currency")} {otcSales.toLocaleString()}</p>
          </div>
          
          <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">{t("averageSaleValue")}</p>
            <p className="text-xl font-bold">{t("currency")} {averageSaleValue.toFixed(0)}</p>
          </div>
          
          <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">{t("monthComparison")}</p>
            <div className="flex items-center gap-1">
              {isIncrease && <TrendingUp className="h-4 w-4 text-green-500" />}
              {isDecrease && <TrendingDown className="h-4 w-4 text-red-500" />}
              <p className={`text-xl font-bold ${isIncrease ? 'text-green-500' : isDecrease ? 'text-red-500' : ''}`}>
                {Math.abs(percentChange).toFixed(1)}%
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              {isIncrease ? t("increase") : isDecrease ? t("decrease") : t("noChange")}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SalesSummarySection;