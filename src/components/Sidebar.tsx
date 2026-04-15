import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  ClipboardList,
  Settings,
  LogOut,
  Activity,
  Users,
  FileText,
  Plus,
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  showAdminTabs: boolean;
  onLogout: () => void;
  userName?: string;
  canRecordSales?: boolean;
}

export const Sidebar = ({
  activeTab,
  onTabChange,
  showAdminTabs,
  onLogout,
  userName,
  canRecordSales = true,
}: SidebarProps) => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const menuItems = [
    { id: "dashboard", label: t("dashboard"), icon: LayoutDashboard },
    { id: "inventory", label: t("inventory"), icon: Package },
    { id: "sales", label: t("salesLabel"), icon: ShoppingCart },
    { id: "stock-intake", label: t("stockIntake"), icon: ClipboardList },
  ];

  const adminItems = [
    { id: "attendance", label: t("attendance"), icon: Users },
    { id: "users", label: t("userManagement"), icon: Settings },
    { id: "reports", label: t("monthlyReport"), icon: FileText },
    { id: "settings", label: language === "sw" ? "Mipangilio" : "Settings", icon: Settings },
  ];

  return (
    <div className="w-64 min-h-screen bg-sidebar flex flex-col border-r border-sidebar-border">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary to-primary-glow shadow-md">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-sidebar-foreground">
              {t("appTitle")}
            </h1>
            <p className="text-xs text-sidebar-foreground/60">
              {t("appSubtitle")}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Action */}
      {canRecordSales && (
        <div className="px-4 py-4">
          <Button 
            className="w-full gap-2"
            onClick={() => navigate("/sales-recording")}
          >
            <Plus className="h-4 w-4" />
            {t("recordSale")}
          </Button>
        </div>
      )}

      {/* Menu */}
      <div className="flex-1 p-4">
        <p className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-4 px-3">
          Menu
        </p>
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3 px-3 py-2.5 h-auto font-medium",
                activeTab === item.id
                  ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
              onClick={() => onTabChange(item.id)}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Button>
          ))}
        </nav>

        {showAdminTabs && (
          <>
            <p className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mt-6 mb-4 px-3">
              Admin
            </p>
            <nav className="space-y-1">
              {adminItems.map((item) => (
                <Button
                  key={item.id}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 px-3 py-2.5 h-auto font-medium",
                    activeTab === item.id
                      ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  )}
                  onClick={() => onTabChange(item.id)}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Button>
              ))}
            </nav>
          </>
        )}
      </div>

      {/* User Section */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-sidebar-accent flex items-center justify-center text-sidebar-foreground font-semibold text-sm">
            {userName?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {userName || "User"}
            </p>
            <p className="text-xs text-sidebar-foreground/60">{showAdminTabs ? "Administrator" : "Staff"}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-sidebar-foreground/60 hover:text-sidebar-foreground"
            onClick={onLogout}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
