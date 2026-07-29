import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import ExcelJS from 'exceljs'

function hitungCosts(lap: any) {
  let mpCost = 0
  let spCost = 0
  const isOh = lap.jenis === 'OH_MOLD' || lap.jenis === 'OH MOLD'
  const cs = lap.checksheet

  if (cs) {
    if (isOh) {
      const rawChecklist = cs.checklist || {}
      const items = rawChecklist.items || {}
      const costKeys = ['b1', 'b2', 'b3', 'b4', 'b5']
      costKeys.forEach((key) => {
        const cb = items[key] || {}
        const start = cb.jamMulai || ''
        const end = cb.jamSelesai || ''
        const people = Number(cb.orang) || 0
        if (start && end) {
          const [hStart, minStart] = start.split(':').map(Number)
          const [hEnd, minEnd] = end.split(':').map(Number)
          let diffMinutes = (hEnd * 60 + minEnd) - (hStart * 60 + minStart)
          if (diffMinutes < 0) diffMinutes += 24 * 60
          const hours = diffMinutes / 60
          mpCost += Math.round(hours * 89595 * people)
        }
      })
    } else {
      const start = cs.jamMulai || ''
      const end = cs.jamSelesai || ''
      const people = Number(cs.jumlahOrang || 1)
      if (start && end) {
        const [hStart, minStart] = start.split(':').map(Number)
        const [hEnd, minEnd] = end.split(':').map(Number)
        let diffMinutes = (hEnd * 60 + minEnd) - (hStart * 60 + minStart)
        if (diffMinutes < 0) diffMinutes += 24 * 60
        const hours = diffMinutes / 60
        mpCost += Math.round(hours * 89595 * people)
      } else {
        mpCost += Math.round(1 * 89595 * people)
      }
    }
    if (Array.isArray(cs.spareparts)) {
      cs.spareparts.forEach((sp: any) => {
        spCost += sp.qty * Number(sp.hargaSatuan || 0)
      })
    }
  } else {
    mpCost = Math.round(1 * 89595 * 1)
  }
  return { mpCost, spCost, totalCost: mpCost + spCost }
}

