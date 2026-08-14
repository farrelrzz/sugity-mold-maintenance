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

export async function GET(req: Request, { params }: { params: Promise<{ noMold: string }> }) {
  try {
    const { noMold } = await params
    const decodedNoMold = decodeURIComponent(noMold)
    const { searchParams } = new URL(req.url)
    const yearStr = searchParams.get('year')
    const targetYear = yearStr ? parseInt(yearStr, 10) : new Date().getFullYear()

    const mold = await prisma.moldBook.findUnique({
      where: { noMold: decodedNoMold }
    })
    if (!mold) {
      return NextResponse.json({ error: 'Mold tidak ditemukan' }, { status: 404 })
    }

    const startDate = new Date(`${targetYear}-01-01T00:00:00Z`)
    const endDate = new Date(`${targetYear}-12-31T23:59:59Z`)

    const laporanList = await prisma.laporan.findMany({
      where: {
        noMold: decodedNoMold,
        tanggal: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        pic: { select: { nama: true } },
        checksheet: {
          include: { spareparts: true }
        }
      },
      orderBy: { tanggal: 'asc' }
    })

    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'Sugity Mold Maintenance'

    const sheet = workbook.addWorksheet('Riwayat Tahunan')

    // Set Column Widths
    sheet.getColumn('A').width = 5   // DD
    sheet.getColumn('B').width = 5   // MM
    sheet.getColumn('C').width = 5   // YY
    sheet.getColumn('D').width = 50  // O/H & BM, PM CARD (Description)
    sheet.getColumn('E').width = 20  // M/P COST
    sheet.getColumn('F').width = 20  // S/P COST
    sheet.getColumn('G').width = 20  // TOTAL COST
    sheet.getColumn('H').width = 30  // COMMENT

    // TITLE ROW
    sheet.mergeCells('A1:D1')
    sheet.getCell('A1').value = `HISTORY O/H & BM , PM CARD         YEAR : ${targetYear}`
    sheet.getCell('A1').font = { bold: true, size: 14 }
    sheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'left' }

    // MOLD INFO
    sheet.getCell('A2').value = 'MACHINE/MOLD NO :'
    sheet.getCell('C2').value = mold.noMold
    sheet.mergeCells('A2:B2')
    sheet.mergeCells('C2:D2')
    sheet.mergeCells('E2:H2')
    sheet.getCell('E2').value = 'PIC :'

    sheet.getCell('A3').value = 'MACHINE/MOLD NAME :'
    sheet.getCell('C3').value = mold.part || '-'
    sheet.mergeCells('A3:B3')
    sheet.mergeCells('C3:D3')
    sheet.mergeCells('E3:H3')
    sheet.getCell('E3').value = 'PROD PLAN :'

    sheet.getCell('A4').value = 'CUST :'
    sheet.getCell('B4').value = mold.customer || '-'
    sheet.getCell('C4').value = 'MODEL :'
    sheet.getCell('D4').value = mold.model || '-'
    sheet.mergeCells('E4:H4')
    sheet.getCell('E4').value = 'O/H PLAN :'

    sheet.getCell('A5').value = 'SVP :'
    sheet.getCell('B5').value = '-'
    sheet.getCell('C5').value = 'MAKER :'
    sheet.getCell('D5').value = mold.maker || '-'
    sheet.mergeCells('E5:H5')
    sheet.getCell('E5').value = 'O/H CYCLE :'

    // Apply borders to the info section
    for (let r = 2; r <= 5; r++) {
      for (let c = 1; c <= 8; c++) {
        const cell = sheet.getCell(r, c)
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        }
        cell.font = { size: 10, bold: true }
      }
    }

    // TABLE HEADERS
    sheet.mergeCells('A6:C6')
    sheet.getCell('A6').value = 'FILLING DATE'
    sheet.getCell('A7').value = 'DD'
    sheet.getCell('B7').value = 'MM'
    sheet.getCell('C7').value = 'YY'

    sheet.mergeCells('D6:D7')
    sheet.getCell('D6').value = 'O/H & BM , PM CARD'

    sheet.mergeCells('E6:G6')
    sheet.getCell('E6').value = 'TOTAL COST'
    sheet.getCell('E7').value = 'M/P COST Rp(89,595/H)'
    sheet.getCell('F7').value = 'OUT HOUSE COST (Rp)'
    sheet.getCell('G7').value = '(Rp)'

    sheet.mergeCells('H6:H7')
    sheet.getCell('H6').value = 'COMMENT'

    // Style table headers
    for (let r = 6; r <= 7; r++) {
      for (let c = 1; c <= 8; c++) {
        const cell = sheet.getCell(r, c)
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        }
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
        cell.font = { size: 10, bold: true }
      }
    }

    // FILL DATA
    let startRow = 8
    let totalMpYear = 0
    let totalSpYear = 0

    laporanList.forEach(lap => {
      const cost = hitungHistoryCosts(lap)
      totalMpYear += cost.mpCost
      totalSpYear += cost.spCost

      const d = new Date(lap.tanggal)
      const dd = String(d.getDate()).padStart(2, '0')
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const yy = String(d.getFullYear()).slice(-2)

      let desc = `[${lap.jenis}]`
      if (lap.info) desc += `\nProblem: ${lap.info}`
      if (lap.countermeasure) desc += `\nCM: ${lap.countermeasure}`

      const row = sheet.addRow([
        dd,
        mm,
        yy,
        desc,
        cost.mpCost,
        cost.spCost,
        cost.totalCost,
        lap.komentar || ''
      ])

      row.getCell(5).numFmt = '#,##0'
      row.getCell(6).numFmt = '#,##0'
      row.getCell(7).numFmt = '#,##0'

      for (let c = 1; c <= 8; c++) {
        row.getCell(c).border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        }
        row.getCell(c).alignment = { vertical: 'top', wrapText: true }
        row.getCell(c).font = { size: 10 }
      }
      
      // Center align dates
      row.getCell(1).alignment = { vertical: 'top', horizontal: 'center' }
      row.getCell(2).alignment = { vertical: 'top', horizontal: 'center' }
      row.getCell(3).alignment = { vertical: 'top', horizontal: 'center' }
    })

    // Add empty rows if less than 20 rows to make it look like a form
    const minRows = 20
    if (laporanList.length < minRows) {
      for (let i = 0; i < minRows - laporanList.length; i++) {
        const row = sheet.addRow(['', '', '', '', '', '', '', ''])
        for (let c = 1; c <= 8; c++) {
          row.getCell(c).border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          }
        }
      }
    }

    const buffer = await workbook.xlsx.writeBuffer()

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Rekap_Tahunan_${decodedNoMold}_${targetYear}.xlsx"`
      }
    })
  } catch (err) {
    console.error('Export Error:', err)
    return NextResponse.json({ error: 'Gagal export excel' }, { status: 500 })
  }
}
