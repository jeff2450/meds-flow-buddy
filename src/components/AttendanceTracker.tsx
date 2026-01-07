import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, LogIn, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { format } from "date-fns";

export const AttendanceTracker = () => {
  const { t, language } = useLanguage();
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, []);

  // Get today's active attendance (clocked in but not out)
  const { data: activeAttendance, isLoading } = useQuery({
    queryKey: ["active-attendance", userId],
    queryFn: async () => {
      if (!userId) return null;
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("user_id", userId)
        .gte("clock_in", `${today}T00:00:00`)
        .is("clock_out", null)
        .order("clock_in", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const handleClockIn = async () => {
    if (!userId) return;
    setLoading(true);
    
    const { error } = await supabase.from("attendance").insert({
      user_id: userId,
      clock_in: new Date().toISOString(),
    });

    if (error) {
      toast.error(language === "sw" ? "Imeshindwa kuingia" : "Failed to clock in");
      console.error(error);
    } else {
      toast.success(language === "sw" ? "Umeingia kikazi" : "Clocked in successfully");
      queryClient.invalidateQueries({ queryKey: ["active-attendance"] });
      queryClient.invalidateQueries({ queryKey: ["attendance-records"] });
    }
    setLoading(false);
  };

  const handleClockOut = async () => {
    if (!userId || !activeAttendance) return;
    setLoading(true);
    
    const { error } = await supabase
      .from("attendance")
      .update({ clock_out: new Date().toISOString() })
      .eq("id", activeAttendance.id);

    if (error) {
      toast.error(language === "sw" ? "Imeshindwa kutoka" : "Failed to clock out");
      console.error(error);
    } else {
      toast.success(language === "sw" ? "Umetoka kikazi" : "Clocked out successfully");
      queryClient.invalidateQueries({ queryKey: ["active-attendance"] });
      queryClient.invalidateQueries({ queryKey: ["attendance-records"] });
    }
    setLoading(false);
  };

  const isClockedIn = !!activeAttendance;

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5" />
          {t("attendance")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{t("status")}:</span>
          <Badge variant={isClockedIn ? "default" : "secondary"}>
            {isClockedIn 
              ? (language === "sw" ? "Kazini" : "Working") 
              : (language === "sw" ? "Haupo" : "Not Clocked In")}
          </Badge>
        </div>
        
        {isClockedIn && activeAttendance && (
          <div className="text-sm text-muted-foreground">
            {t("clockedInAt")}: {format(new Date(activeAttendance.clock_in), "HH:mm")}
          </div>
        )}

        {isClockedIn ? (
          <Button 
            onClick={handleClockOut} 
            disabled={loading || isLoading}
            variant="destructive"
            className="w-full"
          >
            <LogOut className="h-4 w-4 mr-2" />
            {t("clockOut")}
          </Button>
        ) : (
          <Button 
            onClick={handleClockIn} 
            disabled={loading || isLoading}
            className="w-full"
          >
            <LogIn className="h-4 w-4 mr-2" />
            {t("clockIn")}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
