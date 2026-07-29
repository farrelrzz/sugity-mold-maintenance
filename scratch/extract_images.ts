import ExcelJS from 'exceljs'
import * as fs from 'fs'
import * as path from 'path'

async function main() {
  const file = 'd:/University/Intern PT Sugity Creatives/sugity-mold-maintenance/sampah/NEW MOLD BOOK UPDATE JAN 2023.xlsx'
  const outDir = 'd:/University/Intern PT Sugity Creatives/sugity-mold-maintenance/public/checksheet'
  
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true })
  }

  const wb = new ExcelJS.Workbook()
  await wb.xlsx.readFile(file)
  
  const media = (wb as any).model?.media || []
  console.log('Total media:', media.length)
  
  media.forEach((m: any, i: number) => {
    const ext = m.extension || 'png'
    const outPath = path.join(outDir, `excel_image_${i}.${ext}`)
    if (m.buffer) {
      fs.writeFileSync(outPath, m.buffer)
      console.log(`Saved: ${outPath} (${m.buffer.length} bytes)`)
    }
  })

  // Also check per-worksheet images
  for (const sheet of wb.worksheets) {
    const images = (sheet as any)._images || []
    if (images.length > 0) {
      console.log(`\nSheet "${sheet.name}" images:`)
      images.forEach((img: any, i: number) => {
        const range = img.range
        console.log(`  Image ${i}: tl col=${range?.tl?.nativeCol} row=${range?.tl?.nativeRow}`)
      })
    }
  }
}

main().catch(console.error)
