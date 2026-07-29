import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/notifikasi - ambil notifikasi untuk user yang login
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = Number(session.user.id)

    const notifs = await prisma.notifikasi.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 30,
    })

    const unreadCount = notifs.filter((n: any) => !n.dibaca).length

    return NextResponse.json({ notifs, unreadCount })
  } catch (error) {
    console.error('GET /api/notifikasi error:', error)
    return NextResponse.json({ error: 'Gagal mengambil notifikasi' }, { status: 500 })
  }
}

// PATCH /api/notifikasi - tandai semua sudah dibaca
export async function PATCH() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = Number(session.user.id)

    await prisma.notifikasi.updateMany({
      where: { userId, dibaca: false },
      data: { dibaca: true },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('PATCH /api/notifikasi error:', error)
    return NextResponse.json({ error: 'Gagal update notifikasi' }, { status: 500 })
  }
}
