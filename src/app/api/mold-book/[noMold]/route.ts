import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function DELETE(req: Request, { params }: { params: Promise<{ noMold: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { role } = session.user
    if (role !== 'ADM' && role !== 'GL') {
      return NextResponse.json({ error: 'Hanya Admin atau Group Leader yang dapat menghapus mold.' }, { status: 403 })
    }

    const { noMold } = await params
    const decodedNoMold = decodeURIComponent(noMold)

    const existing = await prisma.moldBook.findUnique({
      where: { noMold: decodedNoMold },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Mold tidak ditemukan.' }, { status: 404 })
    }

    await prisma.moldBook.delete({
      where: { noMold: decodedNoMold },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('API Error in DELETE /api/mold-book/[noMold]:', error)
    return NextResponse.json({ error: 'Gagal menghapus data mold' }, { status: 500 })
  }
}
