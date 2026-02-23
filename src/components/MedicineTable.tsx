import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Package, Search } from "lucide-react";
import { format } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";

export const MedicineTable = () => {
  const { t, language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: medicines, isLoading } = useQuery({
    queryKey: ["medicines-with-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("medicines")
        .select(`
          *,
          medicine_categories (
            name
          )
        `)
        .order("name");
      if (error) throw error;
      return data as (typeof data[number] & { total_stock: number })[];
    },
  });

  const filteredMedicines = medicines?.filter((medicine) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      medicine.name.toLowerCase().includes(searchLower) ||
      medicine.medicine_categories?.name.toLowerCase().includes(searchLower)
    );
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {t("medicines")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{t("loading")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          {t("medicines")}
        </CardTitle>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("searchMedicines")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("name")}</TableHead>
                <TableHead>{t("category")}</TableHead>
                <TableHead>{t("currentStock")}</TableHead>
                <TableHead>{language === "sw" ? "Jumla ya Vitengo" : "Total Unit"}</TableHead>
                <TableHead>{t("minStockLevel")}</TableHead>
                <TableHead>{t("entryDate")}</TableHead>
                <TableHead>{language === "sw" ? "Hali" : "Status"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!filteredMedicines || filteredMedicines.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    {searchQuery 
                      ? (language === "sw" ? "Hakuna kundi linalolingana na utafutaji wako." : "No batches match your search.")
                      : t("noMedicinesFound")
                    }
                  </TableCell>
                </TableRow>
              ) : (
                filteredMedicines.map((medicine) => {
                  const isOutOfStock = medicine.current_stock === 0;
                  const isLowStock = !isOutOfStock && medicine.current_stock <= medicine.min_stock_level;
                  return (
                    <TableRow key={medicine.id}>
                      <TableCell className="font-medium">{medicine.name}</TableCell>
                      <TableCell>
                        {medicine.medicine_categories?.name || (language === "sw" ? "Haijagawanywa" : "Uncategorized")}
                      </TableCell>
                      <TableCell>{medicine.current_stock}</TableCell>
                      <TableCell>{medicine.total_stock}</TableCell>
                      <TableCell>{medicine.min_stock_level}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(medicine.entry_date || medicine.created_at), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell>
                        {isOutOfStock ? (
                          <Badge variant="destructive">{language === "sw" ? "Imeisha" : "Out of Stock"}</Badge>
                        ) : isLowStock ? (
                          <Badge variant="destructive">{t("lowStock")}</Badge>
                        ) : (
                          <Badge className="bg-success text-success-foreground">
                            {language === "sw" ? "Ipo" : "In Stock"}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
