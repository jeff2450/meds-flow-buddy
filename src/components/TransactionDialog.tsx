import { useState } from "react";
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!medicineId || !quantity) {
      toast.error("Please fill in all required fields");
      return;
    }

    const { error } = await supabase
      .from("stock_transactions")
      .insert({
        medicine_id: medicineId,
        transaction_type: type,
        quantity: parseInt(quantity),
        notes: notes || null,
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
                  {medicines?.map((medicine) => (
                    <SelectItem 
                      key={medicine.id} 
                      value={medicine.id}
                    >
                      {medicine.folio_number ? `[${medicine.folio_number}] ` : ""}{medicine.name} (Stock: {medicine.current_stock} {medicine.unit})
                    </SelectItem>
                  ))}
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
