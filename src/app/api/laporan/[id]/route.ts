import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: idParam } = await params
    const id = Number(idParam)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 })
    }

    // Cari laporan
    const laporan = await prisma.laporan.findUnique({
      where: { id },
    })

    if (!laporan) {
      return NextResponse.json({ error: 'Laporan tidak ditemukan' }, { status: 404 })
    }

    // Otorisasi: Hanya ADM, GL, atau PIC pembuat laporan yang bisa menghapus
    const role = session.user.role
    const isCreator = laporan.picId === Number(session.user.id)

    if (role !== 'ADM' && role !== 'GL' && !isCreator) {
      return NextResponse.json({ error: 'Anda tidak memiliki akses untuk menghapus laporan ini' }, { status: 403 })
    }

    await prisma.laporan.delete({
      where: { id },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('API Error in DELETE /api/laporan/[id]:', error)
    return NextResponse.json({ error: 'Gagal menghapus laporan' }, { status: 500 })
  }
}
