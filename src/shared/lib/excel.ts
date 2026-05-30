import * as XLSX from 'xlsx';

export function exportBillingToExcel(billing: any) {
  const wb = XLSX.utils.book_new();

  const formattedPeriod = `${new Date(billing.billingPeriodStart || billing.period?.start || Date.now()).toLocaleDateString('id-ID')} - ${new Date(billing.billingPeriodEnd || billing.period?.end || Date.now()).toLocaleDateString('id-ID')}`;
  
  const projectsList = (billing.projects || []).map((p: any) => p.name || p.project?.name || p.projectCode).join(', ');
  const details = billing.details || billing.roleBreakdown || [];

  const summaryData = [
    ["Billing Number:", billing.billingNumber || "DRAFT/PREVIEW"],
    ["PROJECTS:", projectsList],
    ["PERIOD:", formattedPeriod],
    ["REMARKS:", billing.remarks || "-"],
    [],
    ["PROJECT NAME", "ROLE", "MEMBER NAMES", "MANDAYS", "RATE/MANDAY", "AMOUNT"],
    ...details.map((row: any) => [
      row.projectName || row.project?.name || row.project?.project?.name || "N/A",
      row.roleName || row.role?.name || "N/A",
      row.memberNames || "-",
      Number(row.mandays).toFixed(2),
      row.ratePerManday || row.rate || 0,
      row.subtotal || 0
    ]),
    [],
    ["", "", "", "", "SUBTOTAL", billing.totalAmount || 0],
    ["", "", "", "", "TAX (11%)", (billing.totalAmount || 0) * 0.11],
    ["", "", "", "", "GRAND TOTAL", (billing.totalAmount || 0) * 1.11]
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, "Billing Summary");

  XLSX.writeFile(wb, `Billing_${billing.billingNumber || 'Preview'}.xlsx`);
}

export function exportInvoiceToExcel() {
  exportBillingToExcel({
    billingNumber: "INV-202603-001",
    billingPeriodStart: "2026-01-01",
    billingPeriodEnd: "2026-03-31",
    totalAmount: 206600000,
    remarks: "Mock billing data",
    projects: [{ name: "Pencatatan Tugas Tambahan Moana Notification" }],
    details: [
      { projectName: "Pencatatan Tugas Tambahan Moana Notification", roleName: "PM", memberNames: "Alvin", mandays: 10.00, ratePerManday: 2500000, subtotal: 25000000 },
      { projectName: "Pencatatan Tugas Tambahan Moana Notification", roleName: "BE", memberNames: "Fahrul", mandays: 67.00, ratePerManday: 2100000, subtotal: 140700000 },
      { projectName: "Pencatatan Tugas Tambahan Moana Notification", roleName: "FE", memberNames: "Akmal", mandays: 1.00, ratePerManday: 2000000, subtotal: 2000000 },
      { projectName: "Pencatatan Tugas Tambahan Moana Notification", roleName: "BA", memberNames: "Niko", mandays: 15.00, ratePerManday: 1800000, subtotal: 27000000 },
      { projectName: "Pencatatan Tugas Tambahan Moana Notification", roleName: "DESIGNER", memberNames: "Rijal", mandays: 7.00, ratePerManday: 1700000, subtotal: 11900000 }
    ]
  });
}
