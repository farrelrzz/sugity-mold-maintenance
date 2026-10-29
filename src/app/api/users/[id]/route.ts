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

    const sessionUserId = Number((session?.user as any)?.id)
    if (!isNaN(sessionUserId) && sessionUserId === userId) {
      return NextResponse.json({ error: 'Anda tidak dapat menghapus akun Anda sendiri saat sedang login.' }, { status: 400 })
    }

    const userToDelete = await prisma.user.findUnique({ where: { id: userId } })
    if (!userToDelete) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })
    }

    const rawRole = String((session?.user as any)?.role || '').trim().toUpperCase().replace(/[\s-]/g, '_')
    const isAdminOrSuper = ['SUPER_ADMIN', 'SUPERADMIN', 'ADM'].includes(rawRole)
    if (!isAdminOrSuper) {
      if (rawRole === 'PIC' && userToDelete.role === 'PIC') {
        // PIC diizinkan menghapus PIC (terutama untuk hapus PIC temporary)
      } else {
        return NextResponse.json({ error: 'Unauthorized. Hanya Super Admin & Admin yang diizinkan.' }, { status: 403 })
      }
    }

    if (userToDelete.role === 'SUPER_ADMIN' && rawRole !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Hanya Super Admin yang dapat menghapus sesama akun Super Admin.' }, { status: 403 })
    }

    // Temukan user fallback jika ada relasi NOT-NULL
    let fallbackId = !isNaN(sessionUserId) && sessionUserId > 0 && sessionUserId !== userId ? sessionUserId : null
    if (!fallbackId) {
      const fallbackUser = await prisma.user.findFirst({
        where: { id: { not: userId } }
      })
      fallbackId = fallbackUser?.id || null
    }

    await prisma.$transaction(async (tx) => {
      // 1. Hapus notifikasi milik user
      await tx.notifikasi.deleteMany({
        where: { userId }
      })

      // 2. Putus relasi audit log (set null)
      await tx.auditLog.updateMany({
        where: { userId },
        data: { userId: null }
      })

      // 3. Putus relasi approval checksheet (set null agar riwayat ttd tetap tercatat)
      await tx.checksheetApproval.updateMany({
        where: { userId },
        data: { userId: null }
      })

      // 4. Hapus entri overtime user jika ada
      await tx.overtimeEntry.deleteMany({
        where: { userId }
      })

      // 5. Putus relasi pembaruan MoldBook (set null)
      await tx.moldBook.updateMany({
        where: { updatedBy: userId },
        data: { updatedBy: null }
      })

      // 6. Putus relasi respons revisi checksheet (set null)
      await tx.checksheetRevisi.updateMany({
        where: { respondedById: userId },
        data: { respondedById: null }
      })

      // 7. Alihkan relasi NOT NULL ke fallback user jika ada
      if (fallbackId) {
        await tx.laporan.updateMany({
          where: { picId: userId },
          data: { picId: fallbackId }
        })

        await tx.jadwalMingguan.updateMany({
          where: { picId: userId },
          data: { picId: fallbackId }
        })

        await tx.checksheetRevisi.updateMany({
          where: { requestById: userId },
          data: { requestById: fallbackId }
        })

        await tx.safetyRecord.updateMany({
          where: { updatedBy: userId },
          data: { updatedBy: fallbackId }
        })

        await tx.safetyHistory.updateMany({
          where: { modifiedBy: userId },
          data: { modifiedBy: fallbackId }
        })
      }

      // 8. Hapus user secara tuntas dan permanen
      await tx.user.delete({
        where: { id: userId }
      })
    })

    try {
      const auditUserId = !isNaN(sessionUserId) && sessionUserId > 0 ? sessionUserId : null
      await prisma.auditLog.create({
        data: {
          userId: auditUserId,
          aktivitas: `User dihapus: ${userToDelete.nama} (${userToDelete.username})`
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
