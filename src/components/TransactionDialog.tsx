import { useState, useEffect } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "sonner";

interface TransactionDialogProps {
  type: "intake" | "outtake";
}

export const TransactionDialog = ({ type }: TransactionDialogProps) => {
  const [open, setOpen] = useState(false);
  const [medicineId, setMedicineId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
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
      .channel('transaction-dialog-stock-updates')
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
    
    if (!medicineId || !quantity) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Check stock availability for outtake transactions
    if (type === "outtake") {
      const medicine = medicines?.find(m => m.id === medicineId);
      if (medicine && medicine.current_stock < parseInt(quantity)) {
        toast.error(`Insufficient stock. Only ${medicine.current_stock} units available.`);
        return;
      }
    }

    let subFolioNumber = null;
    
    // For intake transactions, get the next sub-folio number
    if (type === "intake") {
      const { data: subFolioData, error: subFolioError } = await supabase
        .rpc('get_next_sub_folio_number', { p_medicine_id: medicineId });
      
      if (subFolioError) {
        console.error('Error getting sub-folio number:', subFolioError);
        toast.error('Failed to get sub-folio number');
        return;
      }
      
      subFolioNumber = subFolioData;
    }

    const { error } = await supabase
      .from("stock_transactions")
      .insert({
        medicine_id: medicineId,
        transaction_type: type,
        quantity: parseInt(quantity),
        notes: notes || null,
        sub_folio_number: subFolioNumber,
      });

    if (error) {
      toast.error(`Failed to record ${type}`);
      return;
    }

    toast.success(`${type === "intake" ? "Stock intake" : "Stock outtake"} recorded successfully`);
    queryClient.invalidateQueries({ queryKey: ["medicines"] });
    queryClient.invalidateQueries({ queryKey: ["medicines-with-categories"] });
    queryClient.invalidateQueries({ queryKey: ["recent-transactions"] });
    
    // Reset form
    setMedicineId("");
    setQuantity("");
    setNotes("");
    setOpen(false);
  };

  const isIntake = type === "intake";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline"
          className={isIntake 
            ? "border-success text-success hover:bg-success/10" 
            : "border-accent text-accent hover:bg-accent/10"
          }
        >
          {isIntake ? (
            <>
              <TrendingUp className="mr-2 h-4 w-4" />
              Record Intake
            </>
          ) : (
            <>
              <TrendingDown className="mr-2 h-4 w-4" />
              Record Outtake
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isIntake ? "Record Stock Intake" : "Record Stock Outtake"}
            </DialogTitle>
            <DialogDescription>
              {isIntake 
                ? "Add new stock to your inventory" 
                : "Remove stock from your inventory"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="medicine">Medicine *</Label>
              <Select value={medicineId} onValueChange={setMedicineId}>
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
                        disabled={type === "outtake" && isOutOfStock}
                        className={type === "outtake" && isOutOfStock ? "opacity-50" : ""}
                      >
                        <div className="flex items-center justify-between w-full gap-2">
                          <span className="flex-1">
                            {medicine.folio_number ? `[${medicine.folio_number}] ` : ""}{medicine.name}
                          </span>
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
            <div className="grid gap-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="1"
                placeholder="Enter quantity"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes about this transaction"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">
              {isIntake ? "Record Intake" : "Record Outtake"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
