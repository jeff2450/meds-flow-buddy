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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export const AddMedicineDialog = () => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [initialStock, setInitialStock] = useState("");
  const [minStockLevel, setMinStockLevel] = useState("10");
  const queryClient = useQueryClient();

  const { data: categories } = useQuery({
    queryKey: ["medicine-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("medicine_categories")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter medicine name");
      return;
    }

    if (!initialStock || parseInt(initialStock) < 0) {
      toast.error("Please enter a valid initial stock");
      return;
    }

    const stockAmount = parseInt(initialStock);

    const { error } = await supabase.from("medicines").insert([
      {
        name: name.trim(),
        category_id: categoryId || null,
        current_stock: stockAmount,
        total_stock: stockAmount,
        min_stock_level: parseInt(minStockLevel),
        entry_date: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.error("Error adding medicine:", error);
      toast.error("Failed to add medicine");
      return;
    }

    toast.success("Medicine added successfully");
    queryClient.invalidateQueries({ queryKey: ["medicines"] });
    queryClient.invalidateQueries({ queryKey: ["medicines-with-categories"] });

    // Reset form
    setName("");
    setCategoryId("");
    setInitialStock("");
    setMinStockLevel("10");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Medicine
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Medicine</DialogTitle>
          <DialogDescription>
            Register a new medicine in the inventory system
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Medicine Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter medicine name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="initial-stock">Initial Stock *</Label>
              <Input
                id="initial-stock"
                type="number"
                min="0"
                value={initialStock}
                onChange={(e) => setInitialStock(e.target.value)}
                placeholder="Enter initial stock quantity"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="min-level">Minimum Stock Level *</Label>
              <Input
                id="min-level"
                type="number"
                min="0"
                value={minStockLevel}
                onChange={(e) => setMinStockLevel(e.target.value)}
                placeholder="Enter minimum stock level"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Add Medicine</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
