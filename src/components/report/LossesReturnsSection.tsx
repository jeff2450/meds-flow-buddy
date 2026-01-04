import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertOctagon, PackageX, RotateCcw, HelpCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface LossData {
  damaged: { quantity: number; value: number };
  expired: { quantity: number; value: number };
  customerReturns: { quantity: number; value: number };
  supplierReturns: { quantity: number; value: number };
  theft: { quantity: number; value: number };
  totalLossValue: number;
  lossPercentage: number;
}

interface LossesReturnsProps {
  data: LossData;
}

const LossesReturnsSection = ({ data }: LossesReturnsProps) => {
  const { t } = useLanguage();

  const lossItems = [
    { key: 'damaged', label: t("damagedMedicines"), icon: PackageX, ...data.damaged },
    { key: 'expired', label: t("expiredWriteOffs"), icon: AlertOctagon, ...data.expired },
    { key: 'customerReturns', label: t("customerReturns"), icon: RotateCcw, ...data.customerReturns },
    { key: 'supplierReturns', label: t("supplierReturns"), icon: RotateCcw, ...data.supplierReturns },
    { key: 'theft', label: t("theftUnexplainedLosses"), icon: HelpCircle, ...data.theft },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertOctagon className="h-5 w-5 text-destructive" />
          {t("lossesReturnsAdjustments")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Breakdown */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("category")}</TableHead>
                <TableHead className="text-right">{t("quantity")}</TableHead>
                <TableHead className="text-right">{t("totalAmount")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lossItems.map((item) => (
                <TableRow key={item.key}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <item.icon className="h-4 w-4 text-muted-foreground" />
                      {item.label}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">{t("currency")} {item.value.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Summary */}
          <div className="space-y-4">
            <div className="p-6 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900">
              <p className="text-sm text-muted-foreground mb-1">{t("totalLossValue")}</p>
              <p className="text-3xl font-bold text-destructive">
                {t("currency")} {data.totalLossValue.toLocaleString()}
              </p>
            </div>
            <div className="p-6 bg-muted/50 rounded-lg border">
              <p className="text-sm text-muted-foreground mb-1">{t("lossPercentage")}</p>
              <p className={`text-3xl font-bold ${data.lossPercentage > 5 ? 'text-destructive' : data.lossPercentage > 2 ? 'text-yellow-600' : 'text-green-600'}`}>
                {data.lossPercentage.toFixed(2)}%
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LossesReturnsSection;