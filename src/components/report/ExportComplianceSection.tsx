import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { FileDown, FileSpreadsheet, Archive, PenLine } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { format } from "date-fns";
import { useState } from "react";

interface ExportComplianceProps {
  selectedMonth: Date;
  onExportPDF: () => void;
  onExportCSV: () => void;
}

const ExportComplianceSection = ({ selectedMonth, onExportPDF, onExportCSV }: ExportComplianceProps) => {
  const { t } = useLanguage();
  const [signatureName, setSignatureName] = useState("");
  const [signatureDate, setSignatureDate] = useState(format(new Date(), "yyyy-MM-dd"));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileDown className="h-5 w-5 text-primary" />
          {t("exportCompliance")}
        </CardTitle>
        <CardDescription>
          {t("monthlyReport")} - {format(selectedMonth, "MMMM yyyy")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Export Buttons */}
        <div className="flex flex-wrap gap-3">
          <Button onClick={onExportPDF} className="flex items-center gap-2">
            <FileDown className="h-4 w-4" />
            {t("printPDF")}
          </Button>
          <Button variant="outline" onClick={onExportCSV} className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            {t("exportExcel")}
          </Button>
          <Button variant="outline" disabled className="flex items-center gap-2">
            <Archive className="h-4 w-4" />
            {t("secureArchive")}
          </Button>
        </div>

        <Separator />

        {/* Pharmacist Signature Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <PenLine className="h-5 w-5 text-muted-foreground" />
            <h4 className="font-medium">{t("pharmacistSignature")}</h4>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4 p-4 border rounded-lg bg-muted/30">
            <div className="space-y-2">
              <Label htmlFor="signatureName">{t("signatureName")}</Label>
              <Input
                id="signatureName"
                value={signatureName}
                onChange={(e) => setSignatureName(e.target.value)}
                placeholder="Enter pharmacist name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signatureDate">{t("signatureDate")}</Label>
              <Input
                id="signatureDate"
                type="date"
                value={signatureDate}
                onChange={(e) => setSignatureDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Signature</Label>
              <div className="h-10 border-b-2 border-dashed border-muted-foreground/50" />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            By signing, the pharmacist-in-charge confirms the accuracy of this monthly report and compliance with all regulatory requirements.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExportComplianceSection;