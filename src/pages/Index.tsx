import { DashboardStats } from "@/components/DashboardStats";
import { MedicineTable } from "@/components/MedicineTable";
import { AddMedicineDialog } from "@/components/AddMedicineDialog";
import { TransactionDialog } from "@/components/TransactionDialog";
import { SalesTable } from "@/components/SalesTable";
import UserManagement from "@/components/UserManagement";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, DollarSign, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-primary-glow shadow-md">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                  Pharmaceutical Inventory
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage your medicine stock efficiently
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => navigate("/monthly-report")}>
                <FileText className="h-4 w-4 mr-2" />
                Monthly Report
              </Button>
              <Button onClick={() => navigate("/sales-recording")}>
                <DollarSign className="h-4 w-4 mr-2" />
                Record Sales
              </Button>
              <TransactionDialog type="intake" />
              <AddMedicineDialog />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="inventory" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="sales">Sales</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
          </TabsList>
          <TabsContent value="inventory" className="space-y-8">
            <section>
              <h2 className="text-xl font-semibold mb-4">Overview</h2>
              <DashboardStats />
            </section>
            <section>
              <MedicineTable />
            </section>
          </TabsContent>
          <TabsContent value="sales" className="space-y-8">
            <SalesTable />
          </TabsContent>
          <TabsContent value="users">
            <UserManagement />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
