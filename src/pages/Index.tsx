import { DashboardStats } from "@/components/DashboardStats";
import { MedicineTable } from "@/components/MedicineTable";
import { AddMedicineDialog } from "@/components/AddMedicineDialog";
import { TransactionDialog } from "@/components/TransactionDialog";
import { Activity } from "lucide-react";

const Index = () => {
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
              <TransactionDialog type="intake" />
              <TransactionDialog type="outtake" />
              <AddMedicineDialog />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Stats Section */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Overview</h2>
            <DashboardStats />
          </section>

          {/* Inventory Table */}
          <section>
            <MedicineTable />
          </section>
        </div>
      </main>
    </div>
  );
};

export default Index;
