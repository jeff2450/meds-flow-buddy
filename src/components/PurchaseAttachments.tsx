import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Paperclip, Upload, FileText, Trash2, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { useOrganization } from "@/hooks/useOrganization";

interface Props {
  purchaseId: string;
  count?: number;
}

export const PurchaseAttachments = ({ purchaseId, count }: Props) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAdmin } = useUserRole();
  const { organizationId } = useOrganization();
  const [uploading, setUploading] = useState(false);

  const { data: files = [], refetch } = useQuery({
    queryKey: ["purchase-attachments", purchaseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchase_attachments")
        .select("*")
        .eq("purchase_id", purchaseId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: open,
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !organizationId) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ variant: "destructive", title: "File too large", description: "Max 10MB" });
      return;
    }
    setUploading(true);
    try {
      const path = `${organizationId}/${purchaseId}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("supplier-invoices").upload(path, file);
      if (upErr) throw upErr;
      const { error: dbErr } = await supabase.from("purchase_attachments").insert({
        organization_id: organizationId,
        purchase_id: purchaseId,
        file_path: path,
        file_name: file.name,
        mime_type: file.type,
        file_size: file.size,
      });
      if (dbErr) throw dbErr;
      toast({ title: "Uploaded", description: file.name });
      refetch();
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Upload failed", description: err.message });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleView = async (path: string) => {
    const { data, error } = await supabase.storage.from("supplier-invoices").createSignedUrl(path, 60);
    if (error || !data?.signedUrl) {
      toast({ variant: "destructive", title: "Cannot open", description: error?.message });
      return;
    }
    window.open(data.signedUrl, "_blank");
  };

  const handleDelete = async (id: string, path: string) => {
    if (!confirm("Delete this attachment?")) return;
    await supabase.storage.from("supplier-invoices").remove([path]);
    await supabase.from("purchase_attachments").delete().eq("id", id);
    toast({ title: "Deleted" });
    refetch();
  };

  return (
    <>
      <Button size="sm" variant="ghost" onClick={() => setOpen(true)} className="h-7 px-2">
        <Paperclip className="h-3 w-3 mr-1" />
        {count ?? 0}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Invoice Attachments</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-md cursor-pointer hover:bg-accent">
              <Upload className="h-4 w-4" />
              <span className="text-sm">{uploading ? "Uploading..." : "Upload invoice (PDF / image, max 10MB)"}</span>
              <input type="file" className="hidden" accept="image/*,application/pdf" onChange={handleUpload} disabled={uploading} />
            </label>
            <div className="space-y-1">
              {files.length === 0 && (
                <p className="text-xs text-center text-muted-foreground py-4">No attachments yet</p>
              )}
              {files.map((f: any) => (
                <div key={f.id} className="flex items-center gap-2 p-2 border rounded">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="flex-1 text-sm truncate">{f.file_name}</span>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleView(f.file_path)}>
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                  {isAdmin && (
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleDelete(f.id, f.file_path)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
