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
import { addMedicineSchema } from "@/lib/validations";
import { useLanguage } from "@/contexts/LanguageContext";

export const AddMedicineDialog = () => {
  const { t, language } = useLanguage();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [initialStock, setInitialStock] = useState("");
  const [minStockLevel, setMinStockLevel] = useState("10");
  const [errors, setErrors] = useState<Record<string, string>>({});
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
    setErrors({});

    const result = addMedicineSchema.safeParse({
      name: name.trim(),
      categoryId: categoryId || undefined,
      initialStock: parseInt(initialStock) || 0,
      minStockLevel: parseInt(minStockLevel) || 0,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      toast.error(result.error.errors[0]?.message || t("error"));
      return;
    }

    const stockAmount = result.data.initialStock;

    const { error } = await supabase.from("medicines").insert([
      {
        name: result.data.name,
        category_id: result.data.categoryId || null,
        current_stock: stockAmount,
        total_stock: stockAmount,
        min_stock_level: result.data.minStockLevel,
        entry_date: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.error("Error adding medicine:", error);
      toast.error(language === "sw" ? "Imeshindwa kuongeza dawa" : "Failed to add medicine");
      return;
    }

    toast.success(language === "sw" ? "Dawa imeongezwa kwa ufanisi" : "Medicine added successfully");
    queryClient.invalidateQueries({ queryKey: ["medicines"] });
    queryClient.invalidateQueries({ queryKey: ["medicines-with-categories"] });

    setName("");
    setCategoryId("");
    setInitialStock("");
    setMinStockLevel("10");
    setErrors({});
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          {t("addMedicine")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("addNewMedicine")}</DialogTitle>
          <DialogDescription>
            {t("addNewMedicineDesc")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">{t("medicineName")} *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={language === "sw" ? "Ingiza jina la dawa" : "Enter medicine name"}
                maxLength={200}
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">{t("category")}</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger id="category">
                  <SelectValue placeholder={t("selectCategory")} />
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
              <Label htmlFor="initial-stock">{t("initialStock")} *</Label>
              <Input
                id="initial-stock"
                type="number"
                min="0"
                max="1000000"
                value={initialStock}
                onChange={(e) => setInitialStock(e.target.value)}
                placeholder={language === "sw" ? "Ingiza kiasi cha hisa ya awali" : "Enter initial stock quantity"}
                className={errors.initialStock ? "border-destructive" : ""}
              />
              {errors.initialStock && (
                <p className="text-sm text-destructive">{errors.initialStock}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="min-level">{t("minStockLevel")} *</Label>
              <Input
                id="min-level"
                type="number"
                min="0"
                max="100000"
                value={minStockLevel}
                onChange={(e) => setMinStockLevel(e.target.value)}
                placeholder={language === "sw" ? "Ingiza kiwango cha chini cha hisa" : "Enter minimum stock level"}
                className={errors.minStockLevel ? "border-destructive" : ""}
              />
              {errors.minStockLevel && (
                <p className="text-sm text-destructive">{errors.minStockLevel}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              {t("cancel")}
            </Button>
            <Button type="submit">{t("addMedicine")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
