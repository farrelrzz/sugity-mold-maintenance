import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function hitungHistoryCosts(lap: any) {
  let mpCost = 0
  let spCost = 0
  const isOh = lap.jenis === 'OH_MOLD' || lap.jenis === 'OH MOLD'
  const cs = lap.checksheet

  if (cs) {
    // 1. MP Cost
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

    // 2. Spareparts
    if (Array.isArray(cs.spareparts)) {
      cs.spareparts.forEach((sp: any) => {
        spCost += sp.qty * Number(sp.hargaSatuan || 0)
      })
    }
  } else {
    // Fallback if no checksheet yet
    mpCost = Math.round(1 * 89595 * 1)
  }

  return { mpCost, spCost, totalCost: mpCost + spCost }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ noMold: string }> }
) {
  try {
    const { noMold } = await params
    const decodedNoMold = decodeURIComponent(noMold)

    // Fetch Mold Specs
    const mold = await prisma.moldBook.findUnique({
      where: { noMold: decodedNoMold },
    })

    if (!mold) {
      return NextResponse.json({ error: 'Mold tidak ditemukan di database.' }, { status: 404 })
    }

    // Fetch all Laporan matching decodedNoMold
    const laporanList = await prisma.laporan.findMany({
      where: { noMold: decodedNoMold },
      include: {
        pic: { select: { nama: true } },
        checksheet: {
          include: {
            spareparts: true,
            approvals: true,
          },
        },
      },
      orderBy: {
        tanggal: 'desc',
      },
    })

    let totalCost = 0
    const history = laporanList.map((lap) => {
      const costs = hitungHistoryCosts(lap)
      totalCost += costs.totalCost

      return {
        id: lap.id,
        tanggal: lap.tanggal.toISOString().slice(0, 10),
        jenis: lap.jenis,
        pic: lap.pic.nama,
        info: lap.info || lap.komentar || null,
        countermeasure: lap.countermeasure || null,
        mpCost: costs.mpCost,
        spCost: costs.spCost,
        totalCost: costs.totalCost,
        checksheet: lap.checksheet ? {
          approvals: lap.checksheet.approvals || []
        } : null
      }
    })

    return NextResponse.json({
      mold,
      history,
      summary: {
        totalActions: history.length,
        totalCost,
      },
    })
  } catch (error) {
    console.error('API Error in GET /api/mold-book/[noMold]/history:', error)
    return NextResponse.json({ error: 'Gagal memuat riwayat mold' }, { status: 500 })
  }
}
