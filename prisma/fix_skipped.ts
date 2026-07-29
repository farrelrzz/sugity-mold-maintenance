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

// Only fix these 3 skipped entries
const TARGETS = ['301', '316', '334']

async function main() {
  const jsonPath = 'C:/Users/Farrel/.gemini/antigravity-ide/brain/2feb9a80-9faa-4654-9f9f-992b9f8eb947/scratch/molds_final.json'
  console.log('📖 Loading molds_final.json...')
  const rawData = fs.readFileSync(jsonPath, 'utf8')
  const allMolds = JSON.parse(rawData)
  
  const molds = allMolds.filter((m: any) => TARGETS.includes(m.noMold))
  console.log(`Processing ${molds.length} skipped entries...`)

  let fixed = 0
  for (const m of molds) {
    const data = {
      mc: m.mc || null,
      factory: m.factory as Factory,
      part: (m.part || '-').substring(0, 100),
      tonase: (m.tonase || null),
      customer: m.customer ? m.customer.substring(0, 100) : null,   // truncate
      model: m.model ? m.model.substring(0, 100) : null,             // truncate
      coreStd: m.coreStd || null,
      cavStd: m.cavStd || null,
      heaterStd: [] as any[],
    }

    try {
      const existing = await prisma.moldBook.findUnique({ where: { noMold: m.noMold } })
      if (existing) {
        await prisma.moldBook.update({ where: { noMold: m.noMold }, data })
        console.log(`  🔄 Updated: ${m.noMold}`)
      } else {
        await prisma.moldBook.create({ data: { noMold: m.noMold, ...data } })
        console.log(`  ✅ Inserted: ${m.noMold}`)
      }
      fixed++
    } catch (err: any) {
      console.error(`  ❌ Still error for ${m.noMold}: ${err.message}`)
    }
  }

  const total = await prisma.moldBook.count()
  console.log(`\n🎉 Fixed ${fixed} entries. Total in DB: ${total}`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
