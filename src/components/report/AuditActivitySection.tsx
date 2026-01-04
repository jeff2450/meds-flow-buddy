import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, Edit, Trash2, Plus } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { format } from "date-fns";

interface StaffActivity {
  name: string;
  email: string;
  salesCount: number;
  salesValue: number;
  intakeCount: number;
  adjustmentCount: number;
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
}

const AuditActivitySection = ({ staffActivities, auditLogs, isAdmin }: AuditActivityProps) => {
  const { t } = useLanguage();

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
            {isAdmin && (
              <TabsTrigger value="audit" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                {t("auditTrail")}
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="staff">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("name")}</TableHead>
                  <TableHead>{t("email")}</TableHead>
                  <TableHead className="text-right">{t("salesPerStaff")}</TableHead>
                  <TableHead className="text-right">{t("totalAmount")}</TableHead>
                  <TableHead className="text-right">{t("stockIntakePerUser")}</TableHead>
                  <TableHead className="text-right">{t("adjustmentsPerUser")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staffActivities.length > 0 ? staffActivities.map((staff, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{staff.name || 'Unknown'}</TableCell>
                    <TableCell>{staff.email}</TableCell>
                    <TableCell className="text-right">{staff.salesCount}</TableCell>
                    <TableCell className="text-right">{t("currency")} {staff.salesValue.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{staff.intakeCount}</TableCell>
                    <TableCell className="text-right">{staff.adjustmentCount}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">{t("noData")}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
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