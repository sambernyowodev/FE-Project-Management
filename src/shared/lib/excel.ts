import * as XLSX from 'xlsx';

export function exportInvoiceToExcel() {
  const wb = XLSX.utils.book_new();

  const summaryData = [
    ["Invoice Number:", "INV-202603-001"],
    ["BILLED TO:", "HCM (Mba Isti)"],
    ["PROJECT:", "Pencatatan Tugas Tambahan Moana Notification"],
    ["PO:", "PO-HCM-2026-002"],
    ["PERIOD:", "01/01/2026 - 31/03/2026"],
    [],
    ["DESCRIPTION", "MANDAYS", "RATE/MANDAY", "AMOUNT"],
    ["PM - Alvin", 10.00, 2500000, 25000000],
    ["BE - Fahrul", 67.00, 2100000, 140700000],
    ["FE - Akmal", 1.00, 2000000, 2000000],
    ["BA - Niko", 15.00, 1800000, 27000000],
    ["DESIGNER - Rijal", 7.00, 1700000, 11900000],
    [],
    ["", "", "SUBTOTAL", 206600000],
    ["", "", "TAX (11%)", 22726000],
    ["", "", "GRAND TOTAL", 229326000]
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, "Invoice Summary");

  const breakdownData = [
    ["No", "Role", "Member Name", "Mandays", "Rate/Manday", "Subtotal"],
    [1, "PM", "Alvin", 10, 2500000, 25000000],
    [2, "BE", "Fahrul", 67, 2100000, 140700000],
    [3, "FE", "Akmal", 1, 2000000, 2000000],
    [4, "BA", "Niko", 15, 1800000, 27000000],
    [5, "DESIGNER", "Rijal", 7, 1700000, 11900000]
  ];
  
  const wsBreakdown = XLSX.utils.aoa_to_sheet(breakdownData);
  XLSX.utils.book_append_sheet(wb, wsBreakdown, "Breakdown Detail");

  XLSX.writeFile(wb, "Invoice_INV-202603-001.xlsx");
}
