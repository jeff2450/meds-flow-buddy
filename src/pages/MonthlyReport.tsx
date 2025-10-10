import { useState } from "react";
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

const MonthlyReport = () => {
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());

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
            name,
            unit
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
                  Monthly Report
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Analyze monthly sales and stock data
                </p>
              </div>
            </div>
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
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                For {format(selectedMonth, "MMMM yyyy")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Units Sold</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalQuantitySold}</div>
              <p className="text-xs text-muted-foreground">
                Total quantity sold
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Medicines Sold</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalMedicinesSold}</div>
              <p className="text-xs text-muted-foreground">
                Different medicines
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Stock</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCurrentStock}</div>
              <p className="text-xs text-muted-foreground">
                Total units available
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Sales by Medicine</CardTitle>
            <CardDescription>Revenue breakdown for {format(selectedMonth, "MMMM yyyy")}</CardDescription>
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
              <p className="text-center text-muted-foreground py-8">No sales data for this month</p>
            )}
          </CardContent>
        </Card>

        {/* Detailed Table */}
        <Card>
          <CardHeader>
            <CardTitle>Sales Details</CardTitle>
            <CardDescription>Breakdown by medicine for {format(selectedMonth, "MMMM yyyy")}</CardDescription>
          </CardHeader>
          <CardContent>
            {salesLoading ? (
              <p className="text-center text-muted-foreground py-8">Loading...</p>
            ) : salesByMedicineArray.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medicine Name</TableHead>
                    <TableHead className="text-right">Quantity Sold</TableHead>
                    <TableHead className="text-right">Total Revenue</TableHead>
                    <TableHead className="text-right">Avg Price/Unit</TableHead>
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
              <p className="text-center text-muted-foreground py-8">No sales recorded for this month</p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default MonthlyReport;
