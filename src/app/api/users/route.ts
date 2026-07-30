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

    // Jika membuat selain PIC, harus SUPER_ADMIN atau ADM
    const userRole = (session.user as any)?.role
    if (role !== 'PIC' && !['SUPER_ADMIN', 'SUPERADMIN', 'ADM'].includes(userRole)) {
      return NextResponse.json({ error: 'Unauthorized. Hanya Super Admin atau Admin yang diizinkan membuat role ini.' }, { status: 403 })
    }

    if (!nama || !username || !password || !role) {
      return NextResponse.json({ error: 'Data wajib belum lengkap (Nama, Username, Password, Role).' }, { status: 400 })
    }

    // Cek ketersediaan username (case insensitive check jika perlu, tapi bersihkan dulu spasi)
    const cleanUsername = username.trim()
    const existing = await prisma.user.findUnique({ where: { username: cleanUsername } })
    if (existing) {
      return NextResponse.json({ error: `Username "${cleanUsername}" sudah digunakan oleh akun lain.` }, { status: 400 })
    }

    const hash = await bcrypt.hash(String(password).trim(), 10)
    const cleanRole = role === 'SUPERADMIN' ? 'SUPER_ADMIN' : role

    const newUser = await prisma.user.create({
      data: {
        nama: String(nama).trim(),
        username: cleanUsername,
        passwordHash: hash,
        role: cleanRole as any,
        factory: 'F2', // Default factory
        nik: nik ? String(nik).trim() : null,
        shift: (shift as any) || 'Nonshift',
        tempatLahir: tempatLahir ? String(tempatLahir).trim() : null,
        tanggalLahir: tanggalLahir && !isNaN(Date.parse(String(tanggalLahir))) ? new Date(tanggalLahir) : null,
      }
    })

    // Log to AuditLog (safely handle numeric ID conversion from string tokens)
    try {
      const sessionId = Number((session.user as any)?.id)
      await prisma.auditLog.create({
        data: {
          userId: !isNaN(sessionId) && sessionId > 0 ? sessionId : null,
          aktivitas: `User baru ditambahkan: ${nama} (${role})`
        }
      })
    } catch (logErr) {
      console.error('Audit log warning:', logErr)
    }

    return NextResponse.json({ ok: true, userId: newUser.id })
  } catch (error: any) {
    console.error('API Error in POST /api/users:', error)
    return NextResponse.json({ error: `Gagal membuat akun: ${error?.message || 'Terjadi kesalahan database'}` }, { status: 500 })
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
