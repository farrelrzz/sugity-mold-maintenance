import { PrismaClient } from '@prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const TIDB_URL = 'mysql://2UVNBvRtUAd5zyR.root:vFEouGzVawSvJ0hP@gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000/sugity?sslaccept=strict&connect_timeout=30'

function createPrisma() {
  const parsed = new URL(TIDB_URL)
  const adapter = new PrismaMariaDb({
    host: parsed.hostname,
    port: parsed.port ? parseInt(parsed.port, 10) : 4000,
    user: decodeURIComponent(parsed.username || 'root'),
    password: decodeURIComponent(parsed.password || ''),
    database: parsed.pathname ? decodeURIComponent(parsed.pathname.substring(1)) : 'sugity',
    connectionLimit: 10,
    connectTimeout: 30000,
    ssl: { rejectUnauthorized: false },
  } as any)
  return new PrismaClient({ adapter })
}

const prisma = createPrisma()

interface MoldUpdateData {
  noMold: string;
  part: string;
  model?: string;
  customer?: string;
  tonase?: string;
  coreStd?: string | null;
  cavStd?: string | null;
  heaterStd?: (number | string)[];
}

const batch2Data: MoldUpdateData[] = [
  {
    noMold: "T46",
    part: "GRILLE RADIATOR LOWER",
    model: "665B",
    customer: "TMMIN",
    tonase: "650T",
    coreStd: "5.6",
    cavStd: "6.1",
    heaterStd: []
  },
  {
    noMold: "T56",
    part: "GRILLE RADIATOR D-BRAND",
    model: "D26A",
    customer: "ADM",
    tonase: "650T",
    coreStd: "13.7",
    cavStd: "15.1",
    heaterStd: [97.3, 21.1, 21.4, 81.4, 203, 81.8, 137]
  },
  {
    noMold: "T58",
    part: "BOARD FR DOOR TRIM UPPER RH/LH ( STD )",
    model: "D26A",
    customer: "ADM",
    tonase: "650T",
    coreStd: "13.2",
    cavStd: "18.9",
    heaterStd: []
  },
  {
    noMold: "T59",
    part: "BOARD FR DOOR TRIM UPPER RH/LH ( AERO )",
    model: "D26A",
    customer: "ADM",
    tonase: "650T",
    coreStd: "10.6",
    cavStd: "18.6",
    heaterStd: []
  },
  {
    noMold: "W10",
    part: "COVER FR BUMPER T-BRAND",
    model: "D79L",
    customer: "ADM",
    tonase: "3500T",
    coreStd: null,
    cavStd: null,
    heaterStd: [26.3, 26.3, 27.1, 26.9, 29.1, 39.3, 31.4, 26.2, 26, 26, 156, 116, 155, 73.2, 154, 73.5, 156, 74.6, 149, 95.4, 163, 94.7]
  },
  {
    noMold: "W11",
    part: "COVER FR BUMPER D-BRAND",
    model: "D79L",
    customer: "ADM",
    tonase: "3500T",
    coreStd: "25.8",
    cavStd: "26.1",
    heaterStd: []
  },
  {
    noMold: "W13",
    part: "COVER FR BUMPER ( PAINT )",
    model: "D40L",
    customer: "ADM",
    tonase: "3500T",
    coreStd: "31.8",
    cavStd: "34.2",
    heaterStd: [21.7, 20.9, 20.8, 19.6, 20.9, 21.4, 21.9, 21.7, 21.9, 22.1, 84.3, 64.3, 86.6, 76.4, 86.1, 74.6, 84.8, 84.3, 85, 75.1, 86.1, 65.1, 54.8]
  },
  {
    noMold: "W14",
    part: "COVER FR BUMPER ( SHIBO )",
    model: "D40L",
    customer: "ADM",
    tonase: "3500T",
    coreStd: "41.9",
    cavStd: "43.4",
    heaterStd: [21.1, 20.9, 20.4, 19.7, 20.8, 21.6, 22.6, 21.8, 21.6, 21.6, 67.4, 78.3, 72.6, 90.2, 71.4, 91.6, 68.3, 94.1, 71.3, 92.1, 66.4, 93.1, 54.4]
  },
  {
    noMold: "W24",
    part: "COVER RR BUMPER LOWER",
    model: "655B HI+",
    customer: "TMMIN",
    tonase: "3500T",
    coreStd: "26.7",
    cavStd: "24.2",
    heaterStd: [26, 26.3, 26, 26.1, 26, 26, 31.4, 26, 26, 26, 158, 117, 155, 116, 156, 73.6, 154, 73.7, 149, 73.9, 156, 79, 156, 73.9]
  },
  {
    noMold: "W28",
    part: "COVER FR BUMPER T-BRAND",
    model: "D26A",
    customer: "ADM",
    tonase: "3500T",
    coreStd: "29.2",
    cavStd: "30.1",
    heaterStd: [87.1, 20.3, 20, 19.8, 19.9, 21.4, 21.9, 20.3, 23.5, 23.4, 83.4, 100, 79.5, 87.1, 80.2, 86.1, 41, 53.3, 94]
  }
]

