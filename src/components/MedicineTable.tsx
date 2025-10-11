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
import { Package } from "lucide-react";

export const MedicineTable = () => {
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
      return data;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Medicine Inventory
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Medicine Inventory
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Folio #</TableHead>
                <TableHead>Medicine Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Current Stock</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Min. Level</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {medicines?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No medicines found. Add your first medicine to get started.
                  </TableCell>
                </TableRow>
              ) : (
                medicines?.map((medicine) => {
                  const isLowStock = medicine.current_stock <= medicine.min_stock_level;
                  return (
                    <TableRow key={medicine.id}>
                      <TableCell className="font-mono text-xs">{medicine.folio_number || "N/A"}</TableCell>
                      <TableCell className="font-medium">{medicine.name}</TableCell>
                      <TableCell>
                        {medicine.medicine_categories?.name || "Uncategorized"}
                      </TableCell>
                      <TableCell>{medicine.current_stock}</TableCell>
                      <TableCell>{medicine.unit}</TableCell>
                      <TableCell>{medicine.min_stock_level}</TableCell>
                      <TableCell>
                        {isLowStock ? (
                          <Badge variant="destructive">Low Stock</Badge>
                        ) : (
                          <Badge className="bg-success text-success-foreground">In Stock</Badge>
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
