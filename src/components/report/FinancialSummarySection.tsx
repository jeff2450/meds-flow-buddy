import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, TrendingDown, DollarSign, Percent } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface MarginMedicine {
  name: string;
  margin: number;
  revenue: number;
  cost: number;
}

interface FinancialSummaryProps {
  totalRevenue: number;
  cogs: number;
  grossProfit: number;
  grossProfitMargin: number;
  highMarginMedicines: MarginMedicine[];
  lowMarginMedicines: MarginMedicine[];
}

const FinancialSummarySection = ({
  totalRevenue,
  cogs,
  grossProfit,
  grossProfitMargin,
  highMarginMedicines,
  lowMarginMedicines,
}: FinancialSummaryProps) => {
  const { t } = useLanguage();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          {t("financialSummary")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Key Financial Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
            <p className="text-xs text-muted-foreground mb-1">{t("totalRevenue")}</p>
            <p className="text-2xl font-bold text-green-600">{t("currency")} {totalRevenue.toLocaleString()}</p>
          </div>
          
          <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900">
            <p className="text-xs text-muted-foreground mb-1">{t("costOfGoodsSold")}</p>
            <p className="text-2xl font-bold text-red-600">{t("currency")} {cogs.toLocaleString()}</p>
          </div>
          
          <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
            <p className="text-xs text-muted-foreground mb-1">{t("grossProfit")}</p>
            <p className={`text-2xl font-bold ${grossProfit >= 0 ? 'text-primary' : 'text-destructive'}`}>
              {t("currency")} {grossProfit.toLocaleString()}
            </p>
          </div>
          
          <div className="p-4 bg-muted/50 rounded-lg border">
            <p className="text-xs text-muted-foreground mb-1">{t("grossProfitMargin")}</p>
            <div className="flex items-center gap-2">
              <Percent className="h-5 w-5 text-muted-foreground" />
              <p className={`text-2xl font-bold ${grossProfitMargin >= 20 ? 'text-green-600' : grossProfitMargin >= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                {grossProfitMargin.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        {/* Margin Analysis */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* High Margin */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <h4 className="font-medium text-green-600">{t("highMarginMedicines")}</h4>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("medicine")}</TableHead>
                  <TableHead className="text-right">{t("grossProfitMargin")}</TableHead>
                  <TableHead className="text-right">{t("grossProfit")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {highMarginMedicines.length > 0 ? highMarginMedicines.slice(0, 5).map((med) => (
                  <TableRow key={med.name}>
                    <TableCell className="font-medium">{med.name}</TableCell>
                    <TableCell className="text-right text-green-600">{med.margin.toFixed(1)}%</TableCell>
                    <TableCell className="text-right">{t("currency")} {(med.revenue - med.cost).toLocaleString()}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">{t("noData")}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Low Margin */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown className="h-4 w-4 text-red-500" />
              <h4 className="font-medium text-red-600">{t("lowMarginMedicines")}</h4>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("medicine")}</TableHead>
                  <TableHead className="text-right">{t("grossProfitMargin")}</TableHead>
                  <TableHead className="text-right">{t("grossProfit")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowMarginMedicines.length > 0 ? lowMarginMedicines.slice(0, 5).map((med) => (
                  <TableRow key={med.name}>
                    <TableCell className="font-medium">{med.name}</TableCell>
                    <TableCell className="text-right text-red-600">{med.margin.toFixed(1)}%</TableCell>
                    <TableCell className="text-right">{t("currency")} {(med.revenue - med.cost).toLocaleString()}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">{t("noData")}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FinancialSummarySection;