const XLSX = require('xlsx');
const path = require('path');

const EXCEL_PATH = path.join(__dirname, '../sampah/NOW JANUARI, DAILY KONTROL MOLD MAINTENANCE 2026.xlsx');

try {
  const wb = XLSX.readFile(EXCEL_PATH);
  console.log("Sheets:", wb.SheetNames);
  const sheetName = wb.SheetNames[0]; // Or we can look for specific one
  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  
  console.log(`\nSample rows from sheet '${sheetName}':`);
  for(let i=0; i<Math.min(10, rows.length); i++) {
    console.log(`Row ${i}:`, rows[i].slice(0, 15)); // print first 15 columns
  }
} catch (e) {
  console.error("Error reading excel:", e.message);
}
