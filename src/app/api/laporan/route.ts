import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Factory, Shift, JenisLaporan } from '@prisma/client'

function toPrismaShift(s: string | null | undefined): Shift | null {
  if (!s) return null
  const clean = s.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
  if (clean === 'SHIFTA' || clean === 'A') return 'Shift_A'
  if (clean === 'SHIFTB' || clean === 'B') return 'Shift_B'
  return 'Nonshift'
}

function toPrismaJenis(j: string | null | undefined): JenisLaporan {
  if (!j) return 'LAINNYA'
  const clean = j.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
  if (clean === 'OHMOLD') return 'OH_MOLD'
  if (clean === 'BM') return 'BM'
  if (clean === 'IM') return 'IM'
  if (clean === 'PM') return 'PM'
  if (clean === 'BMCHUCK') return 'BM_CHUCK'
  return 'LAINNYA'
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const tanggalParam = searchParams.get('tanggal')
    const factoryParam = searchParams.get('factory')
    const searchParam = searchParams.get('search')
    const belumCSParam = searchParams.get('belumCS') === 'true'

    const whereClause: any = {}

    if (tanggalParam) {
      const d = new Date(tanggalParam)
      const startOfDay = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0))
      const endOfDay = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999))
      whereClause.tanggal = {
        gte: startOfDay,
        lte: endOfDay,
      }
    }

    if (factoryParam && factoryParam !== 'all') {
      whereClause.factory = factoryParam as Factory
    }

    if (belumCSParam) {
      whereClause.checksheet = {
        is: null,
      }
    }

    if (searchParam) {
      whereClause.OR = [
        { noMold: { contains: searchParam } },
        { part: { contains: searchParam } },
        { info: { contains: searchParam } },
        { countermeasure: { contains: searchParam } },
        {
          pic: {
            nama: { contains: searchParam },
          },
        },
      ]
    }

    const laporanList = await prisma.laporan.findMany({
      where: whereClause,
      include: {
        pic: {
          select: {
            id: true,
            nama: true,
            role: true,
          },
        },
        checksheet: {
          include: {
            approvals: true,
          },
        },
      },
      orderBy: [
        { tanggal: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    return NextResponse.json(laporanList)
  } catch (error) {
    console.error('API Error in GET /api/laporan:', error)
    return NextResponse.json({ error: 'Gagal mengambil data laporan' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      noMold,
      jenis,
      factory,
      shift,
      picId,
      tanggal,
      part,
      komentar,
      coreActual,
      cavActual,
      heaterActual,
      shotCycle,
      shotMonth,
      info,
      countermeasure,
      jamMulai,
      jamSelesai,
      picList, // array nama-nama PIC pendamping
      jadwalId, // ID jadwal mingguan jika ada
    } = body

    if (!noMold || !jenis || !factory || !picId || !tanggal) {
      return NextResponse.json({ error: 'Field wajib tidak lengkap' }, { status: 400 })
    }

    // Hitung jumlah orang berdasarkan PIC terpilih (minimal 1)
    const picPendamping = Array.isArray(picList) ? picList : []
    const jumlahOrang = Math.max(1, picPendamping.length)

    const result = await prisma.$transaction(async (tx) => {
      // 1. Simpan Laporan
      const laporan = await tx.laporan.create({
        data: {
          noMold,
          jenis: toPrismaJenis(jenis),
          factory: factory as Factory,
          shift: toPrismaShift(shift),
          picId: Number(picId),
          tanggal: new Date(tanggal),
          part,
          komentar,
          coreActual,
          cavActual,
          heaterActual,
          shotCycle,
          shotMonth,
          info,
          countermeasure,
        },
      })

      // 2. Simpan Checksheet kosong (kalkulasi MP Cost awal dengan tarif 89.595)
      const checksheet = await tx.checksheet.create({
        data: {
          laporanId: laporan.id,
          jamMulai: jamMulai || null,
          jamSelesai: jamSelesai || null,
          jumlahOrang,
          tarifPerJam: 89595, // standard tarif per jam baru sesuai request
          checklist: {
            picNames: picPendamping,
            items: {}, // placeholder checklist OK/NG per item
          },
        },
      })

      // 3. Init Approval Rows (PIC -> TL -> GL -> CL -> ADM)
      const roles = ['PIC', 'TL', 'GL', 'CL', 'ADM'] as const
      await tx.checksheetApproval.createMany({
        data: roles.map((role) => ({
          checksheetId: checksheet.id,
          role,
          userId: null,
          signedAt: null,
        })),
      })

      // 4. Update status jadwal mingguan (menjadi Proses_Approval karena menunggu approval sampai ADM)
      if (jadwalId) {
        await tx.jadwalMingguan.update({
          where: { id: Number(jadwalId) },
          data: { status: 'Proses_Approval' as any },
        })
      } else {
        // Cari jadwal mingguan dengan mold yang sama dan berstatus Belum_Dikerjakan
        const lDate = new Date(tanggal)
        const openSchedules = await tx.jadwalMingguan.findMany({
          where: {
            noMold: noMold,
            status: 'Belum_Dikerjakan' as any
          }
        })
        for (const sched of openSchedules) {
          if (!sched.tanggalRencana) continue
          const sDate = new Date(sched.tanggalRencana)
          const diffDays = Math.abs(lDate.getTime() - sDate.getTime()) / (1000 * 3600 * 24)
          if ((sDate.getMonth() === lDate.getMonth() && sDate.getFullYear() === lDate.getFullYear()) || diffDays <= 14) {
            await tx.jadwalMingguan.update({
              where: { id: sched.id },
              data: { status: 'Proses_Approval' as any }
            })
          }
        }
      }

      return laporan
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('API Error in POST /api/laporan:', error)
    return NextResponse.json({ error: 'Gagal menyimpan laporan' }, { status: 500 })
  }
}
