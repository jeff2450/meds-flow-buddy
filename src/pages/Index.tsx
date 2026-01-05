import { DashboardStats } from "@/components/DashboardStats";
import { MedicineTable } from "@/components/MedicineTable";
import { TransactionDialog } from "@/components/TransactionDialog";
import { AddMedicineDialog } from "@/components/AddMedicineDialog";
import { SalesTable } from "@/components/SalesTable";
import UserManagement from "@/components/UserManagement";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { SyncStatus } from "@/components/SyncStatus";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, DollarSign, FileText, LogOut, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  getOfflineSession, 
  clearOfflineSession, 
  isOnline 
} from "@/lib/offlineAuth";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [online, setOnline] = useState(isOnline());
  const [offlineUser, setOfflineUser] = useState<{
    userId: string;
    email: string;
    fullName: string | null;
    roles: string[];
  } | null>(null);
  const { isAdmin, isWorker, hasAnyRole, isLoading: rolesLoading } = useUserRole();

  // Check offline mode roles
  const offlineIsAdmin = offlineUser?.roles.includes('admin') ?? false;
  const offlineIsWorker = offlineUser?.roles.includes('worker') ?? false;
  
  const canPerformActions = isOfflineMode 
    ? (offlineIsAdmin || offlineIsWorker)
    : (isAdmin || isWorker);

  const showAdminTab = isOfflineMode ? offlineIsAdmin : isAdmin;

  // Handle online/offline status changes
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

  useEffect(() => {
    const checkAuth = async () => {
      // First check Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setIsOfflineMode(false);
        setLoading(false);
        return;
      }
      
      // If no Supabase session, check for offline session
      const offlineSession = getOfflineSession();
      if (offlineSession) {
        setIsOfflineMode(true);
        setOfflineUser(offlineSession);
        setLoading(false);
        return;
      }
      
      // No session at all, redirect to auth
      navigate("/auth");
    };
    
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setIsOfflineMode(false);
        clearOfflineSession();
      } else if (!getOfflineSession()) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    if (online) {
      await supabase.auth.signOut();
    }
    clearOfflineSession();
    setIsOfflineMode(false);
    setOfflineUser(null);
    toast({
      title: t("logout"),
      description: t("success"),
    });
    navigate("/auth");
  };

  if (loading) {
    return null;
  }

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
                  {t("appTitle")}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("appSubtitle")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Sync Status */}
              <SyncStatus />
              
              {isOfflineMode && (
                <Badge variant="outline" className="text-amber-600 border-amber-300">
                  <WifiOff className="h-3 w-3 mr-1" />
                  Offline Mode
                </Badge>
              )}
              
              <LanguageSwitch />
              <Button variant="outline" onClick={() => navigate("/monthly-report")}>
                <FileText className="h-4 w-4 mr-2" />
                {t("monthlyReport")}
              </Button>
              {canPerformActions && (
                <>
                  <Button onClick={() => navigate("/sales-recording")}>
                    <DollarSign className="h-4 w-4 mr-2" />
                    {t("recordSales")}
                  </Button>
                  <AddMedicineDialog />
                  <TransactionDialog />
                </>
              )}
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                {t("logout")}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Offline Mode Banner */}
      {isOfflineMode && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800 px-4 py-2">
          <p className="text-sm text-amber-800 dark:text-amber-200 text-center">
            <WifiOff className="inline h-4 w-4 mr-1" />
            You're working in offline mode. Data will sync when you're back online.
            {offlineUser?.fullName && (
              <span className="ml-2 font-medium">Logged in as: {offlineUser.fullName}</span>
            )}
          </p>
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="inventory" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="inventory">{t("inventory")}</TabsTrigger>
            <TabsTrigger value="sales">{t("sales")}</TabsTrigger>
            {showAdminTab && <TabsTrigger value="users">{t("userManagement")}</TabsTrigger>}
          </TabsList>
          <TabsContent value="inventory" className="space-y-8">
            <section>
              <h2 className="text-xl font-semibold mb-4">{t("overview")}</h2>
              <DashboardStats />
            </section>
            <section>
              <MedicineTable />
            </section>
          </TabsContent>
          <TabsContent value="sales" className="space-y-8">
            <SalesTable />
          </TabsContent>
          {showAdminTab && (
            <TabsContent value="users">
              <UserManagement />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
