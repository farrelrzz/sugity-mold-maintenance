import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import ExcelJS from 'exceljs'

const BULAN_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

function hitungMingguDalamBulan(tahun: number, bln: number): string[] {
  const minggu: string[] = []
  let cursor = new Date(tahun, bln - 1, 1)
  const day = cursor.getDay()
  const selisih = day === 0 ? -6 : 1 - day
  cursor.setDate(cursor.getDate() + selisih - 7)
  for (let i = 0; i < 8; i++) {
    let count = 0
    for (let d = 0; d < 7; d++) {
      const hc = new Date(cursor)
      hc.setDate(hc.getDate() + d)
      if (hc.getFullYear() === tahun && hc.getMonth() === bln - 1) count++
    }
    if (count >= 4) minggu.push(cursor.toISOString().slice(0, 10))
    cursor.setDate(cursor.getDate() + 7)
  }
  return minggu
}

function isFullApproved(approvals: any[]): boolean {
  return ['PIC', 'TL', 'GL', 'ADM'].every((role) =>
    approvals.some((a) => a.role === role && a.signedAt !== null)
  )
}

function mulaiMingguISO(d: Date): string {
  const tgl = new Date(d)
  const hari = tgl.getDay()
  const selisih = hari === 0 ? -6 : 1 - hari
  tgl.setDate(tgl.getDate() + selisih)
  return tgl.toISOString().slice(0, 10)
}

function applyHeaderStyle(cell: ExcelJS.Cell, bg = '1A5276', color = 'FFFFFF') {
  cell.font = { bold: true, color: { argb: color }, size: 11 }
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } }
  cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
  cell.border = {
    top: { style: 'thin' }, left: { style: 'thin' },
    bottom: { style: 'thin' }, right: { style: 'thin' },
  }
}

