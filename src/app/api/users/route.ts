import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    const { nama, nik, tempatLahir, tanggalLahir, username, password, role, shift } = await req.json()

    // Jika membuat selain PIC, harus SUPER_ADMIN
    if (role !== 'PIC' && (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Hanya Super Admin yang diizinkan membuat role ini.' }, { status: 403 })
    }

    if (!nama || !username || !password || !role) {
      return NextResponse.json({ error: 'Data wajib belum lengkap.' }, { status: 400 })
    }

    // Cek ketersediaan username
    const existing = await prisma.user.findUnique({ where: { username } })
    if (existing) {
      return NextResponse.json({ error: 'Username sudah digunakan.' }, { status: 400 })
    }

    const hash = await bcrypt.hash(password, 10)

    const newUser = await prisma.user.create({
      data: {
        nama,
        username,
        passwordHash: hash,
        role,
        factory: 'F2', // Default factory
        nik: nik || null,
        shift: shift || 'Nonshift',
        tempatLahir: tempatLahir || null,
        tanggalLahir: tanggalLahir ? new Date(tanggalLahir) : null,
      }
    })

    // Log to AuditLog
    await prisma.auditLog.create({
      data: {
        userId: (session.user as any).id,
        aktivitas: `User baru ditambahkan: ${nama} (${role})`
      }
    })

    return NextResponse.json({ ok: true, userId: newUser.id })
  } catch (error) {
    console.error('API Error in POST /api/users:', error)
    return NextResponse.json({ error: 'Gagal membuat akun' }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized. Silakan login terlebih dahulu.' }, { status: 401 })
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        nama: true,
        username: true,
        role: true,
        shift: true,
        nik: true,
        resetStatus: true,
      },
      orderBy: { id: 'asc' }
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error('API Error in GET /api/users:', error)
    return NextResponse.json({ error: 'Gagal mengambil data akun' }, { status: 500 })
  }
}
