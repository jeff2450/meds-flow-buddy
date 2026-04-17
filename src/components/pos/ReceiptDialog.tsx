import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Printer, Download, FileText } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import jsPDF from "jspdf";

interface SaleData {
  receiptNumber: string;
  cart: Array<{ medicine: { name: string }; qty: number; price: number }>;
  total: number;
  paid: number;
  balance: number;
  method: string;
  customer: string | null;
  date: Date;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  sale: SaleData;
}

const PHARMACY_NAME = "DawaTrack Pharmacy";

export const ReceiptDialog = ({ open, onOpenChange, sale }: Props) => {
  const [format80, setFormat80] = useState<"thermal" | "a4">("thermal");

  const printReceipt = () => {
    const win = window.open("", "_blank", "width=400,height=600");
    if (!win) return;
    const isThermal = format80 === "thermal";
    win.document.write(`
      <html><head><title>Receipt ${sale.receiptNumber}</title>
      <style>
        body { font-family: ${isThermal ? "monospace" : "Arial, sans-serif"}; padding: ${isThermal ? "8px" : "40px"}; max-width: ${isThermal ? "300px" : "100%"}; margin: 0 auto; font-size: ${isThermal ? "12px" : "14px"}; }
        h1 { text-align: center; margin: 4px 0; font-size: ${isThermal ? "16px" : "24px"}; }
        .meta { text-align: center; font-size: ${isThermal ? "10px" : "12px"}; margin-bottom: 8px; }
        table { width: 100%; border-collapse: collapse; margin: 8px 0; }
        td, th { padding: 4px 2px; text-align: left; }
        th { border-bottom: 1px dashed #000; }
        .right { text-align: right; }
        .total { border-top: 1px dashed #000; padding-top: 6px; font-weight: bold; }
        .footer { text-align: center; margin-top: 16px; font-size: ${isThermal ? "10px" : "12px"}; }
      </style></head><body>
      <h1>${PHARMACY_NAME}</h1>
      <div class="meta">
        Receipt: <strong>${sale.receiptNumber}</strong><br/>
        ${format(sale.date, "PPpp")}<br/>
        ${sale.customer ? `Customer: ${sale.customer}<br/>` : ""}
        Payment: ${sale.method.replace("_", " ").toUpperCase()}
      </div>
      <table>
        <thead><tr><th>Item</th><th class="right">Qty</th><th class="right">Price</th><th class="right">Total</th></tr></thead>
        <tbody>
          ${sale.cart.map(c => `<tr><td>${c.medicine.name}</td><td class="right">${c.qty}</td><td class="right">${c.price.toLocaleString()}</td><td class="right">${(c.qty*c.price).toLocaleString()}</td></tr>`).join("")}
        </tbody>
      </table>
      <div class="total">
        <table>
          <tr><td>TOTAL</td><td class="right">TZS ${sale.total.toLocaleString()}</td></tr>
          <tr><td>Paid</td><td class="right">TZS ${sale.paid.toLocaleString()}</td></tr>
          ${sale.balance > 0 ? `<tr><td>Balance Due</td><td class="right">TZS ${sale.balance.toLocaleString()}</td></tr>` : ""}
        </table>
      </div>
      <div class="footer">Thank you for your business!<br/>Get well soon 💚</div>
      <script>window.onload = () => { window.print(); }</script>
      </body></html>
    `);
    win.document.close();
  };

  const downloadPDF = () => {
    const isThermal = format80 === "thermal";
    const doc = new jsPDF({
      unit: "mm",
      format: isThermal ? [80, 200] : "a4",
    });
    const W = isThermal ? 80 : 210;
    let y = 10;
    doc.setFontSize(isThermal ? 12 : 18);
    doc.setFont("helvetica", "bold");
    doc.text(PHARMACY_NAME, W / 2, y, { align: "center" });
    y += isThermal ? 6 : 10;
    doc.setFontSize(isThermal ? 8 : 10);
    doc.setFont("helvetica", "normal");
    doc.text(`Receipt: ${sale.receiptNumber}`, W / 2, y, { align: "center" });
    y += 4;
    doc.text(format(sale.date, "PPpp"), W / 2, y, { align: "center" });
    y += 4;
    if (sale.customer) {
      doc.text(`Customer: ${sale.customer}`, W / 2, y, { align: "center" });
      y += 4;
    }
    doc.text(`Payment: ${sale.method.replace("_", " ").toUpperCase()}`, W / 2, y, { align: "center" });
    y += 6;
    doc.line(5, y, W - 5, y);
    y += 4;

    doc.setFont("helvetica", "bold");
    doc.text("Item", 5, y);
    doc.text("Qty", W - 35, y, { align: "right" });
    doc.text("Total", W - 5, y, { align: "right" });
    y += 4;
    doc.line(5, y, W - 5, y);
    y += 4;
    doc.setFont("helvetica", "normal");
    sale.cart.forEach((c) => {
      const name = c.medicine.name.length > 25 ? c.medicine.name.slice(0, 25) + "…" : c.medicine.name;
      doc.text(name, 5, y);
      doc.text(`${c.qty}`, W - 35, y, { align: "right" });
      doc.text(`${(c.qty * c.price).toLocaleString()}`, W - 5, y, { align: "right" });
      y += 4;
    });
    y += 2;
    doc.line(5, y, W - 5, y);
    y += 5;
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL", 5, y);
    doc.text(`TZS ${sale.total.toLocaleString()}`, W - 5, y, { align: "right" });
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.text("Paid", 5, y);
    doc.text(`TZS ${sale.paid.toLocaleString()}`, W - 5, y, { align: "right" });
    y += 5;
    if (sale.balance > 0) {
      doc.text("Balance Due", 5, y);
      doc.text(`TZS ${sale.balance.toLocaleString()}`, W - 5, y, { align: "right" });
      y += 5;
    }
    y += 4;
    doc.setFontSize(isThermal ? 8 : 10);
    doc.text("Thank you for your business!", W / 2, y, { align: "center" });
    doc.save(`receipt-${sale.receiptNumber}.pdf`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Receipt {sale.receiptNumber}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={format80} onValueChange={(v: any) => setFormat80(v)}>
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="thermal">Thermal (80mm)</TabsTrigger>
            <TabsTrigger value="a4">A4 Invoice</TabsTrigger>
          </TabsList>
          <TabsContent value="thermal" className="mt-4">
            <ReceiptPreview sale={sale} compact />
          </TabsContent>
          <TabsContent value="a4" className="mt-4">
            <ReceiptPreview sale={sale} />
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button variant="outline" onClick={downloadPDF}>
            <Download className="h-4 w-4 mr-2" /> PDF
          </Button>
          <Button onClick={printReceipt}>
            <Printer className="h-4 w-4 mr-2" /> Print
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const ReceiptPreview = ({ sale, compact }: { sale: SaleData; compact?: boolean }) => (
  <div className={`border rounded p-4 ${compact ? "font-mono text-xs max-w-[280px] mx-auto" : "text-sm"} bg-background`}>
    <div className="text-center font-bold text-base mb-1">{PHARMACY_NAME}</div>
    <div className="text-center text-xs space-y-0.5 pb-2 border-b border-dashed">
      <div>Receipt: <strong>{sale.receiptNumber}</strong></div>
      <div>{format(sale.date, "PPpp")}</div>
      {sale.customer && <div>Customer: {sale.customer}</div>}
      <div>Payment: {sale.method.replace("_", " ").toUpperCase()}</div>
    </div>
    <table className="w-full my-2">
      <thead>
        <tr className="border-b border-dashed">
          <th className="text-left py-1">Item</th>
          <th className="text-right">Qty</th>
          <th className="text-right">Total</th>
        </tr>
      </thead>
      <tbody>
        {sale.cart.map((c, i) => (
          <tr key={i}>
            <td className="py-0.5">{c.medicine.name}</td>
            <td className="text-right">{c.qty}</td>
            <td className="text-right">{(c.qty * c.price).toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
    <div className="border-t border-dashed pt-2 space-y-1 font-bold">
      <div className="flex justify-between"><span>TOTAL</span><span>TZS {sale.total.toLocaleString()}</span></div>
      <div className="flex justify-between font-normal"><span>Paid</span><span>TZS {sale.paid.toLocaleString()}</span></div>
      {sale.balance > 0 && (
        <div className="flex justify-between text-amber-600"><span>Balance Due</span><span>TZS {sale.balance.toLocaleString()}</span></div>
      )}
    </div>
    <div className="text-center text-xs mt-3 text-muted-foreground">Thank you for your business!</div>
  </div>
);
