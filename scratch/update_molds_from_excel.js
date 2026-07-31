/**
 * Script: update_molds_from_excel.js
 * Reads NEW MOLD BOOK UPDATE JAN 2023.xlsx (ALL sheet) and patches molds_v3.json
 * with correct values for: part (PART NAME), customer (CUSTOMER), tonase (M/C TOONAGE), maker (MAKER)
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const EXCEL_PATH = path.join(__dirname, '../sampah/NEW MOLD BOOK UPDATE JAN 2023.xlsx');
const JSON_PATH  = path.join(__dirname, '../src/data/molds_v3.json');
const OUT_PATH   = path.join(__dirname, '../src/data/molds_v3.json'); // overwrite in-place

// ---------- 1. Read Excel ------------------------------------------------
console.log('📖 Reading Excel...');
const wb = XLSX.readFile(EXCEL_PATH);
const ws = wb.Sheets['ALL'];
const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

// ---------- 2. Build a lookup map: noMold -> { part, customer, tonase, maker }
// Header row is row index 1:
// [0]=NO MOLD [1]=PIC1 [2]=PIC2 [3]=PIC3 [4]=M/C TOONAGE [5]=M/C NO [6]=SEMBANGO [7]=CUSTOMER
// [8..11]=PROJECT sub-cols [12]=PART NO [13]=PART NAME [14]=MAKER
const COL = {
  noMold:   0,
  tonase:   4,
  customer: 7,
  partName: 13,
  maker:    14,
};

function cleanStr(v) {
  if (v === null || v === undefined || v === '') return '-';
  // collapse multi-whitespace / line breaks to single space, trim
  return String(v).replace(/\s+/g, ' ').trim() || '-';
}

const excelMap = new Map(); // noMold (zero-padded string) -> data
let dataRowCount = 0;

for (let i = 4; i < rows.length; i++) {
  const row = rows[i];
  const rawNo = String(row[COL.noMold]).trim();
  if (!rawNo || rawNo === '' || rawNo === '0') continue;

  // noMold in JSON is zero-padded 3 digits (e.g. "001", "010", "123")
  // Excel also uses same format e.g. "001", but let's normalize
  const noMold = rawNo.padStart(3, '0');

  const part     = cleanStr(row[COL.partName]);
  const customer = cleanStr(row[COL.customer]);
  const tonase   = cleanStr(row[COL.tonase]);
  const maker    = cleanStr(row[COL.maker]);

  excelMap.set(noMold, { part, customer, tonase, maker });
  dataRowCount++;
}

console.log(`✅ Extracted ${dataRowCount} mold entries from Excel (${excelMap.size} unique noMold keys).`);

// ---------- 3. Load existing JSON ----------------------------------------
console.log('📖 Reading molds_v3.json...');
const molds = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));
console.log(`   Loaded ${molds.length} molds from JSON.`);

// ---------- 4. Apply patches ---------------------------------------------
let patchedCount = 0;
let notFoundCount = 0;
const notFoundList = [];

for (const mold of molds) {
  const noMold = String(mold.noMold || '').trim().padStart(3, '0');
  const xlData = excelMap.get(noMold);

  if (!xlData) {
    notFoundCount++;
    notFoundList.push(mold.noMold);
    continue;
  }

  mold.part     = xlData.part;
  mold.customer = xlData.customer;
  mold.tonase   = xlData.tonase;
  mold.maker    = xlData.maker;
  patchedCount++;
}

console.log(`\n📊 Patch summary:`);
console.log(`   ✅ Patched:   ${patchedCount} molds`);
console.log(`   ⚠️  Not found in Excel: ${notFoundCount} molds`);
if (notFoundList.length > 0 && notFoundList.length <= 50) {
  console.log(`   Not-found list: ${notFoundList.join(', ')}`);
}

// ---------- 5. Write output ----------------------------------------------
fs.writeFileSync(OUT_PATH, JSON.stringify(molds, null, 2), 'utf-8');
console.log(`\n💾 Saved updated molds_v3.json (${molds.length} molds) to:\n   ${OUT_PATH}`);
console.log('\n🎉 Done! Now run your restore/seed script to push to the database.');