function applyDataCell(cell: ExcelJS.Cell, bg?: string) {
  cell.alignment = { horizontal: 'center', vertical: 'middle' }
  cell.border = {
    top: { style: 'thin' }, left: { style: 'thin' },
    bottom: { style: 'thin' }, right: { style: 'thin' },
  }
  if (bg) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const tahunParam = parseInt(searchParams.get('tahun') || String(new Date().getFullYear()))

    // ──────────────────────────────────────────────────────────────────
    // Fetch all data for the year
    // ──────────────────────────────────────────────────────────────────
    const startOfYear = new Date(tahunParam, 0, 1)
    const endOfYear = new Date(tahunParam, 11, 31, 23, 59, 59, 999)

    const [laporanAll, planningTargets, overtimeAll, usersAll] = await Promise.all([
      prisma.laporan.findMany({
        where: { tanggal: { gte: startOfYear, lte: endOfYear } },
        include: { checksheet: { include: { spareparts: true, approvals: true } } },
        orderBy: { tanggal: 'asc' },
      }),
      prisma.planningTarget.findMany({
        where: { bulan: { gte: startOfYear, lte: endOfYear } },
      }),
      prisma.overtimeEntry.findMany({
        where: { tanggal: { gte: startOfYear, lte: endOfYear } },
        include: { user: { select: { id: true, nama: true, shift: true } } },
        orderBy: { tanggal: 'asc' },
      }),
      prisma.user.findMany({
        select: { id: true, nama: true, shift: true, role: true },
        orderBy: [{ shift: 'asc' }, { nama: 'asc' }],
      }),
    ])

    // ──────────────────────────────────────────────────────────────────
    // Build workbook
    // ──────────────────────────────────────────────────────────────────
    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'PT Sugity Creatives - Mold Maintenance System'
    workbook.created = new Date()

    // Yearly summary row accumulator
    const yearSummary: {
      bulan: string
      totalActions: number
      ohDone: number
      targetOh: number
      totalCost: number
      totalPlanOT: number
      totalAktualOT: number
    }[] = []

    // ──────────────────────────────────────────────────────────────────
    // Sheet per bulan (1–12)
    // ──────────────────────────────────────────────────────────────────
    for (let m = 0; m < 12; m++) {
      const bln = m + 1
      const startBulan = new Date(tahunParam, m, 1)
      const endBulan = new Date(tahunParam, m + 1, 0, 23, 59, 59, 999)

      const laporanBulan = laporanAll.filter((l) => {
        const d = new Date(l.tanggal)
        return d >= startBulan && d <= endBulan
      })

      const minggu = hitungMingguDalamBulan(tahunParam, bln)

      const targetOhA = planningTargets.find(
        (t) => new Date(t.bulan).getMonth() === m && t.shift === 'Shift_A'
      )?.targetOh || 0
      const targetOhB = planningTargets.find(
        (t) => new Date(t.bulan).getMonth() === m && t.shift === 'Shift_B'
      )?.targetOh || 0
      const perMingguA = minggu.length > 0 ? Math.round(targetOhA / minggu.length) : 0
      const perMingguB = minggu.length > 0 ? Math.round(targetOhB / minggu.length) : 0

      // Hitung aktual per minggu (hanya full approved)
      const aktualA = minggu.map(() => 0)
      const aktualB = minggu.map(() => 0)
      let ohDone = 0
      let totalCost = 0
      let totalActions = laporanBulan.length

      laporanBulan.forEach((lap) => {
        const cs = lap.checksheet
        if (cs) {
          // Cost
          let mpCost = 0
          if (Array.isArray(cs.spareparts)) {
            cs.spareparts.forEach((sp: any) => {
              totalCost += sp.qty * Number(sp.hargaSatuan || 0)
            })
          }
          // OH done check
          if (lap.jenis === 'OH_MOLD' && isFullApproved(cs.approvals || [])) {
            ohDone++
            const wIdx = minggu.indexOf(mulaiMingguISO(new Date(lap.tanggal)))
            if (wIdx !== -1) {
              if (lap.shift === 'Shift_A') aktualA[wIdx]++
              else if (lap.shift === 'Shift_B') aktualB[wIdx]++
            }
          }
        }
      })

      // Overtime per orang bulan ini
      const otBulan = overtimeAll.filter((e) => {
        const d = new Date(e.tanggal)
        return d >= startBulan && d <= endBulan
      })

      const otByUser: Record<number, { nama: string; shift: string; plan: number; aktual: number }> = {}
      otBulan.forEach((e) => {
        if (!otByUser[e.userId]) {
          otByUser[e.userId] = {
            nama: e.user.nama,
            shift: (e.user.shift as string) || 'Nonshift',
            plan: 0,
            aktual: 0,
          }
        }
        otByUser[e.userId].plan += Number(e.jamRencana || 0)
        otByUser[e.userId].aktual += Number(e.jamAktual || 0)
      })

      const otList = Object.values(otByUser).sort((a, b) => a.nama.localeCompare(b.nama))
      const totalPlanOT = otList.reduce((s, u) => s + u.plan, 0)
      const totalAktualOT = otList.reduce((s, u) => s + u.aktual, 0)

      yearSummary.push({
        bulan: BULAN_NAMES[m],
        totalActions,
        ohDone,
        targetOh: targetOhA + targetOhB,
        totalCost,
        totalPlanOT,
        totalAktualOT,
      })

      // ── Create sheet ──
      const ws = workbook.addWorksheet(BULAN_NAMES[m])

      // Title
      ws.mergeCells('A1:H1')
      const titleCell = ws.getCell('A1')
      titleCell.value = `PT SUGITY CREATIVES — LAPORAN MAINTENANCE MOLD ${BULAN_NAMES[m].toUpperCase()} ${tahunParam}`
      titleCell.font = { bold: true, size: 13, color: { argb: 'FFFFFF' } }
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '154360' } }
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
      ws.getRow(1).height = 28

      // ── Section 1: OH Target vs Aktual per Minggu ──
      ws.getCell('A3').value = '1. OVERHAUL TARGET vs AKTUAL PER MINGGU'
      ws.getCell('A3').font = { bold: true, size: 11, color: { argb: '154360' } }
      ws.mergeCells('A3:H3')

      const ohHeaders = ['Minggu Ke-', 'Senin Awal Minggu', 'Target Shift A', 'Target Shift B', 'Target Total', 'Aktual Shift A', 'Aktual Shift B', 'Aktual Total']
      const ohHeaderRow = ws.addRow(ohHeaders)
      ohHeaderRow.eachCell((cell) => applyHeaderStyle(cell, '1F618D'))

      minggu.forEach((mon, idx) => {
        const row = ws.addRow([
          `Minggu ${idx + 1}`,
          mon,
          perMingguA,
          perMingguB,
          perMingguA + perMingguB,
          aktualA[idx],
          aktualB[idx],
          aktualA[idx] + aktualB[idx],
        ])
        row.eachCell((cell) => applyDataCell(cell, idx % 2 === 0 ? 'EBF5FB' : 'FDFEFE'))
      })

      // Total row
      const totOhRow = ws.addRow([
        'TOTAL', '', targetOhA, targetOhB, targetOhA + targetOhB,
        aktualA.reduce((a, b) => a + b, 0),
        aktualB.reduce((a, b) => a + b, 0),
        aktualA.reduce((a, b) => a + b, 0) + aktualB.reduce((a, b) => a + b, 0),
      ])
      totOhRow.eachCell((cell) => applyHeaderStyle(cell, '2E86C1', 'FFFFFF'))

      ws.addRow([])

      // ── Section 2: Overtime ──
      const otTitleCell = ws.getCell(`A${ws.rowCount + 1}`)
      otTitleCell.value = '2. OVERTIME / JAM KERJA PER PERSONIL'
      otTitleCell.font = { bold: true, size: 11, color: { argb: '154360' } }
      ws.mergeCells(`A${ws.rowCount}:F${ws.rowCount}`)

      const otHeaderRow = ws.addRow(['Nama', 'Shift', 'Target (Jam)', 'Aktual (Jam)', 'Pencapaian (%)', 'Status'])
      otHeaderRow.eachCell((cell) => applyHeaderStyle(cell, '1E8449'))

      otList.forEach((u, idx) => {
        const pct = u.plan > 0 ? ((u.aktual / u.plan) * 100).toFixed(1) : '-'
        const status = u.plan > 0 && u.aktual >= u.plan ? '✅ Tercapai' : u.aktual > 0 ? '⚠️ Sebagian' : '❌ Belum'
        const row = ws.addRow([u.nama, u.shift.replace('_', ' '), u.plan, u.aktual, pct, status])
        row.eachCell((cell) => applyDataCell(cell, idx % 2 === 0 ? 'EAFAF1' : 'FDFEFE'))
      })

      const totOtRow = ws.addRow(['TOTAL', '', totalPlanOT.toFixed(1), totalAktualOT.toFixed(1),
        totalPlanOT > 0 ? `${((totalAktualOT / totalPlanOT) * 100).toFixed(1)}%` : '-', ''])
      totOtRow.eachCell((cell) => applyHeaderStyle(cell, '239B56', 'FFFFFF'))

      // Auto column widths
      ws.columns = [
        { width: 18 }, { width: 20 }, { width: 16 }, { width: 16 },
        { width: 14 }, { width: 16 }, { width: 16 }, { width: 16 },
      ]
    }

    // ──────────────────────────────────────────────────────────────────
    // Sheet 13: Ringkasan Tahunan
    // ──────────────────────────────────────────────────────────────────
    const wsSum = workbook.addWorksheet(`Ringkasan ${tahunParam}`)

    wsSum.mergeCells('A1:H1')
    const sumTitle = wsSum.getCell('A1')
    sumTitle.value = `PT SUGITY CREATIVES — RINGKASAN TAHUNAN MAINTENANCE MOLD ${tahunParam}`
    sumTitle.font = { bold: true, size: 14, color: { argb: 'FFFFFF' } }
    sumTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '154360' } }
    sumTitle.alignment = { horizontal: 'center', vertical: 'middle' }
    wsSum.getRow(1).height = 32

    wsSum.addRow([])

    const sumHeaders = ['Bulan', 'Total Kegiatan', 'Target OH', 'OH Selesai (Full Approved)', 'Pencapaian OH (%)', 'Total Biaya (Rp)', 'OT Plan (Jam)', 'OT Aktual (Jam)']
    const sumHeaderRow = wsSum.addRow(sumHeaders)
    sumHeaderRow.eachCell((cell) => applyHeaderStyle(cell, '1A5276'))

    yearSummary.forEach((row, idx) => {
      const pctOh = row.targetOh > 0 ? `${((row.ohDone / row.targetOh) * 100).toFixed(1)}%` : '—'
      const dataRow = wsSum.addRow([
        row.bulan,
        row.totalActions,
        row.targetOh,
        row.ohDone,
        pctOh,
        `Rp ${row.totalCost.toLocaleString('id-ID')}`,
        row.totalPlanOT.toFixed(1),
        row.totalAktualOT.toFixed(1),
      ])
      dataRow.eachCell((cell) => applyDataCell(cell, idx % 2 === 0 ? 'EBF5FB' : 'FDFEFE'))
    })

    // Grand total row
    const grandTotal = wsSum.addRow([
      'TOTAL SETAHUN',
      yearSummary.reduce((s, r) => s + r.totalActions, 0),
      yearSummary.reduce((s, r) => s + r.targetOh, 0),
      yearSummary.reduce((s, r) => s + r.ohDone, 0),
      yearSummary.reduce((s, r) => s + r.targetOh, 0) > 0
        ? `${((yearSummary.reduce((s, r) => s + r.ohDone, 0) / yearSummary.reduce((s, r) => s + r.targetOh, 0)) * 100).toFixed(1)}%`
        : '—',
      `Rp ${yearSummary.reduce((s, r) => s + r.totalCost, 0).toLocaleString('id-ID')}`,
      yearSummary.reduce((s, r) => s + r.totalPlanOT, 0).toFixed(1),
      yearSummary.reduce((s, r) => s + r.totalAktualOT, 0).toFixed(1),
    ])
    grandTotal.eachCell((cell) => applyHeaderStyle(cell, '154360'))

    wsSum.columns = [
      { width: 16 }, { width: 18 }, { width: 14 }, { width: 26 },
      { width: 18 }, { width: 22 }, { width: 16 }, { width: 18 },
    ]

    // ──────────────────────────────────────────────────────────────────
    // Return as download
    // ──────────────────────────────────────────────────────────────────
    const buffer = await workbook.xlsx.writeBuffer()

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Laporan_Mold_${tahunParam}.xlsx"`,
      },
    })
  } catch (error) {
    console.error('API Error in GET /api/dashboard/export-excel:', error)
    return NextResponse.json({ error: 'Gagal generate Excel' }, { status: 500 })
  }
}
