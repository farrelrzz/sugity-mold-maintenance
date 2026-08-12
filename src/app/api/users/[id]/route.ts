import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    const { id } = await params
    const userId = parseInt(id)
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 })
    }

    const userToDelete = await prisma.user.findUnique({ where: { id: userId } })
    if (!userToDelete) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })
    }

    const userRole = (session?.user as any)?.role
    if (!['SUPER_ADMIN', 'SUPERADMIN', 'ADM'].includes(userRole)) {
      if (userRole === 'PIC' && userToDelete.role === 'PIC') {
        // PIC diizinkan menghapus PIC (terutama untuk hapus PIC temporary)
      } else {
        return NextResponse.json({ error: 'Unauthorized. Hanya Super Admin & Admin yang diizinkan.' }, { status: 403 })
      }
    }



    const deletedUser = await prisma.user.delete({
      where: { id: userId }
    })

    try {
      const sessionId = Number((session?.user as any)?.id)
      await prisma.auditLog.create({
        data: {
          userId: !isNaN(sessionId) && sessionId > 0 ? sessionId : null,
          aktivitas: `User dihapus: ${deletedUser.nama} (${deletedUser.username})`
        }
      })
    } catch (logErr) {
      console.error('AuditLog warning:', logErr)
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('API Error in DELETE /api/users/[id]:', error)
    return NextResponse.json({ error: `Gagal menghapus akun: ${error?.message || 'Terjadi kesalahan'}` }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    const userRole = (session?.user as any)?.role
    if (!session || !['SUPER_ADMIN', 'SUPERADMIN', 'ADM'].includes(userRole)) {
      return NextResponse.json({ error: 'Unauthorized. Hanya Super Admin & Admin yang dapat mengedit akun.' }, { status: 403 })
    }

    const { id } = await params
    const userId = parseInt(id)
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 })
    }

    const { nama, username, role, shift, nik, password, tempatLahir, tanggalLahir, signature } = await req.json()

    if (!nama || !username || !role) {
      return NextResponse.json({ error: 'Data wajib belum lengkap.' }, { status: 400 })
    }

    const cleanRole = role === 'SUPERADMIN' ? 'SUPER_ADMIN' : role
    const updateData: any = {
      nama: nama.trim(),
      username: username.trim(),
      role: cleanRole as any,
      shift: (shift as any) || 'Nonshift',
      nik: nik ? String(nik).trim() : null,
      tempatLahir: tempatLahir ? String(tempatLahir).trim() : null,
      tanggalLahir: tanggalLahir && !isNaN(Date.parse(tanggalLahir)) ? new Date(tanggalLahir) : null,
    }

    if (password && String(password).trim().length > 0) {
      updateData.passwordHash = await bcrypt.hash(String(password).trim(), 10)
    }

    if (signature !== undefined) {
      updateData.signature = signature || null
    }

    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    })

    try {
      const sessionId = Number((session?.user as any)?.id)
      await prisma.auditLog.create({
        data: {
          userId: !isNaN(sessionId) && sessionId > 0 ? sessionId : null,
          aktivitas: `User diupdate: ${nama} (${username})`
        }
      })
    } catch (logErr) {
      console.error('AuditLog warning:', logErr)
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('API Error in PATCH /api/users/[id]:', error)
    return NextResponse.json({ error: `Gagal mengedit akun: ${error?.message || 'Terjadi kesalahan'}` }, { status: 500 })
  }
}
