import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Hanya Super Admin yang diizinkan.' }, { status: 403 })
    }

    const { id } = await params
    const userId = parseInt(id)
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 })
    }

    const deletedUser = await prisma.user.delete({
      where: { id: userId }
    })

    await prisma.auditLog.create({
      data: {
        userId: (session.user as any).id,
        aktivitas: `User dihapus: ${deletedUser.nama} (${deletedUser.username})`
      }
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('API Error in DELETE /api/users/[id]:', error)
    return NextResponse.json({ error: 'Gagal menghapus akun. Mungkin akun ini masih terkait dengan data lain.' }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Hanya Super Admin yang dapat mengedit akun.' }, { status: 403 })
    }

    const { id } = await params
    const userId = parseInt(id)
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 })
    }

    const { nama, username, role, shift, nik } = await req.json()

    if (!nama || !username || !role) {
      return NextResponse.json({ error: 'Data wajib belum lengkap.' }, { status: 400 })
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        nama,
        username,
        role,
        shift,
        nik
      }
    })

    await prisma.auditLog.create({
      data: {
        userId: (session.user as any).id,
        aktivitas: `User diupdate: ${nama} (${username})`
      }
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('API Error in PATCH /api/users/[id]:', error)
    return NextResponse.json({ error: 'Gagal mengedit akun' }, { status: 500 })
  }
}
