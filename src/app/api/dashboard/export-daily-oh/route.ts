import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import ExcelJS from 'exceljs'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const bulanParam = searchParams.get('bulan') || new Date().toISOString().slice(0, 7) // YYYY-MM
    const [tahun, bln] = bulanParam.split('-').map(Number)
    const startDate = new Date(tahun, bln - 1, 1)
    const endDate = new Date(tahun, bln, 0, 23, 59, 59, 999)

    // Ambil laporan
    const laporanBulanIni = await prisma.laporan.findMany({
      where: {
        tanggal: { gte: startDate, lte: endDate },
        jenis: 'OH_MOLD'
      },
      include: {
        checksheet: {
          include: { approvals: true }
        }
      }
    })

    // Hitung per hari
    const daysInMonth = new Date(tahun, bln, 0).getDate()
    const dailyOhMap: Record<number, number> = {}
    for (let d = 1; d <= daysInMonth; d++) dailyOhMap[d] = 0

    laporanBulanIni.forEach((lap) => {
      const isFullApproved = ['PIC', 'TL', 'GL', 'CL', 'ADM'].every((role) =>
        (lap.checksheet?.approvals || []).some((a) => a.role === role && a.signedAt !== null)
      )
      if (isFullApproved) {
        const d = new Date(lap.tanggal).getDate()
        dailyOhMap[d]++
      }
    })

    // Buat Excel
    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet(`OH_Harian_${bulanParam}`)

    // Header
    sheet.columns = [
      { header: 'Tanggal', key: 'tanggal', width: 20 },
      { header: 'Jumlah OH Mold Selesai', key: 'count', width: 25 },
    ]

    // Style Header
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1d6f42' } }
    sheet.getRow(1).alignment = { horizontal: 'center' }

    let total = 0
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${tahun}-${String(bln).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const count = dailyOhMap[d]
      total += count
      sheet.addRow({ tanggal: dateStr, count })
    }

    // Add total row
    const totalRow = sheet.addRow({ tanggal: 'TOTAL OH', count: total })
    totalRow.font = { bold: true }
    totalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDDDDDD' } }

    const buffer = await workbook.xlsx.writeBuffer()
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=OH_Harian_${bulanParam}.xlsx`,
      },
    })
  } catch (error) {
    console.error('API Error in export-daily-oh:', error)
    return NextResponse.json({ error: 'Gagal export data' }, { status: 500 })
  }
}
