const XLSX = require('xlsx');
const wb = XLSX.readFile('./template/Resource Planning Talent OD 2026.xlsx');

// Dump all rows of Sheet 1
const name = wb.SheetNames[0];
const ws = wb.Sheets[name];
const json = XLSX.utils.sheet_to_json(ws, {header:1, defval:''});

console.log(`=== Sheet: ${name} (total rows: ${json.length}) ===`);
json.forEach((row, i) => {
  console.log(`Row ${i}:`, JSON.stringify(row));
});
