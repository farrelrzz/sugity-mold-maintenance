import 'dotenv/config'
import { PrismaClient, Factory } from '@prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import * as fs from 'fs'
import * as path from 'path'

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
  console.log('📖 Loading extracted molds from molds.json...')
  const jsonPath = 'C:/Users/Farrel/.gemini/antigravity-ide/brain/2feb9a80-9faa-4654-9f9f-992b9f8eb947/scratch/molds.json'
  const rawData = fs.readFileSync(jsonPath, 'utf8')
  const molds = JSON.parse(rawData)
  
  console.log(`Loaded ${molds.length} molds. Importing into Database...`)

  // Chunk array to avoid database placeholder limit issues
  const chunkSize = 100
  let inserted = 0

  for (let i = 0; i < molds.length; i += chunkSize) {
    const chunk = molds.slice(i, i + chunkSize)
    const dataToInsert = chunk.map((m: any) => ({
      noMold: m.noMold,
      mc: m.mc || null,
      factory: m.factory as Factory,
      part: m.part || '-',
      tonase: m.tonase || null,
      customer: m.customer || null,
      model: m.model || null,
      coreStd: m.coreStd || null,
      cavStd: m.cavStd || null,
      heaterStd: [],
    }))

    // Use createMany skipDuplicates to be fast and safe
    const result = await prisma.moldBook.createMany({
      data: dataToInsert,
      skipDuplicates: true,
    })
    inserted += result.count
  }

  console.log(`🎉 Success! Added ${inserted} new molds to MoldBook table.`)
}

main()
  .catch((e) => {
    console.error('Error during import:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
