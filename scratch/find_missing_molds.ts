import 'dotenv/config'
import { prisma } from '../src/lib/prisma'
import * as XLSX from 'xlsx'
import * as path from 'path'

async function main() {
  const EXCEL_PATH = path.join(process.cwd(), 'sampah/NOW JANUARI, DAILY KONTROL MOLD MAINTENANCE 2026.xlsx')
  const wb = XLSX.readFile(EXCEL_PATH)
  
  // Existing molds in DB
  const existingMolds = await prisma.moldBook.findMany({ select: { noMold: true } })
  const existingNos = new Set(existingMolds.map(m => m.noMold))
  
  console.log(`Found ${existingNos.size} molds currently in Database.`)
  
  const newMolds = []
  
  // Sheets to check: F2A, F3A, F4A, F2B, F3B, F4B, etc.
  for (const sheetName of wb.SheetNames) {
    if (!sheetName.startsWith('F2') && !sheetName.startsWith('F3') && !sheetName.startsWith('F4')) {
      continue;
    }
    
    // Determine Factory from sheet name (e.g. F2A -> F2)
    const factory = sheetName.substring(0, 2)
    
    const ws = wb.Sheets[sheetName]
    const rows: any[] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
    
    // Find column indices from Row 0
    const headerRow = rows[0] || []
    const colModel = headerRow.findIndex((h: string) => typeof h === 'string' && h.trim().toUpperCase() === 'MODEL')
    const colName = headerRow.findIndex((h: string) => typeof h === 'string' && h.trim().toUpperCase().includes('MOULD NAME'))
    const colNo = headerRow.findIndex((h: string) => typeof h === 'string' && h.trim().toUpperCase().includes('MOULD NO'))
    
    if (colModel === -1 || colName === -1 || colNo === -1) {
      console.log(`Skipping sheet ${sheetName}, missing headers. Model:${colModel}, Name:${colName}, No:${colNo}`)
      continue
    }
    
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i]
      let noMold = String(row[colNo]).trim()
      let model = String(row[colModel]).trim()
      let partName = String(row[colName]).trim()
      
      if (!noMold || noMold === '' || noMold === '0' || noMold === '-') continue
      if (!model && !partName) continue
      
      // The old script zero-padded noMold to 3 digits. Let's see if we should do that, but some are like 'N16'.
      // If it's pure numbers, pad with 0s?
      if (/^\d+$/.test(noMold)) {
        noMold = noMold.padStart(3, '0')
      }
      
      if (!existingNos.has(noMold)) {
        // Prevent adding duplicate noMolds from different sheets
        if (!newMolds.find(m => m.noMold === noMold)) {
          newMolds.push({
            noMold,
            model,
            part: partName,
            factory: factory as 'F2' | 'F3' | 'F4',
            lokasiMold: sheetName // Maybe the sheet name is the location?
          })
        }
      }
    }
  }
  
  console.log(`\nFound ${newMolds.length} NEW molds to add!`)
  for (let i=0; i<Math.min(10, newMolds.length); i++) {
    console.log(newMolds[i])
  }
  
  // We can insert them into the DB
  if (newMolds.length > 0) {
    console.log(`\nInserting ${newMolds.length} new molds into the Database...`)
    
    // Also save to a JSON so we can update molds_v3.json later
    const fs = require('fs')
    fs.writeFileSync(path.join(process.cwd(), 'scratch/new_molds_to_add.json'), JSON.stringify(newMolds, null, 2))
    
    const result = await prisma.moldBook.createMany({
      data: newMolds,
      skipDuplicates: true
    })
    console.log(`✅ Successfully inserted ${result.count} molds into TiDB!`)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
