import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any)?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Hanya Super Admin yang berwenang memvalidasi reset password.' }, { status: 403 })
    }

    const { userId, action } = await req.json()
    if (!userId || !['APPROVE', 'REJECT', 'RESET'].includes(action)) {
      return NextResponse.json({ error: 'Parameter action tidak valid.' }, { status: 400 })
    }

    const targetUser = await prisma.user.findUnique({ where: { id: Number(userId) } })
    if (!targetUser) {
      return NextResponse.json({ error: 'Akun tidak ditemukan' }, { status: 404 })
    }

    const newStatus = action === 'APPROVE' ? 'APPROVED' : 'NONE'

    const updated = await prisma.user.update({
      where: { id: Number(userId) },
      data: { resetStatus: newStatus }
    })

    const adminId = (session.user as any)?.id || Number(userId)
    const label = action === 'APPROVE' ? 'menyetujui' : 'menolak/membatalkan'
    
    // Catat di Audit Log
    try {
      await prisma.auditLog.create({
        data: {
          userId: Number(adminId),
          aktivitas: `Super Admin ${label} permintaan reset password untuk user: ${targetUser.nama} (${targetUser.username})`
        }
      })
    } catch (e) {
      console.error('Failed logging audit:', e)
    }

    return NextResponse.json({
      ok: true,
      message: `Permintaan reset password user ${targetUser.username} telah ${action === 'APPROVE' ? 'Disetujui (Approved)' : 'Ditolak/Dibatalkan'}.`,
      user: { id: updated.id, resetStatus: updated.resetStatus }
    })
  } catch (error: any) {
    console.error('Error in /api/users/reset-approval:', error)
    return NextResponse.json({ error: 'Gagal memproses persetujuan reset password.' }, { status: 500 })
  }
}
