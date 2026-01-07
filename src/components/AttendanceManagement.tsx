import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Clock, Users } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { format, differenceInMinutes, startOfDay, endOfDay } from "date-fns";
import { cn } from "@/lib/utils";

interface AttendanceRecord {
  id: string;
  user_id: string;
  clock_in: string;
  clock_out: string | null;
  notes: string | null;
  profile?: {
    full_name: string | null;
    email: string | null;
  };
}

export const AttendanceManagement = () => {
  const { t, language } = useLanguage();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const { data: attendanceRecords, isLoading } = useQuery({
    queryKey: ["attendance-records", selectedDate.toISOString().split("T")[0]],
    queryFn: async () => {
      const dayStart = startOfDay(selectedDate).toISOString();
      const dayEnd = endOfDay(selectedDate).toISOString();
      
      // Fetch attendance records
      const { data: attendanceData, error: attendanceError } = await supabase
        .from("attendance")
        .select("*")
        .gte("clock_in", dayStart)
        .lte("clock_in", dayEnd)
        .order("clock_in", { ascending: false });
      
      if (attendanceError) throw attendanceError;
      if (!attendanceData?.length) return [];
      
      // Fetch profiles separately
      const userIds = [...new Set(attendanceData.map(a => a.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      return attendanceData.map(record => ({
        ...record,
        profile: profileMap.get(record.user_id) || null
      })) as AttendanceRecord[];
    },
  });

  const formatDuration = (clockIn: string, clockOut: string | null) => {
    if (!clockOut) return language === "sw" ? "Bado kazini" : "Still working";
    const minutes = differenceInMinutes(new Date(clockOut), new Date(clockIn));
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const totalStaff = new Set(attendanceRecords?.map(r => r.user_id)).size;
  const stillWorking = attendanceRecords?.filter(r => !r.clock_out).length || 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t("attendanceManagement")}
            </CardTitle>
            <CardDescription>
              {t("monitorStaffAttendance")}
            </CardDescription>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-[200px] justify-start text-left font-normal")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(selectedDate, "PPP")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{totalStaff}</div>
              <div className="text-sm text-muted-foreground">
                {language === "sw" ? "Jumla ya Wafanyakazi" : "Total Staff"}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-green-600">{stillWorking}</div>
              <div className="text-sm text-muted-foreground">
                {language === "sw" ? "Bado Kazini" : "Still Working"}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{attendanceRecords?.length || 0}</div>
              <div className="text-sm text-muted-foreground">
                {language === "sw" ? "Rekodi za Leo" : "Today's Records"}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Attendance Table */}
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">{t("loading")}</div>
        ) : !attendanceRecords?.length ? (
          <div className="text-center py-8 text-muted-foreground">
            {language === "sw" ? "Hakuna rekodi za mahudhurio" : "No attendance records"}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("staffMember")}</TableHead>
                <TableHead>{t("clockIn")}</TableHead>
                <TableHead>{t("clockOut")}</TableHead>
                <TableHead>{t("duration")}</TableHead>
                <TableHead>{t("status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendanceRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">
                    {record.profile?.full_name || record.profile?.email || record.user_id.slice(0, 8)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      {format(new Date(record.clock_in), "HH:mm")}
                    </div>
                  </TableCell>
                  <TableCell>
                    {record.clock_out ? (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {format(new Date(record.clock_out), "HH:mm")}
                      </div>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>{formatDuration(record.clock_in, record.clock_out)}</TableCell>
                  <TableCell>
                    <Badge variant={record.clock_out ? "secondary" : "default"}>
                      {record.clock_out 
                        ? (language === "sw" ? "Amemaliza" : "Completed")
                        : (language === "sw" ? "Kazini" : "Working")}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
