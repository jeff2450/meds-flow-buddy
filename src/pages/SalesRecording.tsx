import { useState } from "react";
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
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

interface SaleEntry {
  id: string;
  medicineId: string;
  quantity: string;
  unitPrice: string;
  notes: string;
}

const SalesRecording = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [salesEntries, setSalesEntries] = useState<SaleEntry[]>([
    { id: crypto.randomUUID(), medicineId: "", quantity: "", unitPrice: "", notes: "" }
  ]);
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
      entry.id === id ? { ...entry, [field]: value } : entry
    ));
  };

  const calculateTotal = () => {
    return salesEntries.reduce((sum, entry) => {
      const quantity = parseFloat(entry.quantity || "0");
      const price = parseFloat(entry.unitPrice || "0");
      return sum + (quantity * price);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validEntries = salesEntries.filter(
        entry => entry.medicineId && entry.quantity && entry.unitPrice
      );

      if (validEntries.length === 0) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Please add at least one valid sale entry.",
        });
        setLoading(false);
        return;
      }

      const salesData = validEntries.map(entry => ({
        medicine_id: entry.medicineId,
        sale_date: format(selectedDate, "yyyy-MM-dd"),
        quantity_sold: parseInt(entry.quantity),
        unit_price: parseFloat(entry.unitPrice),
        notes: entry.notes || null,
      }));

      const { error } = await supabase.from("medicine_sales").insert(salesData);

      if (error) throw error;

      toast({
        title: "Sales recorded",
        description: `Successfully recorded ${validEntries.length} sale(s) for ${format(selectedDate, "PPP")}.`,
      });

      queryClient.invalidateQueries({ queryKey: ["medicine-sales"] });
      navigate("/");
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
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Record Daily Sales
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Enter all medicine sales for the selected date
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Select Date</CardTitle>
              <CardDescription>Choose the date for these sales records</CardDescription>
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
                  <CardTitle>Sales Entries</CardTitle>
                  <CardDescription>Add all medicines sold on {format(selectedDate, "PPP")}</CardDescription>
                </div>
                <Button type="button" onClick={addNewEntry} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Entry
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {salesEntries.map((entry, index) => (
                <div key={entry.id} className="p-4 border rounded-lg space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">Entry {index + 1}</h3>
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
                      <Label htmlFor={`medicine-${entry.id}`}>Medicine</Label>
                      <Select
                        value={entry.medicineId}
                        onValueChange={(value) => updateEntry(entry.id, "medicineId", value)}
                        required
                      >
                        <SelectTrigger id={`medicine-${entry.id}`}>
                          <SelectValue placeholder="Select medicine" />
                        </SelectTrigger>
                        <SelectContent>
                          {medicines?.map((medicine) => (
                            <SelectItem key={medicine.id} value={medicine.id}>
                              {medicine.folio_number ? `[${medicine.folio_number}] ` : ""}{medicine.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`quantity-${entry.id}`}>Quantity</Label>
                        <Input
                          id={`quantity-${entry.id}`}
                          type="number"
                          min="1"
                          value={entry.quantity}
                          onChange={(e) => updateEntry(entry.id, "quantity", e.target.value)}
                          placeholder="0"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`price-${entry.id}`}>Unit Price ($)</Label>
                        <Input
                          id={`price-${entry.id}`}
                          type="number"
                          step="0.01"
                          min="0"
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
                        Subtotal: ${(parseFloat(entry.quantity) * parseFloat(entry.unitPrice)).toFixed(2)}
                      </span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor={`notes-${entry.id}`}>Notes (Optional)</Label>
                    <Textarea
                      id={`notes-${entry.id}`}
                      value={entry.notes}
                      onChange={(e) => updateEntry(entry.id, "notes", e.target.value)}
                      placeholder="Add any notes..."
                      rows={2}
                    />
                  </div>
                </div>
              ))}

              <div className="p-4 bg-muted rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total for {format(selectedDate, "PPP")}:</span>
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
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Recording..." : "Record All Sales"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default SalesRecording;
