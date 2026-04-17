import { DashboardStats } from "@/components/DashboardStats";
import { DashboardCharts } from "@/components/DashboardCharts";
import { MedicineTable } from "@/components/MedicineTable";
import { TransactionDialog } from "@/components/TransactionDialog";
import { AddMedicineDialog } from "@/components/AddMedicineDialog";
import { SalesTable } from "@/components/SalesTable";
import { SalesRecordDialog } from "@/components/SalesRecordDialog";
import UserManagement from "@/components/UserManagement";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { SyncStatus } from "@/components/SyncStatus";
import { AttendanceTracker } from "@/components/AttendanceTracker";
import { AttendanceManagement } from "@/components/AttendanceManagement";
import { Sidebar } from "@/components/Sidebar";
import { RecentSales } from "@/components/RecentSales";
import { LowStockAlert } from "@/components/LowStockAlert";
import { ExpiryAlerts } from "@/components/ExpiryAlerts";
import { Bell, Search, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [online, setOnline] = useState(isOnline());
  const [activeTab, setActiveTab] = useState("dashboard");
  const [userName, setUserName] = useState<string | null>(null);
  const [offlineUser, setOfflineUser] = useState<{
    userId: string;
    email: string;
    fullName: string | null;
    roles: string[];
  } | null>(null);
  const { isAdmin, isWorker } = useUserRole();

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
        // Fetch user profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", session.user.id)
          .single();
        setUserName(profile?.full_name || session.user.email || null);
        setLoading(false);
        return;
      }
      
      // If no Supabase session, check for offline session
      const offlineSession = getOfflineSession();
      if (offlineSession) {
        setIsOfflineMode(true);
        setOfflineUser(offlineSession);
        setUserName(offlineSession.fullName || offlineSession.email);
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

  const handleTabChange = (tab: string) => {
    const navMap: Record<string, string> = {
      reports: "/monthly-report",
      settings: "/settings",
      pos: "/pos",
      suppliers: "/suppliers",
      purchases: "/purchases",
      expenses: "/expenses",
      customers: "/customers",
      "reports-dashboard": "/reports",
    };
    if (navMap[tab]) {
      navigate(navMap[tab]);
    } else {
      setActiveTab(tab);
    }
  };

  if (loading) {
    return null;
  }

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <div className="space-y-6">
            <DashboardStats />
            <DashboardCharts />
            <div className="flex gap-6">
              <RecentSales />
              <div className="flex flex-col gap-6">
                <LowStockAlert />
                <ExpiryAlerts />
              </div>
            </div>
            {canPerformActions && !isOfflineMode && (
              <div className="flex justify-end">
                <AttendanceTracker />
              </div>
            )}
          </div>
        );
      case "inventory":
        return <MedicineTable />;
      case "sales":
        return <SalesTable />;
      case "stock-intake":
        return (
          <div className="space-y-4">
            <div className="flex gap-3">
              <TransactionDialog />
              <AddMedicineDialog />
            </div>
            <MedicineTable />
          </div>
        );
      case "attendance":
        return showAdminTab ? <AttendanceManagement /> : null;
      case "users":
        return showAdminTab ? <UserManagement /> : null;
      default:
        return null;
    }
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case "dashboard":
        return language === "sw" ? "Dashibodi" : "Dashboard";
      case "inventory":
        return t("inventory");
      case "sales":
        return t("salesLabel");
      case "stock-intake":
        return t("stockIntake");
      case "attendance":
        return t("attendance");
      case "users":
        return t("userManagement");
      default:
        return "";
    }
  };

  const getPageDescription = () => {
    switch (activeTab) {
      case "dashboard":
        return language === "sw" ? "Muhtasari wa shughuli za duka lako" : "Overview of your pharmacy operations";
      case "inventory":
        return language === "sw" ? "Simamia bidhaa zako" : "Manage your products";
      case "sales":
        return language === "sw" ? "Tazama rekodi za mauzo" : "View sales records";
      case "stock-intake":
        return language === "sw" ? "Rekodi upokeaji wa bidhaa" : "Record stock intake";
      case "attendance":
        return language === "sw" ? "Simamia mahudhurio ya wafanyakazi" : "Manage staff attendance";
      case "users":
        return language === "sw" ? "Simamia watumiaji wa mfumo" : "Manage system users";
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        showAdminTabs={showAdminTab}
        onLogout={handleLogout}
        userName={userName || undefined}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{getPageTitle()}</h1>
              <p className="text-sm text-muted-foreground">{getPageDescription()}</p>
            </div>
            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={language === "sw" ? "Tafuta bidhaa..." : "Search products..."}
                  className="pl-9 w-64 bg-background"
                />
              </div>
              
              {/* Sync Status */}
              <SyncStatus />
              
              {/* Language Switch */}
              <LanguageSwitch />
              
              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
              </Button>
              
              {isOfflineMode && (
                <Badge variant="outline" className="text-amber-600 border-amber-300">
                  <WifiOff className="h-3 w-3 mr-1" />
                  Offline
                </Badge>
              )}
            </div>
          </div>
        </header>

        {/* Offline Mode Banner */}
        {isOfflineMode && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800 px-6 py-2">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <WifiOff className="inline h-4 w-4 mr-1" />
              {language === "sw" 
                ? "Unafanya kazi bila mtandao. Data itasawazishwa ukiwa mtandaoni."
                : "You're working in offline mode. Data will sync when you're back online."
              }
            </p>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default Index;
