import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useOrganization = () => {
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [organizationName, setOrganizationName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrg = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setIsLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", session.user.id)
        .single();

      if (profile?.organization_id) {
        setOrganizationId(profile.organization_id);
        
        const { data: org } = await supabase
          .from("organizations")
          .select("name")
          .eq("id", profile.organization_id)
          .single();
        
        setOrganizationName(org?.name || null);
      }
      setIsLoading(false);
    };

    fetchOrg();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchOrg();
    });

    return () => subscription.unsubscribe();
  }, []);

  return { organizationId, organizationName, isLoading };
};
