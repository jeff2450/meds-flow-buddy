import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, Package, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSwitch from "@/components/LanguageSwitch";

const MonthlyReport = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
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

  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);

  // Fetch sales data for the selected month
  const { data: salesData, isLoading: salesLoading } = useQuery({
    queryKey: ["monthly-sales", monthStart.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("medicine_sales")
        .select(`
          *,
          medicines (
            name
          )
        `)
        .gte("sale_date", monthStart.toISOString())
        .lte("sale_date", monthEnd.toISOString())
        .order("sale_date", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Fetch current stock data
  const { data: stockData, isLoading: stockLoading } = useQuery({
    queryKey: ["current-stock"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("medicines")
        .select("*")
        .order("name");

      if (error) throw error;
      return data;
    },
  });

  // Calculate summary statistics
  const totalRevenue = salesData?.reduce((sum, sale) => sum + Number(sale.total_amount || 0), 0) || 0;
  const totalQuantitySold = salesData?.reduce((sum, sale) => sum + (sale.quantity_sold || 0), 0) || 0;
  const totalMedicinesSold = new Set(salesData?.map(sale => sale.medicine_id)).size || 0;
  const totalCurrentStock = stockData?.reduce((sum, med) => sum + (med.current_stock || 0), 0) || 0;

  // Group sales by medicine
  const salesByMedicine = salesData?.reduce((acc, sale) => {
    const medicineName = sale.medicines?.name || "Unknown";
    if (!acc[medicineName]) {
      acc[medicineName] = {
        name: medicineName,
        quantity: 0,
        revenue: 0,
      };
    }
    acc[medicineName].quantity += sale.quantity_sold || 0;
    acc[medicineName].revenue += Number(sale.total_amount || 0);
    return acc;
  }, {} as Record<string, { name: string; quantity: number; revenue: number }>);

  const salesByMedicineArray = Object.values(salesByMedicine || {}).sort((a, b) => b.revenue - a.revenue);

  if (!authChecked) {
    return null;
  }

  const chartConfig = {
    revenue: {
      label: "Revenue",
      color: "hsl(var(--primary))",
    },
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                  {t("monthlyReport")}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("analyzeMonthlyData")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <LanguageSwitch />
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(selectedMonth, "MMMM yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedMonth}
                    onSelect={(date) => date && setSelectedMonth(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("totalRevenue")}</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {t("forMonth")} {format(selectedMonth, "MMMM yyyy")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("unitsSold")}</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalQuantitySold}</div>
              <p className="text-xs text-muted-foreground">
                {t("totalQuantitySold")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("medicinesSold")}</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalMedicinesSold}</div>
              <p className="text-xs text-muted-foreground">
                {t("differentMedicines")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("currentStock")}</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCurrentStock}</div>
              <p className="text-xs text-muted-foreground">
                {t("totalUnitsAvailable")}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{t("salesByMedicine")}</CardTitle>
            <CardDescription>{t("revenueBreakdownFor")} {format(selectedMonth, "MMMM yyyy")}</CardDescription>
          </CardHeader>
          <CardContent>
            {salesByMedicineArray.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesByMedicineArray}>
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: 'hsl(var(--foreground))' }}
                      tickLine={{ stroke: 'hsl(var(--border))' }}
                    />
                    <YAxis 
                      tick={{ fill: 'hsl(var(--foreground))' }}
                      tickLine={{ stroke: 'hsl(var(--border))' }}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">{t("noSalesDataForMonth")}</p>
            )}
          </CardContent>
        </Card>

        {/* Detailed Table */}
        <Card>
          <CardHeader>
            <CardTitle>{t("salesDetails")}</CardTitle>
            <CardDescription>{t("breakdownByMedicine")} {format(selectedMonth, "MMMM yyyy")}</CardDescription>
          </CardHeader>
          <CardContent>
            {salesLoading ? (
              <p className="text-center text-muted-foreground py-8">{t("loading")}</p>
            ) : salesByMedicineArray.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("medicineName")}</TableHead>
                    <TableHead className="text-right">{t("quantitySold")}</TableHead>
                    <TableHead className="text-right">{t("totalRevenueLabel")}</TableHead>
                    <TableHead className="text-right">{t("avgPricePerUnit")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesByMedicineArray.map((medicine) => (
                    <TableRow key={medicine.name}>
                      <TableCell className="font-medium">{medicine.name}</TableCell>
                      <TableCell className="text-right">{medicine.quantity}</TableCell>
                      <TableCell className="text-right">${medicine.revenue.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        ${(medicine.revenue / medicine.quantity).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-8">{t("noSalesRecordedForMonth")}</p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default MonthlyReport;
