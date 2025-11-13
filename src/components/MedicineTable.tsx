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

export const MedicineTable = () => {
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
      return data;
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
            Medicine Batches
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
          Medicine Batches
        </CardTitle>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or category..."
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
                <TableHead>Medicine Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Current Stock</TableHead>
                <TableHead>Total Unit</TableHead>
                <TableHead>Min. Level</TableHead>
                <TableHead>Entry Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!filteredMedicines || filteredMedicines.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    {searchQuery ? "No batches match your search." : "No batches found. Record an intake to create your first batch."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredMedicines.map((medicine) => {
                  const isLowStock = medicine.current_stock <= medicine.min_stock_level;
                  return (
                    <TableRow key={medicine.id}>
                      <TableCell className="font-medium">{medicine.name}</TableCell>
                      <TableCell>
                        {medicine.medicine_categories?.name || "Uncategorized"}
                      </TableCell>
                      <TableCell>{medicine.current_stock}</TableCell>
                      <TableCell>{medicine.total_stock}</TableCell>
                      <TableCell>{medicine.min_stock_level}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(medicine.entry_date || medicine.created_at), "MMM dd, yyyy")}
                      </TableCell>
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
