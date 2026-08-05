import { PrismaClient } from '@prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// URL Resmi Akun Baru TiDB Cloud (4RW9SWasKgizVvK) dengan Database /sugity
const NEW_TIDB_URL = process.env.NEW_DATABASE_URL || 'mysql://4RW9SWasKgizVvK.root:wBYxqX7bFpXKNydF@gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000/sugity?sslaccept=strict&connect_timeout=30'

function createPrisma(url: string) {
  const parsed = new URL(url)
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

const prisma = createPrisma(NEW_TIDB_URL)

async function importAllData() {
  console.log('🔄 Memulai Impor Data ke Akun TiDB Cloud Baru (4RW9SWasKgizVvK)...')


  console.log('🏗️ Langkah 1: Meringkas dan menyusun skema tabel database otomatis (Prisma DB Push) di cloud baru...')
  try {
    execSync('npx -y prisma db push --accept-data-loss', {
      env: { ...process.env, DATABASE_URL: NEW_TIDB_URL },
      stdio: 'inherit'
    })
    console.log('✅ Skema tabel berhasil dibuat sempurna di server TiDB Cloud yang baru!\n')
  } catch (err) {
    console.error('❌ Gagal membuat skema tabel di server baru. Pastikan Password dan URL sudah tepat!', err)
    process.exit(1)
  }

  const backupDir = path.join(__dirname, '../backup')
  if (!fs.existsSync(backupDir)) {
    console.error('❌ Tidak ditemukan folder backup/ ! Harap jalankan script export_full_database.ts terlebih dahulu.')
    process.exit(1)
  }

  // Cari file backup JSON terbaru
  const files = fs.readdirSync(backupDir).filter(f => f.startsWith('tidb_backup_full_') && f.endsWith('.json'))
  if (files.length === 0) {
    console.error('❌ Tidak ada file backup JSON di dalam folder backup/ !')
    process.exit(1)
  }

  files.sort().reverse()
  const latestBackupFile = path.join(backupDir, files[0])
  console.log(`📥 Membaca data dari snapshot: ${files[0]}...`)

  const raw = fs.readFileSync(latestBackupFile, 'utf-8')
  const { data } = JSON.parse(raw)

  console.log('⚡ Menyuntikkan tabel ke server TiDB baru (harap tunggu)...')

  // Catatan: Impor dilakukan berurutan sesuai relasi foreign key
  if (data.users?.length) {
    console.log(`👤 Menyimpan ${data.users.length} Users...`)
    await prisma.user.createMany({ data: data.users, skipDuplicates: true })
  }

  if (data.outhouses?.length) {
    console.log(`🏢 Menyimpan ${data.outhouses.length} Outhouse...`)
    await prisma.outhouse.createMany({ data: data.outhouses, skipDuplicates: true })
  }

  if (data.moldBooks?.length) {
    console.log(`📚 Menyimpan ${data.moldBooks.length} Mold Books (2000+ Molds)...`)
    // Chunking 500 records per batch agar tidak timeout di cloud
    const chunkSize = 500
    for (let i = 0; i < data.moldBooks.length; i += chunkSize) {
      const chunk = data.moldBooks.slice(i, i + chunkSize)
      await prisma.moldBook.createMany({ data: chunk, skipDuplicates: true })
    }
  }

  if (data.jadwalMingguan?.length) {
    console.log(`📅 Menyimpan ${data.jadwalMingguan.length} Jadwal...`)
    await prisma.jadwalMingguan.createMany({ data: data.jadwalMingguan, skipDuplicates: true })
  }

  if (data.laporans?.length) {
    console.log(`📝 Menyimpan ${data.laporans.length} Laporan...`)
    await prisma.laporan.createMany({ data: data.laporans, skipDuplicates: true })
  }

  if (data.checksheets?.length) {
    console.log(`🔧 Menyimpan ${data.checksheets.length} Checksheets...`)
    await prisma.checksheet.createMany({ data: data.checksheets, skipDuplicates: true })
  }

  if (data.checksheetSpareparts?.length) {
    await prisma.checksheetSparepart.createMany({ data: data.checksheetSpareparts, skipDuplicates: true })
  }
  if (data.checksheetFotos?.length) {
    await prisma.checksheetFoto.createMany({ data: data.checksheetFotos, skipDuplicates: true })
  }
  if (data.checksheetApprovals?.length) {
    await prisma.checksheetApproval.createMany({ data: data.checksheetApprovals, skipDuplicates: true })
  }

  console.log('🎉 MIGRASI KE AKUN TIDB BARU TELAH SUKSES DAN BERHASIL 100%!')
}

importAllData()
  .catch((err) => {
    console.error('❌ Gagal melakukan import database:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
