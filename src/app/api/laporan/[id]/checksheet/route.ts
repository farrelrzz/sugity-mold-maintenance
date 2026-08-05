import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { compactJsonPayload, cleanTextPayload, autoPruneOldLogs } from '@/lib/optimizeStorage'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params
    const id = Number(idParam)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID laporan tidak valid' }, { status: 400 })
    }

    const laporan = await prisma.laporan.findUnique({
      where: { id },
      include: {
        pic: {
          select: {
            id: true,
            nama: true,
            role: true,
            signature: true,
          },
        },
        checksheet: {
          include: {
            spareparts: true,
            foto: true,
            approvals: {
              include: {
                user: {
                  select: {
                    nama: true,
                    signature: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!laporan) {
      return NextResponse.json({ error: 'Laporan tidak ditemukan' }, { status: 404 })
    }

    // Ambil data spesifikasi mold dari moldBook
    const moldData = await prisma.moldBook.findUnique({
      where: { noMold: laporan.noMold },
    })

    return NextResponse.json({
      ...laporan,
      moldData,
    })
  } catch (error) {
    console.error('API Error in GET /api/laporan/[id]/checksheet:', error)
    return NextResponse.json({ error: 'Gagal memuat checksheet' }, { status: 500 })
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params
    const id = Number(idParam)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID laporan tidak valid' }, { status: 400 })
    }

    const body = await req.json()
    const {
      checklist,
      jamMulai,
      jamSelesai,
      jumlahOrang,
      spareparts,
      foto,
    } = body

    const optimizedChecklist = compactJsonPayload(checklist) || {}

    let checksheet = await prisma.checksheet.findUnique({
      where: { laporanId: id },
    })

    if (!checksheet) {
      checksheet = await prisma.checksheet.create({
        data: {
          laporanId: id,
          checklist: optimizedChecklist,
          jamMulai: jamMulai || null,
          jamSelesai: jamSelesai || null,
          jumlahOrang: Number(jumlahOrang) || 1,
          tarifPerJam: 89595,
        },
      })
    } else {
      checksheet = await prisma.checksheet.update({
        where: { id: checksheet.id },
        data: {
          checklist: optimizedChecklist,
          jamMulai: jamMulai || null,
          jamSelesai: jamSelesai || null,
          jumlahOrang: Number(jumlahOrang) || 1,
        },
      })
    }

    // Sync info dan countermeasure kembali ke Laporan agar muncul di riwayat dan pencarian (dioptimasi spasi dan teks)
    const items = checklist?.items || {}
    let extractedInfo = cleanTextPayload(items['cm_0']) || undefined
    let extractedCountermeasure = cleanTextPayload(items['cm_2']) || undefined
    
    if (extractedInfo !== undefined || extractedCountermeasure !== undefined) {
      await prisma.laporan.update({
        where: { id },
        data: {
          ...(extractedInfo !== undefined && { info: extractedInfo }),
          ...(extractedCountermeasure !== undefined && { countermeasure: extractedCountermeasure }),
        },
      })
    }

    const checksheetId = checksheet.id

    await prisma.checksheetSparepart.deleteMany({
      where: { checksheetId },
    })

    if (Array.isArray(spareparts) && spareparts.length > 0) {
      await prisma.checksheetSparepart.createMany({
        data: spareparts.map((sp: any) => ({
          checksheetId,
          namaSparepart: sp.namaSparepart,
          qty: Number(sp.qty) || 1,
          hargaSatuan: Number(sp.hargaSatuan) || 0,
        })),
      })
    }

    await prisma.checksheetFoto.deleteMany({
      where: { checksheetId },
    })

    if (Array.isArray(foto) && foto.length > 0) {
      await prisma.checksheetFoto.createMany({
        data: foto.map((filePath: string) => ({
          checksheetId,
          filePath,
        })),
      })
    }

    // Trigger pembersihan log sampah di belakang layar (non-blocking) agar TiDB Cloud selalu awet & hemat
    autoPruneOldLogs(prisma).catch(() => {})

    return NextResponse.json({ ok: true, checksheetId })
  } catch (error) {
    console.error('API Error in POST /api/laporan/[id]/checksheet:', error)
    return NextResponse.json({ error: 'Gagal menyimpan checksheet' }, { status: 500 })
  }
}
