import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Shield } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { workerRegistrationSchema } from "@/lib/validations";
import { useLanguage } from "@/contexts/LanguageContext";

interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
}

interface UserRole {
  user_id: string;
  role: string;
}

export default function UserManagement() {
  const { t, language } = useLanguage();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      setProfiles(profilesData || []);
      setUserRoles(rolesData || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: language === "sw" ? "Kosa la kupakia watumiaji" : "Error loading users",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const assignRole = async (userId: string, role: "worker" | "admin") => {
    try {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role });

      if (error) throw error;

      toast({
        title: language === "sw" ? "Jukumu limepewa" : "Role assigned",
        description: language === "sw" 
          ? `Mtumiaji amepewa jukumu la ${role === "admin" ? "msimamizi" : "mfanyakazi"}.`
          : `User has been assigned the ${role} role.`,
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: language === "sw" ? "Kosa la kutoa jukumu" : "Error assigning role",
        description: error.message,
      });
    }
  };

  const removeRole = async (userId: string, role: "worker" | "admin") => {
    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role);

      if (error) throw error;

      toast({
        title: language === "sw" ? "Jukumu limeondolewa" : "Role removed",
        description: language === "sw" 
          ? `Jukumu la ${role === "admin" ? "msimamizi" : "mfanyakazi"} limeondolewa.`
          : `${role} role has been removed.`,
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: language === "sw" ? "Kosa la kuondoa jukumu" : "Error removing role",
        description: error.message,
      });
    }
  };

  const getUserRoles = (userId: string) => {
    return userRoles.filter((ur) => ur.user_id === userId).map((ur) => ur.role);
  };

  const registerWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setRegistering(true);

    const result = workerRegistrationSchema.safeParse({
      fullName: formData.fullName.trim(),
      email: formData.email.trim(),
      password: formData.password,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      toast({
        variant: "destructive",
        title: language === "sw" ? "Kosa la uthibitishaji" : "Validation error",
        description: result.error.errors[0]?.message,
      });
      setRegistering(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: result.data.email,
        password: result.data.password,
        options: {
          data: {
            full_name: result.data.fullName,
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;

      if (data.user) {
        await assignRole(data.user.id, "worker");

        toast({
          title: language === "sw" ? "Mfanyakazi amesajiliwa" : "Worker registered",
          description: language === "sw" 
            ? `${result.data.fullName} amesajiliwa na kupewa jukumu la mfanyakazi.`
            : `${result.data.fullName} has been registered and assigned worker role.`,
        });

        setDialogOpen(false);
        setFormData({ email: "", password: "", fullName: "" });
        setErrors({});
        fetchUsers();
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: language === "sw" ? "Usajili umeshindwa" : "Registration failed",
        description: error.message,
      });
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">{t("loading")}</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {t("userManagement")}
            </CardTitle>
            <CardDescription>
              {t("manageUsersDesc")}
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                {t("registerWorker")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("registerNewWorker")}</DialogTitle>
                <DialogDescription>
                  {language === "sw" 
                    ? "Unda akaunti mpya ya mfanyakazi na barua pepe na nenosiri."
                    : "Create a new worker account with email and password."}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={registerWorker} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">{t("fullName")}</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    required
                    maxLength={100}
                    className={errors.fullName ? "border-destructive" : ""}
                  />
                  {errors.fullName && (
                    <p className="text-sm text-destructive">{errors.fullName}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t("email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                    maxLength={255}
                    className={errors.email ? "border-destructive" : ""}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">{t("password")}</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required
                    maxLength={128}
                    className={errors.password ? "border-destructive" : ""}
                  />
                  <p className="text-xs text-muted-foreground">
                    {language === "sw" 
                      ? "Angalau herufi 8 zenye herufi kubwa, ndogo, na nambari"
                      : "Min 8 chars with uppercase, lowercase, and number"}
                  </p>
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password}</p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={registering}>
                  {registering 
                    ? (language === "sw" ? "Inasajili..." : "Registering...") 
                    : t("registerWorker")}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {profiles.map((profile) => {
            const roles = getUserRoles(profile.id);
            const hasWorkerRole = roles.includes("worker");
            const hasAdminRole = roles.includes("admin");

            return (
              <div
                key={profile.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="font-medium">{profile.full_name || (language === "sw" ? "Hakuna jina" : "No name")}</div>
                  <div className="text-sm text-muted-foreground">{profile.email}</div>
                  <div className="flex gap-2 mt-2">
                    {hasWorkerRole && <Badge variant="secondary">{t("worker")}</Badge>}
                    {hasAdminRole && <Badge variant="default">{t("admin")}</Badge>}
                    {!hasWorkerRole && !hasAdminRole && (
                      <Badge variant="outline">
                        {language === "sw" ? "Hakuna jukumu lililopewa" : "No role assigned"}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {!hasAdminRole && (
                    <Button
                      size="sm"
                      onClick={() => assignRole(profile.id, "admin")}
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      {t("makeAdmin")}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
