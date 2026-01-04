import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSwitch from "@/components/LanguageSwitch";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";

// Report Sections
import SalesSummarySection from "@/components/report/SalesSummarySection";
import SalesBreakdownSection from "@/components/report/SalesBreakdownSection";
import InventoryStatusSection from "@/components/report/InventoryStatusSection";
import StockMovementSection from "@/components/report/StockMovementSection";
import ControlledDrugsSection from "@/components/report/ControlledDrugsSection";
import LossesReturnsSection from "@/components/report/LossesReturnsSection";
import AuditActivitySection from "@/components/report/AuditActivitySection";
import FinancialSummarySection from "@/components/report/FinancialSummarySection";
import ExportComplianceSection from "@/components/report/ExportComplianceSection";

const MonthlyReport = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { isAdmin } = useUserRole();
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
  const previousMonthStart = startOfMonth(subMonths(selectedMonth, 1));
  const previousMonthEnd = endOfMonth(subMonths(selectedMonth, 1));

  // Fetch current month sales with medicine details
  const { data: salesData } = useQuery({
    queryKey: ["monthly-sales", monthStart.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("medicine_sales")
        .select(`
          *,
          medicines (
            id, name, category_id, cost_price, medicine_type,
            medicine_categories ( name )
          )
        `)
        .gte("sale_date", monthStart.toISOString())
        .lte("sale_date", monthEnd.toISOString())
        .order("sale_date", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Fetch previous month sales for comparison
  const { data: previousMonthSales } = useQuery({
    queryKey: ["previous-month-sales", previousMonthStart.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("medicine_sales")
        .select("total_amount")
        .gte("sale_date", previousMonthStart.toISOString())
        .lte("sale_date", previousMonthEnd.toISOString());

      if (error) throw error;
      return data;
    },
  });

  // Fetch current stock data
  const { data: stockData } = useQuery({
    queryKey: ["current-stock-report"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("medicines")
        .select("*, medicine_categories ( name )")
        .order("name");

      if (error) throw error;
      return data;
    },
  });

  // Fetch stock transactions for the month
  const { data: transactionsData } = useQuery({
    queryKey: ["stock-transactions", monthStart.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stock_transactions")
        .select("*")
        .gte("transaction_date", monthStart.toISOString())
        .lte("transaction_date", monthEnd.toISOString());

      if (error) throw error;
      return data;
    },
  });

  // Fetch stock adjustments
  const { data: adjustmentsData } = useQuery({
    queryKey: ["stock-adjustments", monthStart.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stock_adjustments")
        .select("*")
        .gte("adjustment_date", monthStart.toISOString())
        .lte("adjustment_date", monthEnd.toISOString());

      if (error) throw error;
      return data;
    },
  });

  // Fetch controlled drugs log
  const { data: controlledDrugsData } = useQuery({
    queryKey: ["controlled-drugs-log", monthStart.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("controlled_drugs_log")
        .select("*, medicines ( name )")
        .gte("log_date", monthStart.toISOString())
        .lte("log_date", monthEnd.toISOString());

      if (error) throw error;
      return data;
    },
  });

  // Fetch audit logs (admin only)
  const { data: auditLogsData } = useQuery({
    queryKey: ["audit-logs", monthStart.toISOString()],
    queryFn: async () => {
      if (!isAdmin) return [];
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .gte("performed_at", monthStart.toISOString())
        .lte("performed_at", monthEnd.toISOString())
        .order("performed_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  // Fetch profiles for staff activity
  const { data: profilesData } = useQuery({
    queryKey: ["profiles-report"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*");

      if (error) throw error;
      return data;
    },
  });

  // Calculate Sales Summary
  const totalValue = salesData?.reduce((sum, sale) => sum + Number(sale.total_amount || 0), 0) || 0;
  const totalTransactions = salesData?.length || 0;
  const prescriptionSales = salesData?.filter(s => s.is_prescription)
    .reduce((sum, sale) => sum + Number(sale.total_amount || 0), 0) || 0;
  const otcSales = totalValue - prescriptionSales;
  const averageSaleValue = totalTransactions > 0 ? totalValue / totalTransactions : 0;
  const previousMonthValue = previousMonthSales?.reduce((sum, sale) => sum + Number(sale.total_amount || 0), 0) || 0;

  // Calculate Sales Breakdown by Category
  const categorySales = salesData?.reduce((acc, sale) => {
    const categoryName = sale.medicines?.medicine_categories?.name || 
                         (sale.medicines?.medicine_type === 'prescription' ? 'Prescription' : 
                          sale.medicines?.medicine_type === 'controlled' ? 'Controlled' :
                          sale.medicines?.medicine_type === 'medical_supplies' ? 'Medical Supplies' : 'OTC');
    if (!acc[categoryName]) {
      acc[categoryName] = { name: categoryName, value: 0, quantity: 0 };
    }
    acc[categoryName].value += Number(sale.total_amount || 0);
    acc[categoryName].quantity += sale.quantity_sold || 0;
    return acc;
  }, {} as Record<string, { name: string; value: number; quantity: number }>) || {};

  // Top and Least Products
  const productSales = salesData?.reduce((acc, sale) => {
    const name = sale.medicines?.name || 'Unknown';
    if (!acc[name]) {
      acc[name] = { name, quantity: 0, revenue: 0, cost: 0 };
    }
    acc[name].quantity += sale.quantity_sold || 0;
    acc[name].revenue += Number(sale.total_amount || 0);
    acc[name].cost += (sale.medicines?.cost_price || 0) * (sale.quantity_sold || 0);
    return acc;
  }, {} as Record<string, { name: string; quantity: number; revenue: number; cost: number }>) || {};

  const sortedProducts = Object.values(productSales).sort((a, b) => b.revenue - a.revenue);
  const topProducts = sortedProducts.slice(0, 10);
  const leastProducts = sortedProducts.slice(-5).reverse();

  // Inventory Status
  const currentStock = stockData?.reduce((sum, med) => sum + (med.current_stock || 0), 0) || 0;
  const stockValueCost = stockData?.reduce((sum, med) => sum + ((med.cost_price || 0) * (med.current_stock || 0)), 0) || 0;
  const totalQuantitySold = salesData?.reduce((sum, sale) => sum + (sale.quantity_sold || 0), 0) || 0;
  const openingStock = currentStock + totalQuantitySold;
  const closingStock = currentStock;
  
  // Estimate selling value (using average sale price from sales data)
  const avgSellingPricePerUnit = totalValue / (totalQuantitySold || 1);
  const stockValueSelling = currentStock * avgSellingPricePerUnit;

  const outOfStockMedicines = stockData?.filter(m => m.current_stock === 0) || [];
  const lowStockMedicines = stockData?.filter(m => m.current_stock > 0 && m.current_stock <= m.min_stock_level) || [];
  const overstockedMedicines = stockData?.filter(m => m.current_stock > m.min_stock_level * 3) || [];

  // Stock Movement
  const totalReceived = transactionsData?.filter(t => t.transaction_type === 'intake')
    .reduce((sum, t) => sum + (t.quantity || 0), 0) || 0;
  const totalIssued = totalQuantitySold;
  const netChange = totalReceived - totalIssued;

  // Adjustments summary
  const adjustmentsSummary = adjustmentsData?.reduce((acc, adj) => {
    if (!acc[adj.adjustment_type]) {
      acc[adj.adjustment_type] = { type: adj.adjustment_type, quantity: 0, value: 0 };
    }
    acc[adj.adjustment_type].quantity += adj.quantity || 0;
    acc[adj.adjustment_type].value += Number(adj.value || 0);
    return acc;
  }, {} as Record<string, { type: string; quantity: number; value: number }>) || {};

  // Controlled Drugs
  const controlledDrugsLogs = controlledDrugsData?.map(log => ({
    id: log.id,
    medicine_name: log.medicines?.name || 'Unknown',
    opening_balance: log.opening_balance,
    quantity_received: log.quantity_received,
    quantity_dispensed: log.quantity_dispensed,
    closing_balance: log.closing_balance,
    prescriber_reference: log.prescriber_reference,
    variance: log.variance,
    compliance_confirmed: log.compliance_confirmed,
  })) || [];

  // Losses & Returns
  const lossData = {
    damaged: { quantity: 0, value: 0 },
    expired: { quantity: 0, value: 0 },
    customerReturns: { quantity: 0, value: 0 },
    supplierReturns: { quantity: 0, value: 0 },
    theft: { quantity: 0, value: 0 },
    totalLossValue: 0,
    lossPercentage: 0,
  };

  adjustmentsData?.forEach(adj => {
    const data = { quantity: adj.quantity || 0, value: Number(adj.value || 0) };
    switch (adj.adjustment_type) {
      case 'damage': lossData.damaged = { quantity: lossData.damaged.quantity + data.quantity, value: lossData.damaged.value + data.value }; break;
      case 'expired': lossData.expired = { quantity: lossData.expired.quantity + data.quantity, value: lossData.expired.value + data.value }; break;
      case 'customer_return': lossData.customerReturns = { quantity: lossData.customerReturns.quantity + data.quantity, value: lossData.customerReturns.value + data.value }; break;
      case 'supplier_return': lossData.supplierReturns = { quantity: lossData.supplierReturns.quantity + data.quantity, value: lossData.supplierReturns.value + data.value }; break;
      case 'theft': lossData.theft = { quantity: lossData.theft.quantity + data.quantity, value: lossData.theft.value + data.value }; break;
    }
  });

  lossData.totalLossValue = lossData.damaged.value + lossData.expired.value + lossData.theft.value;
  lossData.lossPercentage = stockValueCost > 0 ? (lossData.totalLossValue / stockValueCost) * 100 : 0;

  // Staff Activity (simplified - would need recorded_by to be populated)
  const staffActivities = profilesData?.map(profile => ({
    name: profile.full_name || '',
    email: profile.email || '',
    salesCount: salesData?.filter(s => s.recorded_by === profile.id).length || 0,
    salesValue: salesData?.filter(s => s.recorded_by === profile.id).reduce((sum, s) => sum + Number(s.total_amount || 0), 0) || 0,
    intakeCount: transactionsData?.filter(t => t.recorded_by === profile.id && t.transaction_type === 'intake').length || 0,
    adjustmentCount: adjustmentsData?.filter(a => a.recorded_by === profile.id).length || 0,
  })).filter(s => s.salesCount > 0 || s.intakeCount > 0 || s.adjustmentCount > 0) || [];

  // Audit Logs
  const auditLogs = auditLogsData?.map(log => ({
    id: log.id,
    table_name: log.table_name,
    action: log.action,
    performed_by_email: profilesData?.find(p => p.id === log.performed_by)?.email,
    performed_at: log.performed_at,
    record_id: log.record_id,
  })) || [];

  // Financial Summary
  const cogs = salesData?.reduce((sum, sale) => {
    return sum + ((sale.medicines?.cost_price || 0) * (sale.quantity_sold || 0));
  }, 0) || 0;
  const grossProfit = totalValue - cogs;
  const grossProfitMargin = totalValue > 0 ? (grossProfit / totalValue) * 100 : 0;

  // High/Low Margin Medicines
  const medicineMargins = Object.values(productSales).map(p => ({
    name: p.name,
    margin: p.revenue > 0 ? ((p.revenue - p.cost) / p.revenue) * 100 : 0,
    revenue: p.revenue,
    cost: p.cost,
  }));
  const highMarginMedicines = medicineMargins.filter(m => m.margin > 0).sort((a, b) => b.margin - a.margin);
  const lowMarginMedicines = medicineMargins.filter(m => m.margin >= 0).sort((a, b) => a.margin - b.margin);

  // Export handlers
  const handleExportPDF = () => {
    window.print();
    toast.success("Printing report...");
  };

  const handleExportCSV = () => {
    const headers = ["Medicine", "Quantity Sold", "Revenue", "Cost", "Profit"];
    const rows = sortedProducts.map(p => [p.name, p.quantity, p.revenue, p.cost, p.revenue - p.cost]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `monthly-report-${format(selectedMonth, "yyyy-MM")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported successfully");
  };

  if (!authChecked) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background print:bg-white">
      {/* Header */}
      <header className="border-b bg-card shadow-sm print:hidden">
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

      {/* Print Header */}
      <div className="hidden print:block p-6 border-b">
        <h1 className="text-2xl font-bold">{t("monthlyReport")} - {format(selectedMonth, "MMMM yyyy")}</h1>
        <p className="text-sm text-muted-foreground">Generated: {format(new Date(), "yyyy-MM-dd HH:mm")}</p>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* 2. Sales Summary */}
        <SalesSummarySection
          totalValue={totalValue}
          totalTransactions={totalTransactions}
          prescriptionSales={prescriptionSales}
          otcSales={otcSales}
          averageSaleValue={averageSaleValue}
          previousMonthValue={previousMonthValue}
        />

        {/* 3. Sales Breakdown */}
        <SalesBreakdownSection
          categorySales={Object.values(categorySales)}
          topProducts={topProducts}
          leastProducts={leastProducts}
        />

        {/* 4. Inventory Status */}
        <InventoryStatusSection
          openingStock={openingStock}
          closingStock={closingStock}
          currentStock={currentStock}
          stockValueCost={stockValueCost}
          stockValueSelling={stockValueSelling}
          outOfStockMedicines={outOfStockMedicines}
          lowStockMedicines={lowStockMedicines}
          overstockedMedicines={overstockedMedicines}
        />

        {/* 5. Stock Movement Summary */}
        <StockMovementSection
          totalReceived={totalReceived}
          totalIssued={totalIssued}
          netChange={netChange}
          adjustments={Object.values(adjustmentsSummary)}
        />

        {/* 8. Controlled Drugs Report */}
        <ControlledDrugsSection logs={controlledDrugsLogs} />

        {/* 9. Losses, Returns & Adjustments */}
        <LossesReturnsSection data={lossData} />

        {/* 10. Audit & User Activity */}
        <AuditActivitySection
          staffActivities={staffActivities}
          auditLogs={auditLogs}
          isAdmin={isAdmin}
        />

        {/* 11. Financial Summary */}
        <FinancialSummarySection
          totalRevenue={totalValue}
          cogs={cogs}
          grossProfit={grossProfit}
          grossProfitMargin={grossProfitMargin}
          highMarginMedicines={highMarginMedicines}
          lowMarginMedicines={lowMarginMedicines}
        />

        {/* 14. Export & Compliance */}
        <ExportComplianceSection
          selectedMonth={selectedMonth}
          onExportPDF={handleExportPDF}
          onExportCSV={handleExportCSV}
        />
      </main>
    </div>
  );
};

export default MonthlyReport;