async function main() {
  console.log('🔄 Starting Batch 2 Sync for Mold Standards...')

  // 1. Update molds_v3.json
  const jsonPath = path.join(__dirname, '../src/data/molds_v3.json')
  const molds: any[] = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))

  const normalize = (s: string) => s.replace(/\s+/g, '').toUpperCase()

  const updateMap = new Map<string, MoldUpdateData>()
  for (const item of batch2Data) {
    updateMap.set(normalize(item.noMold), item)
  }

  let updatedInJson = 0
  for (let i = 0; i < molds.length; i++) {
    const m = molds[i]
    if (m.noMold && updateMap.has(normalize(m.noMold))) {
      const u = updateMap.get(normalize(m.noMold))!
      m.part = u.part || m.part
      if (u.model) m.model = u.model
      if (u.customer) m.customer = u.customer
      if (u.tonase) m.tonase = u.tonase
      if (u.coreStd !== undefined) m.coreStd = u.coreStd
      if (u.cavStd !== undefined) m.cavStd = u.cavStd
      if (u.heaterStd !== undefined) m.heaterStd = u.heaterStd
      updatedInJson++
    }
  }

  fs.writeFileSync(jsonPath, JSON.stringify(molds, null, 2), 'utf-8')
  console.log(`✅ Successfully updated ${updatedInJson} molds in src/data/molds_v3.json!`)

  // 2. Sync to live TiDB Cloud database via Prisma
  console.log('☁️ Syncing to TiDB Cloud database...')
  let updatedInDb = 0
  for (const item of batch2Data) {
    const dataToUpdate: any = {
      part: item.part,
    }
    if (item.model) dataToUpdate.model = item.model
    if (item.customer) dataToUpdate.customer = item.customer
    if (item.tonase) dataToUpdate.tonase = item.tonase
    if (item.coreStd !== undefined) dataToUpdate.coreStd = item.coreStd
    if (item.cavStd !== undefined) dataToUpdate.cavStd = item.cavStd
    if (item.heaterStd !== undefined) dataToUpdate.heaterStd = item.heaterStd

    let result = await prisma.moldBook.updateMany({
      where: { noMold: item.noMold },
      data: dataToUpdate,
    })
    
    // Fallback check with spaces if needed
    if (result.count === 0) {
      const allMatches = await prisma.moldBook.findMany({
        where: { noMold: { startsWith: item.noMold[0] } }
      })
      for (const row of allMatches) {
        if (normalize(row.noMold) === normalize(item.noMold)) {
          await prisma.moldBook.update({
            where: { id: row.id },
            data: dataToUpdate
          })
          result.count++
        }
      }
    }

    if (result.count > 0) {
      updatedInDb++
    } else {
      console.warn(`⚠️ Mold ${item.noMold} not found in DB!`)
    }
  }
  console.log(`✅ Successfully synced ${updatedInDb}/${batch2Data.length} molds in live TiDB Cloud Database!`)
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
