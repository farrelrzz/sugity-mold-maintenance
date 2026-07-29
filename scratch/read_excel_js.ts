import ExcelJS from 'exceljs'

async function main() {
  const file = 'd:/University/Intern PT Sugity Creatives/sugity-mold-maintenance/sampah/NEW MOLD BOOK UPDATE JAN 2023.xlsx'
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.readFile(file)
  
  for (const name of ['Sheet1', 'Sheet2', 'Sheet3', 'Sheet4', 'Sheet5']) {
    const sheet = wb.getWorksheet(name)
    if (!sheet) continue
    console.log(`\n--- ${name} ---`)
    for (let r = 1; r <= 30; r++) {
      const row = sheet.getRow(r)
      const vals = row.values as any[]
      if (vals) {
        const texts = vals.map(v => typeof v === 'object' && v !== null ? (v as any).richText?.map((t: any) => t.text).join('') || v : v)
        if (texts.join('').trim().length > 0) {
          console.log(`Row ${r}: ${JSON.stringify(texts.slice(0, 10))}`)
        }
      }
    }
  }
}

main().catch(console.error)
