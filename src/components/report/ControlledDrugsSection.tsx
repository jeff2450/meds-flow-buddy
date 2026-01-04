import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle, AlertTriangle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface ControlledDrugLog {
  id: string;
  medicine_name: string;
  opening_balance: number;
  quantity_received: number;
  quantity_dispensed: number;
  closing_balance: number;
  prescriber_reference?: string;
  variance: number;
  compliance_confirmed: boolean;
}

interface ControlledDrugsProps {
  logs: ControlledDrugLog[];
}

const ControlledDrugsSection = ({ logs }: ControlledDrugsProps) => {
  const { t } = useLanguage();

  const hasVariances = logs.some(log => log.variance !== 0);
  const allCompliant = logs.every(log => log.compliance_confirmed);

  return (
    <Card className="border-amber-200 dark:border-amber-900">
      <CardHeader className="bg-amber-50 dark:bg-amber-950/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-amber-600" />
            <CardTitle>{t("controlledDrugsReport")}</CardTitle>
          </div>
          <Badge variant="outline" className="border-amber-500 text-amber-600">
            {t("legalRequirement")}
          </Badge>
        </div>
        <CardDescription>
          {hasVariances ? (
            <span className="flex items-center gap-1 text-red-500">
              <AlertTriangle className="h-4 w-4" />
              {t("variancesDiscrepancies")}
            </span>
          ) : allCompliant ? (
            <span className="flex items-center gap-1 text-green-500">
              <CheckCircle className="h-4 w-4" />
              {t("complianceConfirmed")}
            </span>
          ) : null}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("medicine")}</TableHead>
              <TableHead className="text-right">{t("openingBalance")}</TableHead>
              <TableHead className="text-right">{t("quantityReceived")}</TableHead>
              <TableHead className="text-right">{t("quantityDispensed")}</TableHead>
              <TableHead className="text-right">{t("closingBalance")}</TableHead>
              <TableHead>{t("prescriberReference")}</TableHead>
              <TableHead className="text-right">{t("variancesDiscrepancies")}</TableHead>
              <TableHead className="text-center">{t("complianceConfirmed")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length > 0 ? logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="font-medium">{log.medicine_name}</TableCell>
                <TableCell className="text-right">{log.opening_balance}</TableCell>
                <TableCell className="text-right text-green-600">+{log.quantity_received}</TableCell>
                <TableCell className="text-right text-red-600">-{log.quantity_dispensed}</TableCell>
                <TableCell className="text-right font-medium">{log.closing_balance}</TableCell>
                <TableCell>{log.prescriber_reference || '-'}</TableCell>
                <TableCell className="text-right">
                  {log.variance !== 0 ? (
                    <span className="text-red-500 font-medium">{log.variance}</span>
                  ) : (
                    <span className="text-muted-foreground">0</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {log.compliance_confirmed ? (
                    <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-yellow-500 mx-auto" />
                  )}
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  {t("noData")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default ControlledDrugsSection;