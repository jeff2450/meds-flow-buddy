import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Shield } from "lucide-react";

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
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
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
        title: "Error loading users",
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
        title: "Role assigned",
        description: `User has been assigned the ${role} role.`,
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error assigning role",
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
        title: "Role removed",
        description: `${role} role has been removed.`,
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error removing role",
        description: error.message,
      });
    }
  };

  const getUserRoles = (userId: string) => {
    return userRoles.filter((ur) => ur.user_id === userId).map((ur) => ur.role);
  };

  if (loading) {
    return <div className="text-center py-8">Loading users...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          User Management
        </CardTitle>
        <CardDescription>
          Assign worker or admin roles to registered users
        </CardDescription>
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
                  <div className="font-medium">{profile.full_name || "No name"}</div>
                  <div className="text-sm text-muted-foreground">{profile.email}</div>
                  <div className="flex gap-2 mt-2">
                    {hasWorkerRole && <Badge variant="secondary">Worker</Badge>}
                    {hasAdminRole && <Badge variant="default">Admin</Badge>}
                    {!hasWorkerRole && !hasAdminRole && (
                      <Badge variant="outline">No role assigned</Badge>
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
                      Make Admin
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
