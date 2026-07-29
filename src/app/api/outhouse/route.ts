import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const list = await prisma.outhouse.findMany({
      orderBy: { nama: 'asc' },
    })
    return NextResponse.json(list)
  } catch (error) {
    console.error('GET /api/outhouse error:', error)
    return NextResponse.json({ error: 'Gagal memuat data outhouse' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { nama, alamat, kota } = body
    if (!nama) return NextResponse.json({ error: 'Nama outhouse wajib diisi.' }, { status: 400 })

    const outhouse = await prisma.outhouse.create({
      data: { nama: nama.trim(), alamat: alamat?.trim() || null, kota: kota?.trim() || null },
    })
    return NextResponse.json(outhouse, { status: 201 })
  } catch (error) {
    console.error('POST /api/outhouse error:', error)
    return NextResponse.json({ error: 'Gagal menyimpan outhouse' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { id, nama, alamat, kota } = body
    if (!id) return NextResponse.json({ error: 'ID outhouse diperlukan.' }, { status: 400 })

    const outhouse = await prisma.outhouse.update({
      where: { id: Number(id) },
      data: { nama: nama?.trim(), alamat: alamat?.trim() || null, kota: kota?.trim() || null },
    })
    return NextResponse.json(outhouse)
  } catch (error) {
    console.error('PUT /api/outhouse error:', error)
    return NextResponse.json({ error: 'Gagal update outhouse' }, { status: 500 })
  }
}
