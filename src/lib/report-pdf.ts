import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export type ReportData = {
  sales: any[];
  inventory: any[];
  contracts: any[];
  aiSummary?: string;
  user?: string;
};

export function buildBusinessReport(d: ReportData): jsPDF {
  const doc = new jsPDF();
  const totalRevenue = d.sales.reduce((s, r: any) => s + Number(r.amount), 0);
  const totalOrders = d.sales.length;
  const lowStock = d.inventory.filter((i: any) => i.quantity <= i.reorder_level);
  const customers = new Set(d.sales.map((s: any) => s.customer).filter(Boolean)).size;

  doc.setFillColor(230, 120, 60);
  doc.rect(0, 0, 210, 28, "F");
  doc.setTextColor(255);
  doc.setFontSize(20);
  doc.text("Nexova AI — Business Report", 14, 18);
  doc.setFontSize(9);
  doc.text(new Date().toLocaleString(), 14, 24);

  doc.setTextColor(40);
  doc.setFontSize(12);
  doc.text("Executive Summary", 14, 40);
  doc.setFontSize(10);
  doc.setTextColor(80);
  const summary = d.aiSummary?.trim() ||
    `Total revenue $${totalRevenue.toLocaleString()} across ${totalOrders} orders from ${customers} customers. ${lowStock.length} inventory items below reorder level. ${d.contracts.length} contracts on file.`;
  const wrapped = doc.splitTextToSize(summary, 180);
  doc.text(wrapped, 14, 47);

  let y = 47 + wrapped.length * 5 + 6;

  doc.setFontSize(12);
  doc.setTextColor(40);
  doc.text("Key Metrics", 14, y);
  y += 4;
  autoTable(doc, {
    startY: y,
    head: [["Metric", "Value"]],
    body: [
      ["Total Revenue", `$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`],
      ["Total Orders", String(totalOrders)],
      ["Active Customers", String(customers)],
      ["Low Stock Items", String(lowStock.length)],
      ["Contracts", String(d.contracts.length)],
    ],
    headStyles: { fillColor: [230, 120, 60] },
    styles: { fontSize: 9 },
  });

  y = (doc as any).lastAutoTable.finalY + 8;
  doc.setFontSize(12);
  doc.text("Recent Sales", 14, y);
  autoTable(doc, {
    startY: y + 2,
    head: [["Date", "Customer", "Product", "Amount"]],
    body: d.sales.slice(0, 12).map((r: any) => [
      new Date(r.created_at).toLocaleDateString(),
      (r.customer ?? "—").slice(0, 22),
      (r.product_name ?? "—").slice(0, 26),
      `$${Number(r.amount).toLocaleString()}`,
    ]),
    headStyles: { fillColor: [230, 120, 60] },
    styles: { fontSize: 8 },
  });

  if (lowStock.length) {
    y = (doc as any).lastAutoTable.finalY + 8;
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFontSize(12);
    doc.text("Low Stock Alerts", 14, y);
    autoTable(doc, {
      startY: y + 2,
      head: [["Item", "SKU", "Qty", "Reorder"]],
      body: lowStock.slice(0, 15).map((i: any) => [
        i.item_name, i.sku, String(i.quantity), String(i.reorder_level),
      ]),
      headStyles: { fillColor: [230, 120, 60] },
      styles: { fontSize: 8 },
    });
  }

  if (d.contracts.length) {
    y = (doc as any).lastAutoTable.finalY + 8;
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFontSize(12);
    doc.text("Contracts", 14, y);
    autoTable(doc, {
      startY: y + 2,
      head: [["Title", "Vendor", "Status", "Value"]],
      body: d.contracts.slice(0, 12).map((c: any) => [
        (c.title ?? "—").slice(0, 30), c.vendor, c.status, `$${Number(c.value).toLocaleString()}`,
      ]),
      headStyles: { fillColor: [230, 120, 60] },
      styles: { fontSize: 8 },
    });
  }

  doc.setFontSize(8);
  doc.setTextColor(140);
  doc.text(`Generated for ${d.user ?? "Nexova user"} · Confidential`, 14, 290);
  return doc;
}
