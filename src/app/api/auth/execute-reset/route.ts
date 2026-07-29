import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  try {
    const { userId, username, newPassword } = await req.json()

    if (!newPassword || newPassword.length < 4) {
      return NextResponse.json({ error: 'Password baru minimal 4 karakter.' }, { status: 400 })
    }

    // Cari user
    const user = await prisma.user.findFirst({
      where: userId ? { id: Number(userId) } : { username: String(username).toLowerCase().trim() }
    })

    if (!user) {
      return NextResponse.json({ error: 'User tidak ditemukan.' }, { status: 404 })
    }

    if (user.resetStatus !== 'APPROVED') {
      return NextResponse.json({ error: 'Permintaan ganti password ini belum disetujui (Approved) oleh Super Admin.' }, { status: 403 })
    }

    const hash = await bcrypt.hash(newPassword, 10)

    // Update password dan reset kembali status ke NONE
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hash,
        resetStatus: 'NONE',
        resetOtp: null
      }
    })

    // Log audit system jika diperlukan
    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          aktivitas: `User mengubah password secara mandiri (setelah approve Super Admin)`
        }
      })
    } catch (e) {
      console.error('Failed audit log:', e)
    }

    return NextResponse.json({ ok: true, message: 'Password berhasil diperbarui!' })
  } catch (err: any) {
    console.error('Error in /api/auth/execute-reset:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan saat menyimpan password baru.' }, { status: 500 })
  }
}
