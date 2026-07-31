import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

    let checksheet = await prisma.checksheet.findUnique({
      where: { laporanId: id },
    })

    if (!checksheet) {
      checksheet = await prisma.checksheet.create({
        data: {
          laporanId: id,
          checklist: checklist || {},
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
          checklist: checklist || {},
          jamMulai: jamMulai || null,
          jamSelesai: jamSelesai || null,
          jumlahOrang: Number(jumlahOrang) || 1,
        },
      })
    }

    // Sync info dan countermeasure kembali ke Laporan agar muncul di riwayat dan pencarian
    const items = checklist?.items || {}
    let extractedInfo = items['cm_0'] || undefined
    let extractedCountermeasure = items['cm_2'] || undefined
    
    // Jika OH MOLD, mungkin tidak ada cm_0, kita ambil catatan jika perlu, tapi Laporan awalnya mungkin sudah ada info. 
    // Kita update hanya jika ada nilainya.
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

    return NextResponse.json({ ok: true, checksheetId })
  } catch (error) {
    console.error('API Error in POST /api/laporan/[id]/checksheet:', error)
    return NextResponse.json({ error: 'Gagal menyimpan checksheet' }, { status: 500 })
  }
}
