import { useState, useEffect, useRef } from "react";
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
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { TrendingUp, WifiOff, ChevronsUpDown, Check } from "lucide-react";
import { toast } from "sonner";
import { transactionSchema } from "@/lib/validations";
import { useLanguage } from "@/contexts/LanguageContext";
import { isOnline } from "@/lib/offlineAuth";
import { queueOperation, getCachedData, cacheData } from "@/lib/offlineSync";
import { cn } from "@/lib/utils";

interface Medicine {
  id: string;
  name: string;
  category_id: string | null;
  min_stock_level: number;
  cost_price: number | null;
  medicine_type: 'prescription' | 'otc' | 'controlled' | 'medical_supplies' | null;
}

export const TransactionDialog = () => {
  const { t, language } = useLanguage();
  const [open, setOpen] = useState(false);
  const [medicineId, setMedicineId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [online, setOnline] = useState(isOnline());
  const [comboOpen, setComboOpen] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const { data: medicines } = useQuery({
    queryKey: ["medicines"],
    queryFn: async () => {
      if (!isOnline()) {
        const cached = await getCachedData<Medicine[]>('medicines');
        if (cached) return cached;
        return [];
      }
      
      const { data, error } = await supabase
        .from("medicines")
        .select("*")
        .order("name");
      if (error) throw error;
      
      if (data) {
        await cacheData('medicines', data);
      }
      
      return data as Medicine[];
    },
  });

  const uniqueMedicines = (() => {
    const seen = new Set<string>();
    return (medicines || []).filter(m => {
      if (seen.has(m.name)) return false;
      seen.add(m.name);
      return true;
    });
  })();

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

    const batchData = {
      name: template.name,
      category_id: template.category_id,
      current_stock: result.data.quantity,
      total_stock: result.data.quantity,
      min_stock_level: template.min_stock_level,
      entry_date: new Date().toISOString(),
      cost_price: template.cost_price,
      medicine_type: template.medicine_type,
    };

    // Always queue operation first (immediate save)
    await queueOperation('transaction', 'medicines', 'insert', batchData);
    toast.success(language === "sw" ? "Kundi jipya limeundwa kwa ufanisi" : "New batch created successfully");

    // Invalidate queries to refresh UI
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
            <DialogTitle className="flex items-center gap-2">
              {t("stockIntake")}
              {!online && (
                <Badge variant="secondary" className="text-amber-600">
                  <WifiOff className="h-3 w-3 mr-1" />
                  Offline
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              {online 
                ? t("recordStockIntake")
                : (language === "sw" ? "Itahifadhiwa ndani ya mtambo na kusawazishwa baadaye" : "Will be saved locally and synced later")
              }
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="medicine">{language === "sw" ? "Kiolezo cha Dawa" : "Medicine Template"} *</Label>
              <Popover open={comboOpen} onOpenChange={setComboOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={comboOpen}
                    className={cn("w-full justify-between font-normal", !medicineId && "text-muted-foreground")}
                  >
                    {medicineId
                      ? medicines?.find(m => m.id === medicineId)?.name ?? t("selectMedicine")
                      : t("selectMedicine")}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder={language === "sw" ? "Tafuta dawa..." : "Search medicine..."} />
                    <CommandList>
                      <CommandEmpty>{language === "sw" ? "Dawa haijapatikana" : "No medicine found"}</CommandEmpty>
                      <CommandGroup>
                        {uniqueMedicines.map((medicine) => (
                          <CommandItem
                            key={medicine.id}
                            value={medicine.name}
                            onSelect={() => {
                              setMedicineId(medicine.id);
                              setComboOpen(false);
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", medicineId === medicine.id ? "opacity-100" : "opacity-0")} />
                            {medicine.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
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
            <Button type="submit">
              {t("recordIntake")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
