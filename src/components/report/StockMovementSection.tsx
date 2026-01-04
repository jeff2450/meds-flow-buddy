import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowDownCircle, ArrowUpCircle, RefreshCw } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface StockAdjustment {
  type: string;
  quantity: number;
  value: number;
}

interface StockMovementProps {
  totalReceived: number;
  totalIssued: number;
  netChange: number;
  adjustments: StockAdjustment[];
}

const StockMovementSection = ({ totalReceived, totalIssued, netChange, adjustments }: StockMovementProps) => {
  const { t } = useLanguage();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 text-primary" />
          {t("stockMovementSummary")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Movement Summary */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
              <div className="flex items-center gap-3">
                <ArrowDownCircle className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">{t("totalStockReceived")}</p>
                  <p className="text-2xl font-bold text-green-600">+{totalReceived.toLocaleString()}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900">
              <div className="flex items-center gap-3">
                <ArrowUpCircle className="h-8 w-8 text-red-500" />
                <div>
                  <p className="text-sm text-muted-foreground">{t("totalStockIssued")}</p>
                  <p className="text-2xl font-bold text-red-600">-{totalIssued.toLocaleString()}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
              <div>
                <p className="text-sm text-muted-foreground">{t("netStockChange")}</p>
                <p className={`text-2xl font-bold ${netChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {netChange >= 0 ? '+' : ''}{netChange.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Adjustments Table */}
          <div>
            <h4 className="font-medium mb-3">{t("stockAdjustments")}</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("actionType")}</TableHead>
                  <TableHead className="text-right">{t("quantity")}</TableHead>
                  <TableHead className="text-right">{t("totalAmount")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adjustments.length > 0 ? adjustments.map((adj, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium capitalize">{adj.type.replace('_', ' ')}</TableCell>
                    <TableCell className="text-right">{adj.quantity}</TableCell>
                    <TableCell className="text-right">{t("currency")} {adj.value.toLocaleString()}</TableCell>
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

export default StockMovementSection;