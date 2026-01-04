import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Package, AlertCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface Medicine {
  id: string;
  name: string;
  current_stock: number;
  min_stock_level: number;
  cost_price?: number;
}

interface InventoryStatusProps {
  openingStock: number;
  closingStock: number;
  currentStock: number;
  stockValueCost: number;
  stockValueSelling: number;
  outOfStockMedicines: Medicine[];
  lowStockMedicines: Medicine[];
  overstockedMedicines: Medicine[];
}

const InventoryStatusSection = ({
  openingStock,
  closingStock,
  currentStock,
  stockValueCost,
  stockValueSelling,
  outOfStockMedicines,
  lowStockMedicines,
  overstockedMedicines,
}: InventoryStatusProps) => {
  const { t } = useLanguage();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          {t("inventoryStatus")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">{t("openingStock")}</p>
            <p className="text-xl font-bold">{openingStock.toLocaleString()} {t("units")}</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">{t("closingStock")}</p>
            <p className="text-xl font-bold">{closingStock.toLocaleString()} {t("units")}</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">{t("currentStockOnHand")}</p>
            <p className="text-xl font-bold">{currentStock.toLocaleString()} {t("units")}</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">{t("stockValueCost")}</p>
            <p className="text-xl font-bold">{t("currency")} {stockValueCost.toLocaleString()}</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">{t("stockValueSelling")}</p>
            <p className="text-xl font-bold text-primary">{t("currency")} {stockValueSelling.toLocaleString()}</p>
          </div>
        </div>

        {/* Critical Stock Alerts */}
        <div className="grid md:grid-cols-3 gap-4">
          {/* Out of Stock */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <h4 className="font-medium text-destructive">{t("outOfStockMedicines")}</h4>
              <Badge variant="destructive">{outOfStockMedicines.length}</Badge>
            </div>
            <div className="max-h-[150px] overflow-y-auto space-y-1">
              {outOfStockMedicines.length > 0 ? (
                outOfStockMedicines.map((med) => (
                  <p key={med.id} className="text-sm">{med.name}</p>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">{t("noData")}</p>
              )}
            </div>
          </div>

          {/* Low Stock */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <h4 className="font-medium text-yellow-600">{t("lowStockMedicines")}</h4>
              <Badge variant="outline" className="border-yellow-500 text-yellow-600">{lowStockMedicines.length}</Badge>
            </div>
            <div className="max-h-[150px] overflow-y-auto space-y-1">
              {lowStockMedicines.length > 0 ? (
                lowStockMedicines.map((med) => (
                  <p key={med.id} className="text-sm">
                    {med.name} <span className="text-muted-foreground">({med.current_stock}/{med.min_stock_level})</span>
                  </p>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">{t("noData")}</p>
              )}
            </div>
          </div>

          {/* Overstocked */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Package className="h-4 w-4 text-blue-500" />
              <h4 className="font-medium text-blue-600">{t("overstockedMedicines")}</h4>
              <Badge variant="outline" className="border-blue-500 text-blue-600">{overstockedMedicines.length}</Badge>
            </div>
            <div className="max-h-[150px] overflow-y-auto space-y-1">
              {overstockedMedicines.length > 0 ? (
                overstockedMedicines.map((med) => (
                  <p key={med.id} className="text-sm">
                    {med.name} <span className="text-muted-foreground">({med.current_stock} {t("units")})</span>
                  </p>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">{t("noData")}</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InventoryStatusSection;