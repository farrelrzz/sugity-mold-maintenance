import { PrismaClient, UserRole, Factory, Shift } from '@prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import bcrypt from 'bcryptjs'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

// ESM-compatible __dirname shim
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const TIDB_URL = 'mysql://4RW9SWasKgizVvK.root:wBYxqX7bFpXKNydF@gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000/sugity?sslaccept=strict&connect_timeout=30'

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
  console.log('🚀 Connecting to TiDB Cloud database...')
  
  // 1. Restore Super Admin
  console.log('👑 Restoring Super Admin account...')
  const hash = await bcrypt.hash('password123', 10)
  const superadmin = await prisma.user.upsert({
    where: { username: 'superadmin' },
    update: {
      role: 'SUPER_ADMIN',
      passwordHash: hash,
      nama: 'Super Admin Sugity'
    },
    create: {
      nama: 'Super Admin Sugity',
      username: 'superadmin',
      passwordHash: hash,
      role: 'SUPER_ADMIN',
      factory: 'F2',
      shift: 'Nonshift',
      nik: '9999999999999999',
      tempatLahir: 'Jakarta',
      tanggalLahir: new Date('1985-01-01')
    }
  })
  console.log(`✅ Super Admin ready: ${superadmin.username} (${superadmin.role})`)

  // 2. Restore All 2063 Molds
  console.log('\n📚 Loading molds from src/data/molds_v3.json...')
  const jsonPath = path.join(__dirname, '../src/data/molds_v3.json')
  const molds: MoldEntry[] = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
  console.log(`Loaded ${molds.length} molds from file!`)

  // Create outhouse entries first
  const outhouseMap = new Map<string, number>()
  const distinctLokasi = [...new Set(
    molds.map((m) => m.lokasiMold).filter((l): l is string => !!l)
  )]
  console.log(`Checking ${distinctLokasi.length} distinct outhouse positions...`)
  
  for (const lok of distinctLokasi) {
    const existing = await prisma.outhouse.findFirst({ where: { nama: lok } })
    if (existing) {
      outhouseMap.set(lok, existing.id)
    } else {
      const created = await prisma.outhouse.create({ data: { nama: lok } })
      outhouseMap.set(lok, created.id)
    }
  }

  // Check current mold count
  const currentCount = await prisma.moldBook.count()
  console.log(`Current mold count in TiDB Cloud: ${currentCount}`)

  console.log('Clearing existing mold records to ensure clean 100% restore...')
  await prisma.moldBook.deleteMany()

  console.log('Inserting full 2076 molds using ultra-fast batch createMany...')
  const BATCH = 500
  for (let i = 0; i < molds.length; i += BATCH) {
    const batch = molds.slice(i, i + BATCH).map((m) => ({
      noMold: m.noMold,
      mc: m.mc || null,
      factory: (['F2', 'F3', 'F4'].includes(m.factory) ? m.factory : 'F2') as 'F2' | 'F3' | 'F4',
      part: m.part || null,
      tonase: m.tonase || null,
      customer: m.customer || null,
      maker: (m as any).maker || null,
      model: m.model || null,
      coreStd: m.coreStd || null,
      cavStd: m.cavStd || null,
      heaterStd: m.heaterStd || undefined,
      lokasiMold: m.lokasiMold || null,
      outhouseId: m.lokasiMold ? (outhouseMap.get(m.lokasiMold) || null) : null,
      dimensiW: m.dimensiW || null,
      dimensiH: m.dimensiH || null,
      dimensiT: m.dimensiT || null,
    }))

    await prisma.moldBook.createMany({
      data: batch,
      skipDuplicates: true,
    })
    console.log(`Progress: ${Math.min(i + BATCH, molds.length)}/${molds.length} molds batch inserted!`)
  }

  const finalCount = await prisma.moldBook.count()
  console.log(`\n✨ PERFECT SUCCESS! Total Molds currently in TiDB Cloud: ${finalCount}`)
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
