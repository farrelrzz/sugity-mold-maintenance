import { PrismaClient } from '@prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// URL Database TiDB Cloud Lama (Sumber Data Export)
const OLD_TIDB_URL = process.env.DATABASE_URL || 'mysql://4RW9SWasKgizVvK.root:wBYxqX7bFpXKNydF@gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000/sugity?sslaccept=strict&connect_timeout=30'

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

const prisma = createPrisma(OLD_TIDB_URL)

async function exportAllData() {
  console.log('🔄 Memulai Ekspor Lengkap (Full Backup) dari TiDB Cloud...')

  const backupData = {
    exportDate: new Date().toISOString(),
    version: '1.0.0',
    data: {
      users: await prisma.user.findMany(),
      outhouses: await prisma.outhouse.findMany(),
      moldBooks: await prisma.moldBook.findMany(),
      jadwalMingguan: await prisma.jadwalMingguan.findMany(),
      laporans: await prisma.laporan.findMany(),
      checksheets: await prisma.checksheet.findMany(),
      checksheetSpareparts: await prisma.checksheetSparepart.findMany(),
      checksheetFotos: await prisma.checksheetFoto.findMany(),
      checksheetApprovals: await prisma.checksheetApproval.findMany(),
      checksheetRevisis: await prisma.checksheetRevisi.findMany(),
      notifikasis: await prisma.notifikasi.findMany(),
      overtimeEntries: await prisma.overtimeEntry.findMany(),
      planningTargets: await prisma.planningTarget.findMany(),
      safetyLogs: await prisma.safetyLog.findMany(),
      kehadirans: await prisma.kehadiran.findMany(),
      katalogSpareparts: await prisma.katalogSparepart.findMany(),
      reportOptions: await prisma.reportOption.findMany(),
      auditLogs: await prisma.auditLog.findMany(),
      systemSettings: await prisma.systemSetting.findMany(),
      safetyRecords: await prisma.safetyRecord.findMany(),
      safetyHistories: await prisma.safetyHistory.findMany(),
    }
  }

  const backupDir = path.join(__dirname, '../backup')
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true })
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const filename = `tidb_backup_full_${timestamp}.json`
  const filePath = path.join(backupDir, filename)

  fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2), 'utf-8')

  console.log('🎉 EKSPOR BERHASIL SECARA SEMPURNA!')
  console.log(`📁 File backup tersimpan di: ${filePath}`)
  console.log(`📊 Total Akun User di-export: ${backupData.data.users.length}`)
  console.log(`📊 Total Mold Book di-export: ${backupData.data.moldBooks.length}`)
  console.log(`📊 Total Laporan di-export: ${backupData.data.laporans.length}`)
  console.log(`📊 Total Checksheet di-export: ${backupData.data.checksheets.length}`)
}

exportAllData()
  .catch((err) => {
    console.error('❌ Gagal melakukan eksport database:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
