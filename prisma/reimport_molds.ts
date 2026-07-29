import 'dotenv/config'
import { PrismaClient, Factory } from '@prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import * as fs from 'fs'

function createPrisma() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not set')
  const parsed = new URL(url)
  const adapter = new PrismaMariaDb({
    host: parsed.hostname || 'localhost',
    user: decodeURIComponent(parsed.username || 'root'),
    password: decodeURIComponent(parsed.password || ''),
    database: parsed.pathname ? decodeURIComponent(parsed.pathname.substring(1)) : '',
    port: parsed.port ? parseInt(parsed.port, 10) : 3306,
    connectionLimit: 5,
  })
  return new PrismaClient({ adapter })
}

const prisma = createPrisma()

async function main() {
  const jsonPath = 'C:/Users/Farrel/.gemini/antigravity-ide/brain/2feb9a80-9faa-4654-9f9f-992b9f8eb947/scratch/molds_final.json'
  console.log('📖 Loading molds_final.json...')
  const rawData = fs.readFileSync(jsonPath, 'utf8')
  const molds = JSON.parse(rawData)
  console.log(`Loaded ${molds.length} molds.`)

  // Step 1: Delete all existing molds that are NOT referenced by any laporan
  // We need to be careful not to break foreign key constraints
  // First, get all noMold values referenced in laporan table
  const usedMolds = await prisma.laporan.findMany({
    select: { noMold: true },
    distinct: ['noMold'],
  })
  const usedMoldNos = new Set(usedMolds.map((l: any) => l.noMold))
  console.log(`\n⚠️  Found ${usedMoldNos.size} mold numbers referenced in Laporan table (will be kept/updated, not deleted).`)

  // Delete all MoldBook entries NOT referenced in laporan
  const deleteResult = await prisma.moldBook.deleteMany({
    where: {
      noMold: {
        notIn: Array.from(usedMoldNos) as string[],
      },
    },
  })
  console.log(`🗑️  Deleted ${deleteResult.count} unreferenced old mold records.`)

  // Step 2: Insert/Upsert all molds from JSON in chunks
  const chunkSize = 100
  let inserted = 0
  let updated = 0
  let skipped = 0

  for (let i = 0; i < molds.length; i += chunkSize) {
    const chunk = molds.slice(i, i + chunkSize)

    for (const m of chunk) {
      const data = {
        mc: m.mc || null,
        factory: m.factory as Factory,
        part: (m.part || '-').substring(0, 100),
        tonase: m.tonase || null,
        customer: m.customer || null,
        model: m.model || null,
        coreStd: m.coreStd || null,
        cavStd: m.cavStd || null,
        heaterStd: [] as any[],
      }

      try {
        const existing = await prisma.moldBook.findUnique({ where: { noMold: m.noMold } })
        if (existing) {
          // Update (keep fotoMold, fotoProduk, heaterStd if already set)
          await prisma.moldBook.update({
            where: { noMold: m.noMold },
            data: {
              mc: data.mc,
              factory: data.factory,
              part: data.part,
              tonase: data.tonase,
              customer: data.customer,
              model: data.model,
              coreStd: data.coreStd,
              cavStd: data.cavStd,
            },
          })
          updated++
        } else {
          await prisma.moldBook.create({
            data: { noMold: m.noMold, ...data },
          })
          inserted++
        }
      } catch (err: any) {
        console.error(`  ❌ Error for noMold=${m.noMold}: ${err.message}`)
        skipped++
      }
    }

    console.log(`  Progress: ${Math.min(i + chunkSize, molds.length)}/${molds.length}`)
  }
  -
    console.log(`\n🎉 Done!`)
  console.log(`   ✅ Inserted: ${inserted}`)
  console.log(`   🔄 Updated:  ${updated}`)
  console.log(`   ❌ Skipped:  ${skipped}`)

  const total = await prisma.moldBook.count()
  console.log(`   📊 Total in DB: ${total}`)
}

main()
  .catch((e) => {
    console.error('Fatal error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
