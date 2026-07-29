import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function GET(req: Request) {
  try {
    // Pilihan 1: Ubah sesi login saat ini menjadi SUPER_ADMIN
    const session = await getServerSession(authOptions)
    if (session?.user?.username) {
      await prisma.user.update({
        where: { username: session.user.username },
        data: { role: 'SUPER_ADMIN' }
      })
      return NextResponse.json({ message: `Sukses! Akun Anda (${session.user.username}) telah diubah menjadi SUPER_ADMIN. Silakan logout dan login kembali untuk me-refresh sesi.` })
    }

    // Pilihan 2: Jika belum login, buat akun superadmin default
    const hash = await bcrypt.hash('sugity123', 10)
    await prisma.user.upsert({
      where: { username: 'superadmin' },
      update: {
        role: 'SUPER_ADMIN',
        passwordHash: hash
      },
      create: {
        nama: 'Super Admin',
        username: 'superadmin',
        passwordHash: hash,
        role: 'SUPER_ADMIN',
        factory: 'F2'
      }
    })

    return NextResponse.json({ message: 'Sukses! Akun default telah dibuat. Gunakan Username: superadmin, Password: sugity123' })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Gagal' }, { status: 500 })
  }
}
