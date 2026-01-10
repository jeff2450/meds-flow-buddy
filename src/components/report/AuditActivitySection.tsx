import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, Users, Edit, Trash2, Plus, Eye, Clock, LogIn, LogOut } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface StaffSale {
  id: string;
  medicine_name: string;
  quantity_sold: number;
  total_amount: number;
  sale_date: string;
}

interface AttendanceSession {
  id: string;
  clock_in: string;
  clock_out: string | null;
  notes: string | null;
  salesCount: number;
  salesValue: number;
  sales: StaffSale[];
}

interface StaffActivity {
  id?: string;
  name: string;
  email: string;
  salesCount: number;
  salesValue: number;
  intakeCount: number;
  adjustmentCount: number;
  attendanceCount?: number;
  totalWorkingHours?: number;
  attendanceSessions?: AttendanceSession[];
  sales?: StaffSale[];
}

interface AuditLog {
  id: string;
  table_name: string;
  action: string;
  performed_by_email?: string;
  performed_at: string;
  record_id: string;
}

interface AuditActivityProps {
  staffActivities: StaffActivity[];
  auditLogs: AuditLog[];
  isAdmin: boolean;
  onDeleteSale?: (saleId: string) => void;
}

const AuditActivitySection = ({ staffActivities, auditLogs, isAdmin, onDeleteSale }: AuditActivityProps) => {
  const { t } = useLanguage();

  // Calculate total sales value for progress bars
  const maxSalesValue = Math.max(...staffActivities.map(s => s.salesValue), 1);
  const totalTeamSales = staffActivities.reduce((sum, s) => sum + s.salesValue, 0);
  const totalWorkingHours = staffActivities.reduce((sum, s) => sum + (s.totalWorkingHours || 0), 0);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'insert': return <Plus className="h-4 w-4 text-green-500" />;
      case 'update': return <Edit className="h-4 w-4 text-blue-500" />;
      case 'delete': return <Trash2 className="h-4 w-4 text-red-500" />;
      default: return null;
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'insert': return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">Insert</Badge>;
      case 'update': return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">Update</Badge>;
      case 'delete': return <Badge variant="destructive">Delete</Badge>;
      default: return <Badge variant="outline">{action}</Badge>;
    }
  };

  const formatDuration = (clockIn: string, clockOut: string | null) => {
    if (!clockOut) return t("activeSession") || "Active";
    const start = new Date(clockIn);
    const end = new Date(clockOut);
    const hours = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60));
    const minutes = Math.floor(((end.getTime() - start.getTime()) % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle>{t("auditUserActivity")}</CardTitle>
          </div>
          {isAdmin && <Badge variant="secondary">{t("adminOnly")}</Badge>}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="staff">
          <TabsList className="mb-4">
            <TabsTrigger value="staff" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {t("salesPerStaff")}
            </TabsTrigger>
            <TabsTrigger value="attendance" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {t("attendanceSales") || "Attendance & Sales"}
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="audit" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                {t("auditTrail")}
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="staff">
            {/* Performance Overview Cards for Admin */}
            {isAdmin && staffActivities.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-primary/10 rounded-lg">
                  <p className="text-sm text-muted-foreground">{t("totalTeamSales")}</p>
                  <p className="text-2xl font-bold">{t("currency")} {totalTeamSales.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-green-500/10 rounded-lg">
                  <p className="text-sm text-muted-foreground">{t("topPerformer")}</p>
                  <p className="text-lg font-bold">
                    {staffActivities.reduce((top, s) => s.salesValue > top.salesValue ? s : top, staffActivities[0])?.name || '-'}
                  </p>
                </div>
                <div className="p-4 bg-blue-500/10 rounded-lg">
                  <p className="text-sm text-muted-foreground">{t("averageSalesPerStaff")}</p>
                  <p className="text-2xl font-bold">
                    {t("currency")} {staffActivities.length > 0 ? Math.round(totalTeamSales / staffActivities.length).toLocaleString() : 0}
                  </p>
                </div>
                <div className="p-4 bg-orange-500/10 rounded-lg">
                  <p className="text-sm text-muted-foreground">{t("totalWorkingHours") || "Total Working Hours"}</p>
                  <p className="text-2xl font-bold">{totalWorkingHours.toFixed(1)}h</p>
                </div>
              </div>
            )}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("name")}</TableHead>
                  <TableHead>{t("email")}</TableHead>
                  <TableHead className="text-right">{t("salesPerStaff")}</TableHead>
                  <TableHead className="text-right">{t("totalAmount")}</TableHead>
                  <TableHead className="text-right">{t("workingHours") || "Hours"}</TableHead>
                  {isAdmin && <TableHead className="w-[150px]">{t("performance")}</TableHead>}
                  <TableHead className="text-right">{t("stockIntakePerUser")}</TableHead>
                  {isAdmin && <TableHead className="w-[100px]">{t("actions")}</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {staffActivities.length > 0 ? staffActivities.map((staff, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{staff.name || 'Unknown'}</TableCell>
                    <TableCell>{staff.email}</TableCell>
                    <TableCell className="text-right">{staff.salesCount}</TableCell>
                    <TableCell className="text-right font-semibold">{t("currency")} {staff.salesValue.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline" className="font-mono">
                        {staff.totalWorkingHours?.toFixed(1) || 0}h
                      </Badge>
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={(staff.salesValue / maxSalesValue) * 100} className="h-2 flex-1" />
                          <span className="text-xs text-muted-foreground w-10">
                            {Math.round((staff.salesValue / totalTeamSales) * 100) || 0}%
                          </span>
                        </div>
                      </TableCell>
                    )}
                    <TableCell className="text-right">{staff.intakeCount}</TableCell>
                    {isAdmin && (
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              {t("viewDetails")}
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                {staff.name || 'Unknown'} - {t("salesDetails")}
                              </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              {/* Staff Summary */}
                              <div className="grid grid-cols-4 gap-4">
                                <div className="p-3 bg-muted rounded-lg text-center">
                                  <p className="text-sm text-muted-foreground">{t("totalSales")}</p>
                                  <p className="text-xl font-bold">{staff.salesCount}</p>
                                </div>
                                <div className="p-3 bg-muted rounded-lg text-center">
                                  <p className="text-sm text-muted-foreground">{t("totalAmount")}</p>
                                  <p className="text-xl font-bold">{t("currency")} {staff.salesValue.toLocaleString()}</p>
                                </div>
                                <div className="p-3 bg-muted rounded-lg text-center">
                                  <p className="text-sm text-muted-foreground">{t("teamShare")}</p>
                                  <p className="text-xl font-bold">{Math.round((staff.salesValue / totalTeamSales) * 100) || 0}%</p>
                                </div>
                                <div className="p-3 bg-muted rounded-lg text-center">
                                  <p className="text-sm text-muted-foreground">{t("workingHours") || "Hours"}</p>
                                  <p className="text-xl font-bold">{staff.totalWorkingHours?.toFixed(1) || 0}h</p>
                                </div>
                              </div>

                              {/* Sales List with Delete Option */}
                              {staff.sales && staff.sales.length > 0 ? (
                                <div className="border rounded-lg">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>{t("date")}</TableHead>
                                        <TableHead>{t("medicine")}</TableHead>
                                        <TableHead className="text-right">{t("quantity")}</TableHead>
                                        <TableHead className="text-right">{t("totalAmount")}</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {staff.sales.map((sale) => (
                                        <TableRow key={sale.id}>
                                          <TableCell>{format(new Date(sale.sale_date), "MMM dd, yyyy")}</TableCell>
                                          <TableCell>{sale.medicine_name}</TableCell>
                                          <TableCell className="text-right">{sale.quantity_sold}</TableCell>
                                          <TableCell className="text-right">{t("currency")} {sale.total_amount.toLocaleString()}</TableCell>
                                          <TableCell>
                                            {onDeleteSale && (
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => onDeleteSale(sale.id)}
                                                className="h-8 w-8"
                                              >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                              </Button>
                                            )}
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              ) : (
                                <p className="text-center text-muted-foreground py-4">{t("noSalesDetails")}</p>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    )}
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 8 : 6} className="text-center text-muted-foreground py-8">{t("noData")}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="attendance">
            <CardDescription className="mb-4">
              {t("attendanceSalesDescription") || "View staff attendance sessions and sales made during each login period"}
            </CardDescription>
            
            {staffActivities.length > 0 ? (
              <Accordion type="single" collapsible className="w-full">
                {staffActivities.filter(s => (s.attendanceSessions?.length || 0) > 0).map((staff) => (
                  <AccordionItem key={staff.id || staff.email} value={staff.id || staff.email}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex items-center gap-3">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{staff.name || 'Unknown'}</span>
                          <Badge variant="outline">{staff.email}</Badge>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant="secondary" className="gap-1">
                            <Clock className="h-3 w-3" />
                            {staff.attendanceCount} {t("sessions") || "sessions"}
                          </Badge>
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 gap-1">
                            {t("currency")} {staff.salesValue.toLocaleString()}
                          </Badge>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pl-6">
                        {staff.attendanceSessions?.map((session) => (
                          <div key={session.id} className="border rounded-lg p-4 bg-muted/30">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 text-sm">
                                  <LogIn className="h-4 w-4 text-green-500" />
                                  <span>{format(new Date(session.clock_in), "MMM dd, HH:mm")}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <LogOut className="h-4 w-4 text-red-500" />
                                  <span>
                                    {session.clock_out 
                                      ? format(new Date(session.clock_out), "MMM dd, HH:mm")
                                      : t("stillActive") || "Still Active"
                                    }
                                  </span>
                                </div>
                                <Badge variant="outline" className="font-mono">
                                  {formatDuration(session.clock_in, session.clock_out)}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary">{session.salesCount} {t("salesLabel") || "sales"}</Badge>
                                <Badge className="bg-primary/10 text-primary">
                                  {t("currency")} {session.salesValue.toLocaleString()}
                                </Badge>
                              </div>
                            </div>
                            
                            {session.notes && (
                              <p className="text-sm text-muted-foreground mb-3 italic">"{session.notes}"</p>
                            )}
                            
                            {session.sales.length > 0 ? (
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>{t("time")}</TableHead>
                                    <TableHead>{t("medicine")}</TableHead>
                                    <TableHead className="text-right">{t("quantity")}</TableHead>
                                    <TableHead className="text-right">{t("totalAmount")}</TableHead>
                                    {isAdmin && onDeleteSale && <TableHead className="w-[50px]"></TableHead>}
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {session.sales.map((sale) => (
                                    <TableRow key={sale.id}>
                                      <TableCell className="text-sm">
                                        {format(new Date(sale.sale_date), "HH:mm")}
                                      </TableCell>
                                      <TableCell>{sale.medicine_name}</TableCell>
                                      <TableCell className="text-right">{sale.quantity_sold}</TableCell>
                                      <TableCell className="text-right">{t("currency")} {sale.total_amount.toLocaleString()}</TableCell>
                                      {isAdmin && onDeleteSale && (
                                        <TableCell>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onDeleteSale(sale.id)}
                                            className="h-8 w-8"
                                          >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                          </Button>
                                        </TableCell>
                                      )}
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            ) : (
                              <p className="text-sm text-muted-foreground text-center py-2">
                                {t("noSalesDuringSession") || "No sales recorded during this session"}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <div className="text-center text-muted-foreground py-8">{t("noData")}</div>
            )}
            
            {staffActivities.filter(s => (s.attendanceSessions?.length || 0) === 0 && s.salesCount > 0).length > 0 && (
              <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-900">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  {t("salesWithoutAttendance") || "Sales without attendance records:"}
                </p>
                <div className="mt-2 space-y-1">
                  {staffActivities.filter(s => (s.attendanceSessions?.length || 0) === 0 && s.salesCount > 0).map((staff) => (
                    <p key={staff.id || staff.email} className="text-sm text-muted-foreground">
                      {staff.name}: {staff.salesCount} {t("salesLabel") || "sales"} ({t("currency")} {staff.salesValue.toLocaleString()})
                    </p>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {isAdmin && (
            <TabsContent value="audit">
              <CardDescription className="mb-4">{t("deletedEditedRecords")}</CardDescription>
              <div className="max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("timestamp")}</TableHead>
                      <TableHead>{t("actionType")}</TableHead>
                      <TableHead>Table</TableHead>
                      <TableHead>{t("performedBy")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.length > 0 ? auditLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm">
                          {format(new Date(log.performed_at), "yyyy-MM-dd HH:mm:ss")}
                        </TableCell>
                        <TableCell>{getActionBadge(log.action)}</TableCell>
                        <TableCell className="capitalize">{log.table_name.replace('_', ' ')}</TableCell>
                        <TableCell>{log.performed_by_email || 'System'}</TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">{t("noData")}</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AuditActivitySection;
