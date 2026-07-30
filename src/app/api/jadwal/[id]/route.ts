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

    const userRole = ((session?.user as any)?.role || '').toUpperCase()
    if (!['GL', 'CL', 'ADM', 'SUPER_ADMIN', 'SUPERADMIN'].includes(userRole)) {
      return NextResponse.json({ error: 'Unauthorized. Hanya GL, CL, dan ADM yang berhak menghapus jadwal.' }, { status: 403 })
    }

    const { id: idParam } = await params
    const id = Number(idParam)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 })
    }

    const existing = await prisma.jadwalMingguan.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Jadwal tidak ditemukan.' }, { status: 404 })
    }

    await prisma.jadwalMingguan.delete({
      where: { id },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('API Error in DELETE /api/jadwal/[id]:', error)
    return NextResponse.json({ error: 'Gagal menghapus jadwal' }, { status: 500 })
  }
}