function styleHeader(sheet: ExcelJS.Worksheet) {
  const headerRow = sheet.getRow(1)
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  headerRow.height = 26
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' } // Gunmetal Navy Slate
    }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
    }
  })
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Akses Ditolak: Hanya Super Admin' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const allTime = searchParams.get('allTime') === 'true'
    const sYear = parseInt(searchParams.get('startYear') || String(new Date().getFullYear()), 10)
    const sMonth = parseInt(searchParams.get('startMonth') || '1', 10)
    const eYear = parseInt(searchParams.get('endYear') || String(new Date().getFullYear()), 10)
    const eMonth = parseInt(searchParams.get('endMonth') || '12', 10)

    const startDate = new Date(sYear, sMonth - 1, 1, 0, 0, 0)
    const endDate = new Date(eYear, eMonth, 0, 23, 59, 59, 999) // Hari terakhir di endMonth

    const dateFilter = allTime ? {} : { gte: startDate, lte: endDate }
    const auditDateFilter = allTime ? {} : { gte: startDate, lte: endDate }

    // Fetch data in parallel
    const [
      laporanList,
      moldBookList,
      userList,
      overtimeList,
      kehadiranList,
      jadwalList,
      sparepartList,
      safetyList,
      auditList
    ] = await Promise.all([
      prisma.laporan.findMany({
        where: allTime ? {} : { tanggal: dateFilter },
        include: {
          pic: true,
          jadwal: true,
          checksheet: {
            include: {
              spareparts: true,
              approvals: { include: { user: true } }
            }
          }
        },
        orderBy: { tanggal: 'desc' }
      }),
      prisma.moldBook.findMany({
        include: { outhouse: true, updatedByUser: true },
        orderBy: { noMold: 'asc' }
      }),
      prisma.user.findMany({
        orderBy: { id: 'asc' }
      }),
      prisma.overtimeEntry.findMany({
        where: allTime ? {} : { tanggal: dateFilter },
        include: { user: true },
        orderBy: { tanggal: 'desc' }
      }),
      prisma.kehadiran.findMany({
        where: allTime ? {} : { tanggal: dateFilter },
        orderBy: { tanggal: 'desc' }
      }),
      prisma.jadwalMingguan.findMany({
        where: allTime ? {} : { 
          OR: [
            { tanggalRencana: dateFilter },
            { tahun: { gte: sYear, lte: eYear } }
          ]
        },
        include: { pic: true },
        orderBy: [ { tahun: 'desc' }, { mingguKe: 'desc' } ]
      }),
      prisma.katalogSparepart.findMany({
        orderBy: { nama: 'asc' }
      }),
      prisma.safetyLog.findMany({
        where: allTime ? {} : { tanggal: dateFilter },
        orderBy: { tanggal: 'desc' }
      }),
      prisma.auditLog.findMany({
        where: allTime ? {} : { createdAt: auditDateFilter },
        include: { user: true },
        orderBy: { createdAt: 'desc' }
      })
    ])

    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'Sugity Mold Maintenance - Super Admin System'
    workbook.created = new Date()

    // =========================================================
    // SHEET 1: LAPORAN & CHECKSHEET
    // =========================================================
    const sheetLaporan = workbook.addWorksheet('Laporan & Checksheet')
    sheetLaporan.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Tanggal', key: 'tanggal', width: 14 },
      { header: 'No Mold', key: 'noMold', width: 18 },
      { header: 'Jenis', key: 'jenis', width: 14 },
      { header: 'Factory', key: 'factory', width: 12 },
      { header: 'Shift', key: 'shift', width: 12 },
      { header: 'PIC / Member', key: 'pic', width: 22 },
      { header: 'Part', key: 'part', width: 22 },
      { header: 'Problem / Komentar', key: 'problem', width: 32 },
      { header: 'Countermeasure', key: 'countermeasure', width: 32 },
      { header: 'Jam Mulai', key: 'start', width: 12 },
      { header: 'Jam Selesai', key: 'end', width: 12 },
      { header: 'Jml Orang', key: 'people', width: 12 },
      { header: 'Sparepart Digunakan', key: 'spUsed', width: 35 },
      { header: 'M/P Cost (Rp)', key: 'mpCost', width: 16 },
      { header: 'S/P Cost (Rp)', key: 'spCost', width: 16 },
      { header: 'Total Cost (Rp)', key: 'totalCost', width: 18 },
      { header: 'Status Approval', key: 'approvalStatus', width: 28 }
    ]
    styleHeader(sheetLaporan)

    laporanList.forEach(lap => {
      const cs = lap.checksheet
      const costs = hitungCosts(lap)
      const spListStr = cs?.spareparts?.map(s => `${s.namaSparepart} (${s.qty}x)`).join(', ') || '-'
      const approvListStr = cs?.approvals?.map(a => `${a.role}: ${a.signedAt ? '✓ ' + (a.user?.nama || '') : '⏳'}`).join(' | ') || '-'

      sheetLaporan.addRow({
        id: lap.id,
        tanggal: new Date(lap.tanggal).toISOString().slice(0, 10),
        noMold: lap.noMold,
        jenis: lap.jenis,
        factory: lap.factory,
        shift: lap.shift || '-',
        pic: lap.pic?.nama || '-',
        part: lap.part || '-',
        problem: lap.komentar || lap.info || '-',
        countermeasure: lap.countermeasure || '-',
        start: cs?.jamMulai || '-',
        end: cs?.jamSelesai || '-',
        people: cs?.jumlahOrang || 1,
        spUsed: spListStr,
        mpCost: costs.mpCost,
        spCost: costs.spCost,
        totalCost: costs.totalCost,
        approvalStatus: approvListStr
      })
    })
    sheetLaporan.getColumn('mpCost').numFmt = '"Rp "#,##0'
    sheetLaporan.getColumn('spCost').numFmt = '"Rp "#,##0'
    sheetLaporan.getColumn('totalCost').numFmt = '"Rp "#,##0'

    // =========================================================
    // SHEET 2: MASTER MOLD BOOK
    // =========================================================
    const sheetMold = workbook.addWorksheet('Master Mold Book')
    sheetMold.columns = [
      { header: 'No Mold', key: 'noMold', width: 20 },
      { header: 'Mesin (MC)', key: 'mc', width: 14 },
      { header: 'Factory', key: 'factory', width: 12 },
      { header: 'Part Name', key: 'part', width: 26 },
      { header: 'Tonase', key: 'tonase', width: 14 },
      { header: 'Customer', key: 'customer', width: 22 },
      { header: 'Model', key: 'model', width: 20 },
      { header: 'Dimensi (W x H x T)', key: 'dimensi', width: 22 },
      { header: 'Lokasi Mold', key: 'lokasi', width: 26 },
      { header: 'Outhouse', key: 'outhouse', width: 24 },
      { header: 'Terakhir Diupdate Oleh', key: 'updatedBy', width: 24 },
      { header: 'Tanggal Update', key: 'updatedAt', width: 16 }
    ]
    styleHeader(sheetMold)

    moldBookList.forEach(m => {
      sheetMold.addRow({
        noMold: m.noMold,
        mc: m.mc || '-',
        factory: m.factory,
        part: m.part || '-',
        tonase: m.tonase || '-',
        customer: m.customer || '-',
        model: m.model || '-',
        dimensi: `${m.dimensiW || '-'} x ${m.dimensiH || '-'} x ${m.dimensiT || '-'}`,
        lokasi: m.lokasiMold || '-',
        outhouse: m.outhouse?.nama || '-',
        updatedBy: m.updatedByUser?.nama || '-',
        updatedAt: m.updatedAt ? new Date(m.updatedAt).toISOString().slice(0, 10) : '-'
      })
    })

    // =========================================================
    // SHEET 3: MASTER USERS & AKUN
    // =========================================================
    const sheetUsers = workbook.addWorksheet('Master Akun & Role')
    sheetUsers.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Nama Lengkap', key: 'nama', width: 26 },
      { header: 'Username', key: 'username', width: 18 },
      { header: 'Role System', key: 'role', width: 16 },
      { header: 'Factory', key: 'factory', width: 12 },
      { header: 'Shift', key: 'shift', width: 12 },
      { header: 'NIK', key: 'nik', width: 16 },
      { header: 'Tempat, Tanggal Lahir', key: 'ttl', width: 28 },
      { header: 'Email', key: 'email', width: 26 },
      { header: 'Tanggal Dibuat', key: 'createdAt', width: 16 }
    ]
    styleHeader(sheetUsers)

    userList.forEach(u => {
      const ttlStr = `${u.tempatLahir || '-'}, ${u.tanggalLahir ? new Date(u.tanggalLahir).toISOString().slice(0, 10) : '-'}`
      sheetUsers.addRow({
        id: u.id,
        nama: u.nama,
        username: u.username,
        role: u.role,
        factory: u.factory,
        shift: u.shift || '-',
        nik: u.nik || '-',
        ttl: ttlStr,
        email: u.email || '-',
        createdAt: new Date(u.createdAt).toISOString().slice(0, 10)
      })
    })

    // =========================================================
    // SHEET 4: OVERTIME ENTRY
    // =========================================================
    const sheetOvertime = workbook.addWorksheet('Overtime')
    sheetOvertime.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Nama Pegawai', key: 'nama', width: 26 },
      { header: 'Role / Factory', key: 'roleFactory', width: 18 },
      { header: 'Tanggal Overtime', key: 'tanggal', width: 16 },
      { header: 'Bulan Rekap', key: 'bulan', width: 16 },
      { header: 'Jam Rencana (Plan)', key: 'plan', width: 18 },
      { header: 'Jam Aktual (Act)', key: 'act', width: 18 }
    ]
    styleHeader(sheetOvertime)

    overtimeList.forEach(ot => {
      sheetOvertime.addRow({
        id: ot.id,
        nama: ot.user?.nama || '-',
        roleFactory: `${ot.user?.role || '-'} (${ot.user?.factory || '-'})`,
        tanggal: new Date(ot.tanggal).toISOString().slice(0, 10),
        bulan: new Date(ot.bulan).toISOString().slice(0, 7),
        plan: Number(ot.jamRencana || 0),
        act: Number(ot.jamAktual || 0)
      })
    })

    // =========================================================
    // SHEET 5: JADWAL MINGGUAN
    // =========================================================
    const sheetJadwal = workbook.addWorksheet('Jadwal Maintenance')
    sheetJadwal.columns = [
      { header: 'Tahun', key: 'tahun', width: 10 },
      { header: 'Minggu Ke', key: 'minggu', width: 12 },
      { header: 'No Mold', key: 'noMold', width: 20 },
      { header: 'PIC Assigned', key: 'pic', width: 24 },
      { header: 'Hari', key: 'hari', width: 12 },
      { header: 'Jenis Maintenance', key: 'jenis', width: 18 },
      { header: 'Rencana Tanggal', key: 'rencana', width: 16 },
      { header: 'Status Execution', key: 'status', width: 20 },
      { header: 'Catatan', key: 'catatan', width: 30 }
    ]
    styleHeader(sheetJadwal)

    jadwalList.forEach(j => {
      sheetJadwal.addRow({
        tahun: j.tahun,
        minggu: `Week ${j.mingguKe}`,
        noMold: j.noMold,
        pic: j.pic?.nama || '-',
        hari: j.hari || '-',
        jenis: j.jenis || '-',
        rencana: j.tanggalRencana ? new Date(j.tanggalRencana).toISOString().slice(0, 10) : '-',
        status: j.status,
        catatan: j.catatan || '-'
      })
    })

    // =========================================================
    // SHEET 6: KATALOG SPAREPART
    // =========================================================
    const sheetSparepart = workbook.addWorksheet('Katalog Sparepart')
    sheetSparepart.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Nama Sparepart', key: 'nama', width: 35 },
      { header: 'Harga Satuan (Rp)', key: 'harga', width: 22 },
      { header: 'Tanggal Ditambahkan', key: 'created', width: 20 }
    ]
    styleHeader(sheetSparepart)

    sparepartList.forEach(s => {
      sheetSparepart.addRow({
        id: s.id,
        nama: s.nama,
        harga: Number(s.hargaSatuan || 0),
        created: new Date(s.createdAt).toISOString().slice(0, 10)
      })
    })
    sheetSparepart.getColumn('harga').numFmt = '"Rp "#,##0'

    // =========================================================
    // SHEET 7: KEHADIRAN & SAFETY LOG
    // =========================================================
    const sheetSafety = workbook.addWorksheet('Kehadiran & Safety')
    sheetSafety.columns = [
      { header: 'Tanggal', key: 'tanggal', width: 16 },
      { header: 'Status Safety Accident', key: 'safetyStatus', width: 24 },
      { header: 'Keterangan Safety', key: 'safetyKet', width: 30 },
      { header: 'Data Kehadiran (Shift)', key: 'kehadiran', width: 35 },
      { header: 'Persentase Hadir (%)', key: 'persen', width: 22 }
    ]
    styleHeader(sheetSafety)

    const allDatesSet = new Set([
      ...safetyList.map(s => new Date(s.tanggal).toISOString().slice(0, 10)),
      ...kehadiranList.map(k => new Date(k.tanggal).toISOString().slice(0, 10))
    ])
    const sortedDates = Array.from(allDatesSet).sort().reverse()

    sortedDates.forEach(dtStr => {
      const sft = safetyList.find(s => new Date(s.tanggal).toISOString().slice(0, 10) === dtStr)
      const khd = kehadiranList.filter(k => new Date(k.tanggal).toISOString().slice(0, 10) === dtStr)
      const khdStr = khd.map(k => `${k.shift}: ${Number(k.persenHadir || 0)}%`).join(' | ') || '-'
      const avgPersen = khd.length ? khd.reduce((sum, k) => sum + Number(k.persenHadir || 0), 0) / khd.length : '-'

      sheetSafety.addRow({
        tanggal: dtStr,
        safetyStatus: sft?.status || 'No Data',
        safetyKet: sft?.keterangan || '-',
        kehadiran: khdStr,
        persen: typeof avgPersen === 'number' ? `${avgPersen.toFixed(1)}%` : '-'
      })
    })

    // =========================================================
    // SHEET 8: AUDIT LOG SYSTEM
    // =========================================================
    const sheetAudit = workbook.addWorksheet('Audit Log System')
    sheetAudit.columns = [
      { header: 'ID Log', key: 'id', width: 10 },
      { header: 'Waktu Aktivitas', key: 'time', width: 24 },
      { header: 'User Pengguna', key: 'user', width: 26 },
      { header: 'Role', key: 'role', width: 14 },
      { header: 'Detail Aktivitas', key: 'action', width: 60 }
    ]
    styleHeader(sheetAudit)

    auditList.forEach(log => {
      const dt = new Date(log.createdAt)
      const formattedTime = `${dt.toISOString().slice(0, 10)} ${dt.toTimeString().slice(0, 8)}`
      sheetAudit.addRow({
        id: log.id,
        time: formattedTime,
        user: log.user?.nama || 'System',
        role: log.user?.role || '-',
        action: log.aktivitas
      })
    })

    // Add visual borders & styling across all sheets
    workbook.worksheets.forEach(worksheet => {
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
          row.eachCell({ includeEmpty: true }, cell => {
            cell.border = {
              top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
              left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
              bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
              right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
            }
          })
        }
      })
    })

    const buffer = await workbook.xlsx.writeBuffer()
    const filename = allTime 
      ? `Database_Master_Sugity_All_Time.xlsx` 
      : `Database_Master_Sugity_${sYear}-${String(sMonth).padStart(2,'0')}_to_${eYear}-${String(eMonth).padStart(2,'0')}.xlsx`

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })
  } catch (err) {
    console.error('Master Database Export Error:', err)
    return NextResponse.json({ error: 'Gagal melakukan export database master ke Excel' }, { status: 500 })
  }
}
