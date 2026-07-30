import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Factory, Shift } from '@prisma/client'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get('query') || ''
    const limitParam = searchParams.get('limit')

    // Build where clause: support startsWith prefix (e.g., query="N" → all molds starting with N)
    const whereClause = query
      ? {
          OR: [
            { noMold: { contains: query } },
            { part: { contains: query } },
            { model: { contains: query } },
            { customer: { contains: query } },
          ],
        }
      : {}

    // Include outhouse in GET
    const molds = await prisma.moldBook.findMany({
      where: whereClause,
      ...(limitParam ? { take: Number(limitParam) } : {}),
      include: {
        outhouse: true,
      },
      orderBy: {
        noMold: 'asc',
      },
    })

    return NextResponse.json(molds, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120',
      },
    })
  } catch (error) {
    console.error('API Error in GET /api/mold-book:', error)
    return NextResponse.json({ error: 'Gagal mengambil data mold' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { role } = session.user as any
    if (role !== 'ADM' && role !== 'GL' && role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Hanya Admin, Group Leader, atau Super Admin yang dapat menambah mold baru.' }, { status: 403 })
    }

    const body = await req.json()
    const {
      noMold,
      mc,
      part,
      factory,
      outhouseId,
      lokasiMold,
      dimensiW,
      dimensiH,
      dimensiT,
      tonase,
      customer,
      model,
      coreStd,
      cavStd,
      heaterStd,
      fotoMold,
      fotoProduk,
    } = body

    if (!noMold || !part || !factory) {
      return NextResponse.json({ error: 'Nomor Mold, Nama Part, dan Factory wajib diisi.' }, { status: 400 })
    }

    // Cek apakah mold sudah terdaftar
    const existing = await prisma.moldBook.findUnique({
      where: { noMold },
    })

    if (existing) {
      return NextResponse.json({ error: 'Nomor Mold ini sudah terdaftar.' }, { status: 400 })
    }

    const mold = await prisma.moldBook.create({
      data: {
        noMold,
        mc: mc || null,
        part,
        factory: factory as Factory,
        outhouseId: outhouseId ? Number(outhouseId) : null,
        lokasiMold: lokasiMold || null,
        dimensiW: dimensiW || null,
        dimensiH: dimensiH || null,
        dimensiT: dimensiT || null,
        tonase: tonase || null,
        customer: customer || null,
        model: model || null,
        coreStd: coreStd || null,
        cavStd: cavStd || null,
        heaterStd: Array.isArray(heaterStd) ? heaterStd : [],
        fotoMold: Array.isArray(fotoMold) ? fotoMold : [],
        fotoProduk: Array.isArray(fotoProduk) ? fotoProduk : [],
      },
    })

    return NextResponse.json(mold, { status: 201 })
  } catch (error) {
    console.error('API Error in POST /api/mold-book:', error)
    return NextResponse.json({ error: 'Gagal menyimpan data mold baru' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { role } = session.user as any
    if (role !== 'ADM' && role !== 'GL' && role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Hanya Admin, Group Leader, atau Super Admin yang dapat memperbarui mold.' }, { status: 403 })
    }

    const body = await req.json()
    const {
      noMold,
      mc,
      part,
      factory,
      outhouseId,
      lokasiMold,
      dimensiW,
      dimensiH,
      dimensiT,
      tonase,
      customer,
      model,
      coreStd,
      cavStd,
      heaterStd,
      fotoMold,
      fotoProduk,
    } = body

    if (!noMold) {
      return NextResponse.json({ error: 'Nomor Mold wajib ditentukan.' }, { status: 400 })
    }

    const existing = await prisma.moldBook.findUnique({
      where: { noMold },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Mold tidak ditemukan.' }, { status: 404 })
    }

    const updated = await prisma.moldBook.update({
      where: { noMold },
      data: {
        mc: mc !== undefined ? mc : existing.mc,
        part: part !== undefined ? part : existing.part,
        factory: factory !== undefined ? (factory as Factory) : existing.factory,
        outhouseId: outhouseId !== undefined ? (outhouseId ? Number(outhouseId) : null) : existing.outhouseId,
        lokasiMold: lokasiMold !== undefined ? lokasiMold : existing.lokasiMold,
        dimensiW: dimensiW !== undefined ? dimensiW : existing.dimensiW,
        dimensiH: dimensiH !== undefined ? dimensiH : existing.dimensiH,
        dimensiT: dimensiT !== undefined ? dimensiT : existing.dimensiT,
        tonase: tonase !== undefined ? tonase : existing.tonase,
        customer: customer !== undefined ? customer : existing.customer,
        model: model !== undefined ? model : existing.model,
        coreStd: coreStd !== undefined ? coreStd : existing.coreStd,
        cavStd: cavStd !== undefined ? cavStd : existing.cavStd,
        heaterStd: (heaterStd !== undefined ? (Array.isArray(heaterStd) ? heaterStd : []) : existing.heaterStd) as any,
        fotoMold: fotoMold !== undefined ? (Array.isArray(fotoMold) ? fotoMold : []) : (existing.fotoMold || []),
        fotoProduk: fotoProduk !== undefined ? (Array.isArray(fotoProduk) ? fotoProduk : []) : (existing.fotoProduk || []),
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('API Error in PUT /api/mold-book:', error)
    return NextResponse.json({ error: 'Gagal memperbarui data mold' }, { status: 500 })
  }
}
