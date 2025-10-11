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
  const [folioNumber, setFolioNumber] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [unit, setUnit] = useState("units");
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
    
    if (!name || !categoryId) {
      toast.error("Please fill in all required fields");
      return;
    }

    const { error } = await supabase
      .from("medicines")
      .insert({
        name,
        folio_number: folioNumber || null,
        category_id: categoryId,
        unit,
        min_stock_level: parseInt(minStockLevel),
      });

    if (error) {
      toast.error("Failed to add medicine");
      return;
    }

    toast.success("Medicine added successfully");
    queryClient.invalidateQueries({ queryKey: ["medicines"] });
    queryClient.invalidateQueries({ queryKey: ["medicines-with-categories"] });
    
    // Reset form
    setName("");
    setFolioNumber("");
    setCategoryId("");
    setUnit("units");
    setMinStockLevel("10");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-primary to-primary-glow hover:opacity-90 transition-opacity">
          <Plus className="mr-2 h-4 w-4" />
          Add Medicine
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add New Medicine</DialogTitle>
            <DialogDescription>
              Add a new medicine to your inventory. Fill in the details below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Medicine Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Paracetamol 500mg"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="folioNumber">Folio Number</Label>
              <Input
                id="folioNumber"
                value={folioNumber}
                onChange={(e) => setFolioNumber(e.target.value)}
                placeholder="e.g., F-1001 (auto-generated if empty)"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
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
              <Label htmlFor="unit">Unit</Label>
              <Input
                id="unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g., tablets, bottles, boxes"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="minStock">Minimum Stock Level</Label>
              <Input
                id="minStock"
                type="number"
                value={minStockLevel}
                onChange={(e) => setMinStockLevel(e.target.value)}
                min="0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Add Medicine</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
