import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q') || ''

    const spareparts = await prisma.katalogSparepart.findMany({
      where: {
        nama: { contains: q }
      },
      orderBy: { nama: 'asc' }
    })

    return NextResponse.json(spareparts, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120',
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { nama, hargaSatuan } = await req.json()

    if (!nama || hargaSatuan === undefined) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 })
    }

    const existing = await prisma.katalogSparepart.findUnique({
      where: { nama: nama.trim() }
    })

    if (existing) {
      return NextResponse.json({ error: 'Sparepart dengan nama tersebut sudah ada' }, { status: 400 })
    }

    const newSparepart = await prisma.katalogSparepart.create({
      data: {
        nama: nama.trim(),
        hargaSatuan: Number(hargaSatuan)
      }
    })

    return NextResponse.json(newSparepart, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
