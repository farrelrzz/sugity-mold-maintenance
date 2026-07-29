import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get('query') || ''

    if (!query || query.trim().length < 3) {
      return NextResponse.json({ error: 'Ketik minimal 3 huruf untuk mencari.' }, { status: 400 })
    }

    const kataDicari = query.trim().toLowerCase()

    // Fetch matching laporan
    const cocok = await prisma.laporan.findMany({
      where: {
        OR: [
          { info: { contains: kataDicari } },
          { countermeasure: { contains: kataDicari } },
          { komentar: { contains: kataDicari } },
        ],
      },
      include: {
        pic: { select: { nama: true } },
      },
      orderBy: {
        tanggal: 'desc',
      },
    })

    // Kelompokkan per nomor mold
    const kelompok: Record<string, { noMold: string; part: string; items: any[] }> = {}

    cocok.forEach((lap) => {
      const no = lap.noMold || '(tanpa nomor)'
      if (!kelompok[no]) {
        kelompok[no] = {
          noMold: no,
          part: lap.part || '-',
          items: [],
        }
      }
      kelompok[no].items.push({
        id: lap.id,
        tanggal: lap.tanggal.toISOString().slice(0, 10),
        jenis: lap.jenis,
        pic: lap.pic.nama,
        info: lap.info || lap.komentar || null,
        countermeasure: lap.countermeasure || null,
      })
    })

    // Sort by count descending
    const daftarKelompok = Object.values(kelompok).sort((a, b) => b.items.length - a.items.length)

    return NextResponse.json({
      query: query.trim(),
      groups: daftarKelompok,
      totalCount: cocok.length,
    })
  } catch (error) {
    console.error('API Error in GET /api/laporan/search-problem:', error)
    return NextResponse.json({ error: 'Gagal mencari riwayat problem' }, { status: 500 })
  }
}
