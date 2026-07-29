/**
 * import_molds_v3.ts — Import corrected mold data from molds_v3.json
 * 
 * Changes vs previous import:
 * - Adds lokasiMold, dimensiW/H/T fields
 * - Auto-creates Outhouse records from distinct MOLD POSITION values
 * - Clears existing mold_book data first
 * 
 * Run: npx ts-node --project tsconfig.json prisma/import_molds_v3.ts
 */

import { prisma } from '../src/lib/prisma'
import * as fs from 'fs'
import * as path from 'path'

interface MoldEntry {
  noMold: string
  mc: string | null
  factory: string
  part: string | null
  tonase: string | null
  customer: string | null
  model: string | null
  coreStd: string | null
  cavStd: string | null
  heaterStd?: number[] | null
  lokasiMold: string | null
  dimensiW: string | null
  dimensiH: string | null
  dimensiT: string | null
}

async function main() {
  const jsonPath = path.join(
    'C:/Users/Farrel/.gemini/antigravity-ide/brain/2feb9a80-9faa-4654-9f9f-992b9f8eb947/scratch/molds_v3.json'
  )
  const molds: MoldEntry[] = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
  console.log(`Loaded ${molds.length} molds from JSON`)

  // Step 1: Collect distinct non-null lokasiMold values → create Outhouse records
  console.log('\nStep 1: Creating outhouse records...')
  const outhouseMap = new Map<string, number>() // lokasi → outhouse ID

  const distinctLokasi = [...new Set(
    molds.map((m) => m.lokasiMold).filter((l): l is string => !!l)
  )]
  console.log(`  Distinct MOLD POSITION values: ${distinctLokasi.length}`)

  for (const lok of distinctLokasi) {
    // Upsert outhouse by nama
    const existing = await prisma.outhouse.findFirst({ where: { nama: lok } })
    if (existing) {
      outhouseMap.set(lok, existing.id)
    } else {
      const created = await prisma.outhouse.create({
        data: { nama: lok },
      })
      outhouseMap.set(lok, created.id)
      process.stdout.write('.')
    }
  }
  console.log(`\n  Created/found ${outhouseMap.size} outhouse entries`)

  // Step 2: Clear existing mold_book
  console.log('\nStep 2: Clearing existing mold_book...')
  const deleted = await prisma.moldBook.deleteMany()
  console.log(`  Deleted ${deleted.count} existing mold records`)

  // Step 3: Batch insert new molds
  console.log('\nStep 3: Inserting molds...')
  const BATCH = 200
  let inserted = 0
  let errors = 0

  for (let i = 0; i < molds.length; i += BATCH) {
    const batch = molds.slice(i, i + BATCH)

    await Promise.allSettled(
      batch.map(async (m) => {
        const factory = (['F2', 'F3', 'F4'].includes(m.factory) ? m.factory : 'F2') as
          | 'F2'
          | 'F3'
          | 'F4'

        const outhouseId = m.lokasiMold ? (outhouseMap.get(m.lokasiMold) || null) : null

        try {
          await prisma.moldBook.create({
            data: {
              noMold: m.noMold,
              mc: m.mc || null,
              factory,
              part: m.part || null,
              tonase: m.tonase || null,
              customer: m.customer || null,
              model: m.model || null,
              coreStd: m.coreStd || null,
              cavStd: m.cavStd || null,
              heaterStd: m.heaterStd || undefined,
              lokasiMold: m.lokasiMold || null,
              outhouseId: outhouseId,
              dimensiW: m.dimensiW || null,
              dimensiH: m.dimensiH || null,
              dimensiT: m.dimensiT || null,
            },
          })
          inserted++
        } catch (err: any) {
          errors++
          if (errors <= 5) console.error(`  Error ${m.noMold}: ${err.message}`)
        }
      })
    )

    if (i % 1000 === 0) {
      console.log(`  Progress: ${Math.min(i + BATCH, molds.length)}/${molds.length}`)
    }
  }

  console.log(`\n✅ Done! Inserted: ${inserted}, Errors: ${errors}`)

  // Step 4: Verify
  const count = await prisma.moldBook.count()
  const outhouseCount = await prisma.outhouse.count()
  console.log(`\nDB count — MoldBook: ${count}, Outhouse: ${outhouseCount}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
