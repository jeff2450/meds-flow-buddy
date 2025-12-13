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
import { TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { transactionSchema } from "@/lib/validations";
import { useLanguage } from "@/contexts/LanguageContext";

export const TransactionDialog = () => {
  const { t, language } = useLanguage();
  const [open, setOpen] = useState(false);
  const [medicineId, setMedicineId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
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
    setErrors({});
    
    const result = transactionSchema.safeParse({
      medicineId,
      quantity: parseInt(quantity) || 0,
      notes: notes.trim(),
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

    const template = medicines?.find(m => m.id === result.data.medicineId);
    if (!template) {
      toast.error(language === "sw" ? "Kiolezo cha dawa hakijapatikana" : "Medicine template not found");
      return;
    }

    const { error: insertError } = await supabase
      .from("medicines")
      .insert([{
        name: template.name,
        category_id: template.category_id,
        current_stock: result.data.quantity,
        total_stock: result.data.quantity,
        min_stock_level: template.min_stock_level,
        entry_date: new Date().toISOString(),
      }]);

    if (insertError) {
      console.error("Error creating batch:", insertError);
      toast.error(language === "sw" ? "Imeshindwa kuunda kundi jipya" : "Failed to create new batch");
      return;
    }

    toast.success(language === "sw" ? "Kundi jipya limeundwa kwa ufanisi" : "New batch created successfully");

    queryClient.invalidateQueries({ queryKey: ["medicines"] });
    queryClient.invalidateQueries({ queryKey: ["medicines-with-categories"] });
    queryClient.invalidateQueries({ queryKey: ["recent-transactions"] });
    
    setMedicineId("");
    setQuantity("");
    setNotes("");
    setErrors({});
    setOpen(false);
  };

  useEffect(() => {
    if (!open) {
      setMedicineId("");
      setQuantity("");
      setNotes("");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <TrendingUp className="mr-2 h-4 w-4" />
          {t("recordIntake")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t("stockIntake")}</DialogTitle>
            <DialogDescription>
              {t("recordStockIntake")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="medicine">{language === "sw" ? "Kiolezo cha Dawa" : "Medicine Template"} *</Label>
              <Select value={medicineId} onValueChange={setMedicineId}>
                <SelectTrigger>
                  <SelectValue placeholder={t("selectMedicine")} />
                </SelectTrigger>
                <SelectContent>
                  {Array.from(new Set(medicines?.map(m => m.name) || [])).map((name) => {
                    const medicine = medicines?.find(m => m.name === name);
                    return medicine ? (
                      <SelectItem key={medicine.id} value={medicine.id}>
                        {name}
                      </SelectItem>
                    ) : null;
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="quantity">{t("quantity")} *</Label>
              <Input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="1"
                max="100000"
                placeholder={language === "sw" ? "Ingiza kiasi" : "Enter quantity"}
                className={errors.quantity ? "border-destructive" : ""}
              />
              {errors.quantity && (
                <p className="text-sm text-destructive">{errors.quantity}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">{t("notes")} ({language === "sw" ? "Hiari" : "Optional"})</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t("optionalNotes")}
                rows={3}
                maxLength={500}
                className={errors.notes ? "border-destructive" : ""}
              />
              <p className="text-xs text-muted-foreground">{notes.length}/500</p>
              {errors.notes && (
                <p className="text-sm text-destructive">{errors.notes}</p>
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
            <Button type="submit">{t("recordIntake")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
