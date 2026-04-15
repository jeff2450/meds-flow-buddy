import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

type AppRole = "admin" | "worker" | "manager" | "pharmacist" | "staff";

interface UserRoleState {
  roles: AppRole[];
  isAdmin: boolean;
  isWorker: boolean;
  isManager: boolean;
  isPharmacist: boolean;
  isStaff: boolean;
  hasAnyRole: boolean;
  isLoading: boolean;
}

export const useUserRole = (): UserRoleState => {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUserId(session?.user?.id ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ["user-roles", userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (error) {
        console.error("Error fetching user roles:", error);
        return [];
      }

      return data.map((r) => r.role as AppRole);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  return {
    roles,
    isAdmin: roles.includes("admin"),
    isWorker: roles.includes("worker"),
    hasAnyRole: roles.length > 0,
    isLoading: isLoading || userId === null,
  };
};
