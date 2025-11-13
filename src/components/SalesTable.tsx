import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Calendar as CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export function SalesTable() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const { data: sales, isLoading } = useQuery({
    queryKey: ["medicine-sales", selectedDate ? format(selectedDate, "yyyy-MM-dd") : "all"],
    queryFn: async () => {
      let query = supabase
        .from("medicine_sales")
        .select(`
          *,
          medicines (
            name
          )
        `)
        .order("sale_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (selectedDate) {
        query = query.eq("sale_date", format(selectedDate, "yyyy-MM-dd"));
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
  });

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("medicine_sales")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Sale deleted",
        description: "The sale record has been deleted successfully.",
      });

      queryClient.invalidateQueries({ queryKey: ["medicine-sales"] });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const totalRevenue = sales?.reduce((sum, sale) => sum + parseFloat(String(sale.total_amount || 0)), 0) || 0;
  const totalQuantity = sales?.reduce((sum, sale) => sum + sale.quantity_sold, 0) || 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Sales Records</CardTitle>
            <CardDescription>View and manage daily medicine sales</CardDescription>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn(!selectedDate && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP") : "All dates"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date > new Date()}
                initialFocus
                className="pointer-events-auto"
              />
              <div className="p-3 border-t">
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => setSelectedDate(undefined)}
                >
                  Show all dates
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        {selectedDate && sales && sales.length > 0 && (
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="p-4 bg-primary/10 rounded-lg">
              <p className="text-sm text-muted-foreground">Total Quantity</p>
              <p className="text-2xl font-bold">{totalQuantity}</p>
            </div>
            <div className="p-4 bg-green-500/10 rounded-lg">
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold">${totalRevenue.toFixed(2)}</p>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-2">Loading sales...</p>
          </div>
        ) : sales && sales.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Medicine</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>{format(new Date(sale.sale_date), "MMM dd, yyyy")}</TableCell>
                    <TableCell className="font-medium">
                      {sale.medicines?.name || "Unknown"}
                    </TableCell>
                    <TableCell className="text-right">
                      {sale.quantity_sold}
                    </TableCell>
                    <TableCell className="text-right">
                      ${parseFloat(String(sale.unit_price)).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      ${parseFloat(String(sale.total_amount || 0)).toFixed(2)}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {sale.notes || "-"}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(sale.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            {selectedDate
              ? `No sales recorded for ${format(selectedDate, "MMMM dd, yyyy")}`
              : "No sales records found. Start by recording a sale."}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
