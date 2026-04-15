import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useOrganization } from "@/hooks/useOrganization";
import { Sidebar } from "@/components/Sidebar";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { Settings as SettingsIcon, Building2, Shield, Bell, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { language } = useLanguage();
  const { isAdmin } = useUserRole();
  const { organizationId, organizationName } = useOrganization();
  const [orgName, setOrgName] = useState("");
  const [saving, setSaving] = useState(false);

  // Role management state
  const [users, setUsers] = useState<any[]>([]);
  const [userRoles, setUserRoles] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    if (organizationName) setOrgName(organizationName);
  }, [organizationName]);

  useEffect(() => {
    if (isAdmin) fetchUsers();
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      const { data: profilesData } = await supabase.rpc("get_user_list_for_admin");
      const { data: rolesData } = await supabase.from("user_roles").select("user_id, role");
      setUsers(profilesData || []);
      setUserRoles(rolesData || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSaveOrg = async () => {
    if (!organizationId || !orgName.trim()) return;
    setSaving(true);
    const { error } = await supabase
      .from("organizations")
      .update({ name: orgName.trim() })
      .eq("id", organizationId);

    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      toast({ title: language === "sw" ? "Imehifadhiwa" : "Saved", description: language === "sw" ? "Jina la shirika limesasishwa" : "Organization name updated" });
    }
    setSaving(false);
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    // Remove existing roles first
    await supabase.from("user_roles").delete().eq("user_id", userId);
    // Insert new role
    const { error } = await supabase.from("user_roles").insert([{ user_id: userId, role: newRole as any }]);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      toast({ title: language === "sw" ? "Jukumu limebadilishwa" : "Role updated" });
      fetchUsers();
    }
  };

  const getUserRole = (userId: string) => {
    return userRoles.find((r) => r.user_id === userId)?.role || "worker";
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/auth");
    });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {language === "sw" ? "Rudi" : "Back"}
            </Button>
            <LanguageSwitch />
          </div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <SettingsIcon className="h-8 w-8 text-primary" />
            {language === "sw" ? "Mipangilio" : "Settings"}
          </h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6 max-w-3xl">
        {/* Organization Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {language === "sw" ? "Shirika" : "Organization"}
            </CardTitle>
            <CardDescription>
              {language === "sw" ? "Badilisha maelezo ya shirika lako" : "Update your organization details"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{language === "sw" ? "Jina la Shirika" : "Organization Name"}</Label>
              <Input
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="My Pharmacy"
                disabled={!isAdmin}
              />
            </div>
            {isAdmin && (
              <Button onClick={handleSaveOrg} disabled={saving}>
                {saving ? (language === "sw" ? "Inahifadhi..." : "Saving...") : (language === "sw" ? "Hifadhi" : "Save")}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Role Management (Admin only) */}
        {isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                {language === "sw" ? "Usimamizi wa Majukumu" : "Role Management"}
              </CardTitle>
              <CardDescription>
                {language === "sw" ? "Badilisha majukumu ya watumiaji" : "Change user roles and permissions"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingUsers ? (
                <p className="text-muted-foreground">{language === "sw" ? "Inapakia..." : "Loading..."}</p>
              ) : (
                <div className="space-y-3">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{user.full_name || "—"}</p>
                        <p className="text-sm text-muted-foreground">{user.email_masked}</p>
                      </div>
                      <Select
                        value={getUserRole(user.id)}
                        onValueChange={(role) => handleRoleChange(user.id, role)}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="pharmacist">Pharmacist</SelectItem>
                          <SelectItem value="worker">Worker</SelectItem>
                          <SelectItem value="staff">Staff</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Alert Thresholds */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              {language === "sw" ? "Mipangilio ya Tahadhari" : "Alert Settings"}
            </CardTitle>
            <CardDescription>
              {language === "sw" ? "Weka vizingiti vya tahadhari" : "Configure alert thresholds"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{language === "sw" ? "Kiwango cha Chini cha Hisa (default)" : "Default Low Stock Threshold"}</Label>
              <Input type="number" defaultValue={10} min={1} max={1000} disabled={!isAdmin} />
              <p className="text-xs text-muted-foreground">
                {language === "sw" ? "Onyesha tahadhari wakati hisa iko chini ya kiwango hiki" : "Show alert when stock falls below this level"}
              </p>
            </div>
            <div className="space-y-2">
              <Label>{language === "sw" ? "Siku za Tahadhari ya Kuisha Muda" : "Expiry Alert Days"}</Label>
              <Input type="number" defaultValue={30} min={7} max={180} disabled={!isAdmin} />
              <p className="text-xs text-muted-foreground">
                {language === "sw" ? "Onyesha tahadhari siku zilizobaki kabla ya kuisha muda" : "Show alert this many days before expiry"}
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Settings;
