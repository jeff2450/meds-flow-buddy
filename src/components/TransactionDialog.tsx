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


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!quantity) {
      toast.error("Please enter a quantity");
      return;
    }

    if (type === "intake") {
      // For intake: create a new medicine batch entry
      if (!medicineId) {
        toast.error("Please select a medicine template or enter details");
        return;
      }

      // Get the template medicine to copy name and category
      const template = medicines?.find(m => m.id === medicineId);
      if (!template) {
        toast.error("Medicine template not found");
        return;
      }

      // Create new batch entry (auto-generated ID)
      const { error: insertError } = await supabase
        .from("medicines")
        .insert([{
          name: template.name,
          category_id: template.category_id,
          current_stock: parseInt(quantity),
          total_stock: parseInt(quantity),
          min_stock_level: template.min_stock_level,
          entry_date: new Date().toISOString(),
        }]);

      if (insertError) {
        console.error('Error creating batch:', insertError);
        toast.error("Failed to create new batch");
        return;
      }

      toast.success("New batch created successfully");
    } else {
      // For outtake: reduce stock from specific batch
      if (!medicineId) {
        toast.error("Please select a batch");
        return;
      }

      const batch = medicines?.find(m => m.id === medicineId);
      if (batch && batch.current_stock < parseInt(quantity)) {
        toast.error(`Insufficient stock. Only ${batch.current_stock} units available in this batch.`);
        return;
      }

      // Record outtake transaction (trigger will update stock)
      const { error } = await supabase
        .from("stock_transactions")
        .insert({
          medicine_id: medicineId,
          transaction_type: "outtake",
          quantity: parseInt(quantity),
          notes: notes || null,
        });

      if (error) {
        console.error('Error recording outtake:', error);
        toast.error("Failed to record outtake");
        return;
      }

      toast.success("Stock outtake recorded successfully");
    }

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
                ? "Create a new independent batch" 
                : "Remove stock from a specific batch"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="medicine">{isIntake ? "Medicine Template *" : "Select Batch *"}</Label>
              <Select value={medicineId} onValueChange={setMedicineId}>
                <SelectTrigger>
                  <SelectValue placeholder={isIntake ? "Select medicine to create batch" : "Select batch to reduce"} />
                </SelectTrigger>
                <SelectContent>
                  {isIntake ? (
                    // For intake: show unique medicine names as templates
                    Array.from(new Set(medicines?.map(m => m.name) || [])).map((name) => {
                      const medicine = medicines?.find(m => m.name === name);
                      return medicine ? (
                        <SelectItem key={medicine.id} value={medicine.id}>
                          {name}
                        </SelectItem>
                      ) : null;
                    })
                  ) : (
                    // For outtake: show all batches
                    medicines?.map((batch) => {
                      const isOutOfStock = batch.current_stock === 0;
                      return (
                        <SelectItem 
                          key={batch.id} 
                          value={batch.id}
                          disabled={isOutOfStock}
                          className={isOutOfStock ? "opacity-50" : ""}
                        >
                          {batch.name} - {batch.current_stock} available
                        </SelectItem>
                      );
                    })
                  )}
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
