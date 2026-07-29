import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import ExcelJS from 'exceljs'

function hitungHistoryCosts(lap: any) {
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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const yearStr = searchParams.get('year')
    const targetYear = yearStr ? parseInt(yearStr, 10) : new Date().getFullYear()

    const startDate = new Date(`${targetYear}-01-01T00:00:00Z`)
    const endDate = new Date(`${targetYear}-12-31T23:59:59Z`)

    // Fetch ALL Laporan in the year
    const laporanList = await prisma.laporan.findMany({
      where: {
        tanggal: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        pic: { select: { nama: true } },
        checksheet: {
          include: { spareparts: true, foto: true }
        }
      },
      orderBy: { tanggal: 'asc' }
    })

    // Fetch all molds for lookup
    const molds = await prisma.moldBook.findMany()
    const moldMap = new Map()
    molds.forEach(m => moldMap.set(m.noMold, m))

    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'Sugity Mold Maintenance'

    const bulanNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ]

    let totalMpYear = 0
    let totalSpYear = 0
    const countsPerMonth = Array(12).fill(0)
    const costPerMonth = Array(12).fill(0)

    // Buat 12 Sheet Bulanan
    bulanNames.forEach((namaBulan, idx) => {
      const sheet = workbook.addWorksheet(`${idx + 1} - ${namaBulan}`)
      sheet.columns = [
        { header: 'Tanggal', key: 'tgl', width: 12 },
        { header: 'No Mold', key: 'mold', width: 15 },
        { header: 'Model', key: 'model', width: 15 },
        { header: 'Part Name', key: 'part', width: 20 },
        { header: 'Customer', key: 'customer', width: 15 },
        { header: 'Factory', key: 'factory', width: 15 },
        { header: 'PIC', key: 'pic', width: 20 },
        { header: 'Jenis Perawatan', key: 'jenis', width: 15 },
        { header: 'Detail Problem', key: 'problem', width: 30 },
        { header: 'Countermeasure', key: 'cm', width: 30 },
        { header: 'M/P Cost (Rp)', key: 'mpcost', width: 15 },
        { header: 'S/P Cost (Rp)', key: 'spcost', width: 15 },
        { header: 'Total Cost (Rp)', key: 'totalcost', width: 15 },
        { header: 'Link Foto', key: 'foto', width: 25 },
      ]
      
      // Styling header
      sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
      sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF194A37' } }

      // Filter laporan per bulan
      const lapBulanIni = laporanList.filter(l => l.tanggal.getMonth() === idx)
      
      lapBulanIni.forEach(lap => {
        const cost = hitungHistoryCosts(lap)
        totalMpYear += cost.mpCost
        totalSpYear += cost.spCost
        countsPerMonth[idx]++
        costPerMonth[idx] += cost.totalCost

        // Foto URL (join if multiple)
        let fotoUrls = ''
        if (lap.checksheet?.foto && lap.checksheet.foto.length > 0) {
          fotoUrls = lap.checksheet.foto.map((f: any) => f.filePath).join(', ')
        }

        const moldInfo = moldMap.get(lap.noMold) || {}

        const row = sheet.addRow({
          tgl: lap.tanggal.toISOString().slice(0, 10),
          mold: lap.noMold,
          model: moldInfo.model || '-',
          part: lap.part || moldInfo.part || '-',
          customer: moldInfo.customer || '-',
          factory: lap.factory || moldInfo.factory || '-',
          pic: lap.pic?.nama || '-',
          jenis: lap.jenis,
          problem: lap.info || '-',
          cm: lap.countermeasure || '-',
          mpcost: cost.mpCost,
          spcost: cost.spCost,
          totalcost: cost.totalCost,
          foto: fotoUrls || '-',
        })
        
        row.getCell('mpcost').numFmt = '#,##0'
        row.getCell('spcost').numFmt = '#,##0'
        row.getCell('totalcost').numFmt = '#,##0'
        row.alignment = { vertical: 'top', wrapText: true }
      })
    })

    // Buat Sheet Ringkasan (Sheet 13)
    const summarySheet = workbook.addWorksheet('13 - Ringkasan Tahunan')
    summarySheet.columns = [
      { header: 'Keterangan', key: 'keterangan', width: 30 },
      { header: 'Nilai', key: 'nilai', width: 40 }
    ]

    summarySheet.addRow({ keterangan: 'Tahun Rekap', nilai: targetYear })
    summarySheet.addRow({ keterangan: 'Cakupan Data', nilai: 'Seluruh Mold (All Molds)' })
    summarySheet.addRow({})
    summarySheet.addRow({ keterangan: 'Total Frekuensi Perbaikan Keseluruhan', nilai: laporanList.length })
    summarySheet.addRow({ keterangan: 'Total M/P Cost Keseluruhan', nilai: totalMpYear }).getCell('nilai').numFmt = '"Rp "#,##0'
    summarySheet.addRow({ keterangan: 'Total S/P Cost Keseluruhan', nilai: totalSpYear }).getCell('nilai').numFmt = '"Rp "#,##0'
    summarySheet.addRow({ keterangan: 'Total Biaya Keseluruhan', nilai: totalMpYear + totalSpYear }).getCell('nilai').numFmt = '"Rp "#,##0'
    summarySheet.addRow({})

    summarySheet.addRow({ keterangan: 'Bulan', nilai: 'Total Frekuensi & Cost' }).font = { bold: true }
    bulanNames.forEach((namaBulan, idx) => {
      summarySheet.addRow({
        keterangan: namaBulan,
        nilai: `${countsPerMonth[idx]} perbaikan (Rp ${costPerMonth[idx].toLocaleString('id-ID')})`
      })
    })

    summarySheet.getColumn('keterangan').font = { bold: true }

    const buffer = await workbook.xlsx.writeBuffer()

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Rekap_Global_Maintenance_${targetYear}.xlsx"`
      }
    })
  } catch (err) {
    console.error('Export Error:', err)
    return NextResponse.json({ error: 'Gagal export excel global' }, { status: 500 })
  }
}
