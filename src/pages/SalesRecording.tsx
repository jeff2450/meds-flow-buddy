import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { salesEntrySchema } from "@/lib/validations";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSwitch from "@/components/LanguageSwitch";

// Auth check
const useSalesRecordingAuth = () => {
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setAuthChecked(true);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return authChecked;
};

interface SaleEntry {
  id: string;
  medicineId: string;
  quantity: string;
  unitPrice: string;
  notes: string;
  saved?: boolean;
  dbId?: string;
}

const SalesRecording = () => {
  const authChecked = useSalesRecordingAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [salesEntries, setSalesEntries] = useState<SaleEntry[]>([
    { id: crypto.randomUUID(), medicineId: "", quantity: "", unitPrice: "", notes: "" }
  ]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const autoSaveTimers = useRef<Record<string, NodeJS.Timeout>>({});

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


  const addNewEntry = () => {
    setSalesEntries([
      ...salesEntries,
      { id: crypto.randomUUID(), medicineId: "", quantity: "", unitPrice: "", notes: "" }
    ]);
  };

  const removeEntry = (id: string) => {
    if (salesEntries.length > 1) {
      setSalesEntries(salesEntries.filter(entry => entry.id !== id));
    }
  };

  const updateEntry = (id: string, field: keyof SaleEntry, value: string) => {
    setSalesEntries(salesEntries.map(entry =>
      entry.id === id ? { ...entry, [field]: value, saved: false } : entry
    ));
    
    // Trigger auto-save after 1.5 seconds of no changes
    if (autoSaveTimers.current[id]) {
      clearTimeout(autoSaveTimers.current[id]);
    }
    
    autoSaveTimers.current[id] = setTimeout(() => {
      autoSaveEntry(id);
    }, 1500);
  };

  const autoSaveEntry = async (entryId: string) => {
    const entry = salesEntries.find(e => e.id === entryId);
    if (!entry || !entry.medicineId || !entry.quantity || !entry.unitPrice) {
      return;
    }

    // Validate entry with zod
    const result = salesEntrySchema.safeParse({
      medicineId: entry.medicineId,
      quantity: parseInt(entry.quantity) || 0,
      unitPrice: parseFloat(entry.unitPrice) || 0,
      notes: entry.notes?.trim() || "",
    });

    if (!result.success) {
      toast({
        title: t("validationError"),
        description: result.error.errors[0]?.message || "Invalid entry data",
        variant: "destructive",
      });
      return;
    }

    try {
      // Fetch fresh stock data before saving
      const { data: freshMedicine, error: fetchError } = await supabase
        .from("medicines")
        .select("current_stock, name")
        .eq("id", entry.medicineId)
        .single();

      if (fetchError) throw fetchError;

      // Check stock availability with fresh data
      if (freshMedicine && freshMedicine.current_stock < result.data.quantity) {
        toast({
          title: t("insufficientStock"),
          description: `${t("onlyUnitsAvailable")}: ${freshMedicine.current_stock} - ${freshMedicine.name}`,
          variant: "destructive",
        });
        return;
      }
      const saleData = {
        medicine_id: result.data.medicineId,
        sale_date: format(selectedDate, "yyyy-MM-dd"),
        quantity_sold: result.data.quantity,
        unit_price: result.data.unitPrice,
        notes: result.data.notes || null,
      };

      if (entry.dbId) {
        // Update existing record
        const { error } = await supabase
          .from("medicine_sales")
          .update(saleData)
          .eq("id", entry.dbId);
        
        if (error) throw error;
      } else {
        // Insert new record
        const { data, error } = await supabase
          .from("medicine_sales")
          .insert(saleData)
          .select()
          .single();
        
        if (error) throw error;
        
        // Update entry with database ID
        setSalesEntries(prev => prev.map(e =>
          e.id === entryId ? { ...e, dbId: data.id, saved: true } : e
        ));
        
        queryClient.invalidateQueries({ queryKey: ["medicine-sales"] });
        queryClient.invalidateQueries({ queryKey: ["medicines"] });
        queryClient.invalidateQueries({ queryKey: ["medicines-with-categories"] });
        return;
      }

      setSalesEntries(prev => prev.map(e =>
        e.id === entryId ? { ...e, saved: true } : e
      ));
      
      queryClient.invalidateQueries({ queryKey: ["medicine-sales"] });
      queryClient.invalidateQueries({ queryKey: ["medicines"] });
      queryClient.invalidateQueries({ queryKey: ["medicines-with-categories"] });
    } catch (error: any) {
      console.error("Auto-save error:", error);
    }
  };

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      Object.values(autoSaveTimers.current).forEach(timer => clearTimeout(timer));
    };
  }, []);

  if (!authChecked) {
    return null;
  }

  const calculateTotal = () => {
    return salesEntries.reduce((sum, entry) => {
      const quantity = parseFloat(entry.quantity || "0");
      const price = parseFloat(entry.unitPrice || "0");
      return sum + (quantity * price);
    }, 0);
  };

  const saveDailySales = async () => {
    setLoading(true);

    try {
      const unsavedEntries = salesEntries.filter(
        entry => entry.medicineId && entry.quantity && entry.unitPrice && !entry.saved
      );

      if (unsavedEntries.length === 0) {
        toast({
          title: t("allSaved"),
          description: t("allEntriesAlreadySaved"),
        });
        setLoading(false);
        return;
      }

      const salesData = unsavedEntries.map(entry => ({
        medicine_id: entry.medicineId,
        sale_date: format(selectedDate, "yyyy-MM-dd"),
        quantity_sold: parseInt(entry.quantity),
        unit_price: parseFloat(entry.unitPrice),
        notes: entry.notes || null,
      }));

      const { data, error } = await supabase
        .from("medicine_sales")
        .insert(salesData)
        .select();

      if (error) throw error;

      // Update entries with saved status and db IDs
      setSalesEntries(prev => prev.map((entry, index) => {
        const unsavedIndex = unsavedEntries.findIndex(e => e.id === entry.id);
        if (unsavedIndex !== -1 && data) {
          return { ...entry, saved: true, dbId: data[unsavedIndex].id };
        }
        return entry;
      }));

      toast({
        title: t("dailySalesSaved"),
        description: `${t("successfullySavedEntries")} ${format(selectedDate, "PPP")} (${unsavedEntries.length})`,
      });

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
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("backToDashboard")}
            </Button>
            <LanguageSwitch />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            {t("recordDailySales")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("enterSalesForDate")}
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("selectDate")}</CardTitle>
              <CardDescription>{t("chooseDateForSales")}</CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                disabled={(date) => date > new Date()}
                className="rounded-md border w-fit"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t("salesEntries")}</CardTitle>
                  <CardDescription>{t("addMedicinesSoldOn")} {format(selectedDate, "PPP")}</CardDescription>
                </div>
                <Button type="button" onClick={addNewEntry} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  {t("addEntry")}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {salesEntries.map((entry, index) => (
                <div key={entry.id} className="p-4 border rounded-lg space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{t("entry")} {index + 1}</h3>
                      {entry.saved && (
                        <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          {t("autoSaved")}
                        </span>
                      )}
                    </div>
                    {salesEntries.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeEntry(entry.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor={`medicine-${entry.id}`}>{t("medicineBatch")}</Label>
                      <Select
                        value={entry.medicineId}
                        onValueChange={(value) => updateEntry(entry.id, "medicineId", value)}
                        required
                      >
                        <SelectTrigger id={`medicine-${entry.id}`}>
                          <SelectValue placeholder={t("selectBatch")} />
                        </SelectTrigger>
                        <SelectContent>
                          {medicines?.filter(batch => batch.current_stock > 0).map((batch) => (
                            <SelectItem 
                              key={batch.id} 
                              value={batch.id}
                            >
                              {batch.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`quantity-${entry.id}`}>{t("quantity")}</Label>
                        <Input
                          id={`quantity-${entry.id}`}
                          type="number"
                          min="1"
                          max="100000"
                          value={entry.quantity}
                          onChange={(e) => updateEntry(entry.id, "quantity", e.target.value)}
                          placeholder="0"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`price-${entry.id}`}>{t("unitPriceDollar")}</Label>
                        <Input
                          id={`price-${entry.id}`}
                          type="number"
                          step="0.01"
                          min="0.01"
                          max="999999.99"
                          value={entry.unitPrice}
                          onChange={(e) => updateEntry(entry.id, "unitPrice", e.target.value)}
                          placeholder="0.00"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {entry.quantity && entry.unitPrice && (
                    <div className="flex justify-end">
                      <span className="text-sm font-medium">
                        {t("subtotal")}: ${(parseFloat(entry.quantity) * parseFloat(entry.unitPrice)).toFixed(2)}
                      </span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor={`notes-${entry.id}`}>{t("notesOptional")}</Label>
                    <Textarea
                      id={`notes-${entry.id}`}
                      value={entry.notes}
                      onChange={(e) => updateEntry(entry.id, "notes", e.target.value)}
                      placeholder={t("addNotes")}
                      rows={2}
                      maxLength={500}
                    />
                    <p className="text-xs text-muted-foreground">{entry.notes.length}/500</p>
                  </div>
                </div>
              ))}

              <div className="p-4 bg-muted rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">{t("totalFor")} {format(selectedDate, "PPP")}:</span>
                  <span className="text-2xl font-bold">${calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/")}
              disabled={loading}
            >
              {t("backToDashboard")}
            </Button>
            <Button
              type="button"
              onClick={saveDailySales}
              disabled={loading}
            >
              {t("saveDailySales")}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SalesRecording;
