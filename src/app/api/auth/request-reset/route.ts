import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const { username } = await req.json()

    if (!username || !username.trim()) {
      return NextResponse.json({ error: 'Username wajib diisi.' }, { status: 400 })
    }

    const cleanedUser = username.trim()
    const user = await prisma.user.findUnique({
      where: {
        username: cleanedUser
      }
    })

    if (!user) {
      // Kita kembalikan pesan spesifik agar mudah diketahui jika salah ketik username
      return NextResponse.json({ error: `Akun dengan username "${cleanedUser}" tidak ditemukan di database.` }, { status: 404 })
    }

    const currentStatus = (user as any).resetStatus || 'NONE'

    // 1. Jika sudah disetujui Super Admin -> izinkan ganti password mandiri
    if (currentStatus === 'APPROVED') {
      return NextResponse.json({
        status: 'APPROVED',
        userId: user.id,
        username: user.username,
        nama: user.nama,
        message: '🎉 Permintaan reset password Anda telah disetujui oleh Super Admin! Silakan atur password baru Anda di bawah ini.'
      })
    }

    // 2. Jika sudah berstatus PENDING -> beritahu sedang menunggu
    if (currentStatus === 'PENDING') {
      return NextResponse.json({
        status: 'PENDING',
        userId: user.id,
        username: user.username,
        nama: user.nama,
        message: '⏳ Permintaan reset password untuk akun ini sedang dalam status PENDING APPROVAL oleh Super Admin. Silakan hubungi Super Admin/Leader untuk penyetujuan.'
      })
    }

    // 3. Jika belum (NONE) -> Ajukan permintaan baru ke Super Admin
    await prisma.user.update({
      where: { id: user.id },
      data: { resetStatus: 'PENDING' } as any
    })

    // Kirim notifikasi sistem ke semua SUPER_ADMIN agar langsung tau ada pengajuan
    try {
      const superAdmins = await prisma.user.findMany({
        where: { role: 'SUPER_ADMIN' },
        select: { id: true }
      })
      if (superAdmins.length > 0) {
        const notifData = superAdmins.map((admin) => ({
          userId: admin.id,
          judul: '🔑 Reset Password Requested',
          pesan: `Permintaan Reset Password dari user: ${user.nama} (${user.username}). Mohon di-approve di Kelola Akun.`,
          tipe: 'INFO' as const,
          dibaca: false
        }))
        await prisma.notifikasi.createMany({ data: notifData })
      }
    } catch (notifErr) {
      console.error('Gagal kirim notif admin:', notifErr)
    }

    return NextResponse.json({
      status: 'PENDING_CREATED',
      userId: user.id,
      username: user.username,
      nama: user.nama,
      message: '🚀 Permintaan reset password berhasil dikirim ke Super Admin (Status: PENDING APPROVAL). Silakan tunggu Super Admin menyetujui, lalu periksa kembali username Anda di sini untuk mengatur password baru.'
    })
  } catch (err: any) {
    console.error('Error in /api/auth/request-reset:', err)
    return NextResponse.json({ error: `Gagal memproses (Error: ${err.message || String(err)})` }, { status: 500 })
  }
}
