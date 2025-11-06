import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarIcon, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export function SalesRecordDialog() {
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [medicineId, setMedicineId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: medicines } = useQuery({
    queryKey: ["medicines"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("medicines")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });

  // Real-time subscription for stock updates
  useEffect(() => {
    const channel = supabase
      .channel('sales-dialog-stock-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'medicines'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["medicines"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Check stock availability
      const medicine = medicines?.find(m => m.id === medicineId);
      if (medicine && medicine.current_stock < parseInt(quantity)) {
        toast({
          title: "Insufficient Stock",
          description: `Only ${medicine.current_stock} units of ${medicine.name} available. Cannot sell ${quantity} units.`,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const { error } = await supabase.from("medicine_sales").insert({
        medicine_id: medicineId,
        sale_date: format(selectedDate, "yyyy-MM-dd"),
        quantity_sold: parseInt(quantity),
        unit_price: parseFloat(unitPrice),
        notes: notes || null,
      });

      if (error) throw error;

      toast({
        title: "Sale recorded",
        description: "The medicine sale has been recorded successfully.",
      });

      // Reset form
      setMedicineId("");
      setQuantity("");
      setUnitPrice("");
      setNotes("");
      setSelectedDate(new Date());
      setOpen(false);

      // Refresh sales and medicines data
      queryClient.invalidateQueries({ queryKey: ["medicine-sales"] });
      queryClient.invalidateQueries({ queryKey: ["medicines"] });
      queryClient.invalidateQueries({ queryKey: ["medicines-with-categories"] });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <DollarSign className="h-4 w-4 mr-2" />
          Record Sale
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Record Medicine Sale</DialogTitle>
          <DialogDescription>
            Record a daily sale for a specific medicine
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sale-date">Sale Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  disabled={(date) => date > new Date()}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="medicine">Medicine</Label>
            <Select value={medicineId} onValueChange={setMedicineId} required>
              <SelectTrigger>
                <SelectValue placeholder="Select medicine" />
              </SelectTrigger>
              <SelectContent>
                {medicines?.map((medicine) => {
                  const stockLevel = medicine.current_stock;
                  const isLowStock = stockLevel <= medicine.min_stock_level;
                  const isOutOfStock = stockLevel === 0;
                  
                  return (
                    <SelectItem 
                      key={medicine.id} 
                      value={medicine.id}
                      disabled={isOutOfStock}
                      className={isOutOfStock ? "opacity-50" : ""}
                    >
                      <div className="flex items-center justify-between w-full gap-2">
                        <span className="flex-1">{medicine.name}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          isOutOfStock 
                            ? "bg-destructive/10 text-destructive" 
                            : isLowStock 
                            ? "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400" 
                            : "bg-green-500/10 text-green-600 dark:text-green-400"
                        }`}>
                          {stockLevel} {medicine.unit}
                        </span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity Sold</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit-price">Unit Price ($)</Label>
              <Input
                id="unit-price"
                type="number"
                step="0.01"
                min="0"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          {quantity && unitPrice && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total Amount:</span>
                <span className="text-lg font-bold">
                  ${(parseFloat(quantity || "0") * parseFloat(unitPrice || "0")).toFixed(2)}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes..."
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Recording..." : "Record Sale"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
