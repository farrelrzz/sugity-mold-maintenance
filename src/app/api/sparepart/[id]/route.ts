import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { nama, hargaSatuan } = await req.json()

    if (!nama || hargaSatuan === undefined) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 })
    }

    const existing = await prisma.katalogSparepart.findUnique({
      where: { nama: nama.trim() }
    })

    if (existing && existing.id !== parseInt(id, 10)) {
      return NextResponse.json({ error: 'Sparepart dengan nama tersebut sudah ada' }, { status: 400 })
    }

    const updated = await prisma.katalogSparepart.update({
      where: { id: parseInt(id, 10) },
      data: {
        nama: nama.trim(),
        hargaSatuan: Number(hargaSatuan)
      }
    })

    return NextResponse.json(updated)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    await prisma.katalogSparepart.delete({
      where: { id: parseInt(id, 10) }
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
