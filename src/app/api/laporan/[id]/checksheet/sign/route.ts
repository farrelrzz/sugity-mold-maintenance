import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { UserRole } from '@prisma/client'

const ROLES_ORDER: UserRole[] = ['PIC', 'TL', 'GL', 'CL', 'ADM']

const PERAN_LABEL: Record<UserRole, string> = {
  PIC: 'Member (PIC)',
  TL: 'Team Leader',
  GL: 'Group Leader',
  CL: 'Chief Leader',
  ADM: 'ADM',
  SUPER_ADMIN: 'Super Admin',
}

// Mapping: siapa yang menerima notifikasi setelah role X TTD
const NEXT_ROLE_MAP: Partial<Record<UserRole, UserRole>> = {
  PIC: 'TL',
  TL: 'GL',
  GL: 'CL',
  CL: 'ADM',
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: idParam } = await params
    const id = Number(idParam)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID laporan tidak valid' }, { status: 400 })
    }

    const userRole = session.user.role as UserRole
    if (!ROLES_ORDER.includes(userRole)) {
      return NextResponse.json({ error: 'Role Anda tidak diizinkan untuk menandatangani checksheet.' }, { status: 403 })
    }

    // Temukan checksheet
    const checksheet = await prisma.checksheet.findUnique({
      where: { laporanId: id },
    })

    if (!checksheet) {
      return NextResponse.json({ error: 'Checksheet belum dibuat/diinisialisasi.' }, { status: 404 })
    }

    // Temukan semua approval untuk checksheet ini
    const approvals = await prisma.checksheetApproval.findMany({
      where: { checksheetId: checksheet.id },
    })

    // Temukan entry approval untuk user role saat ini
    const myApproval = approvals.find((a) => a.role === userRole)
    if (!myApproval) {
      return NextResponse.json({ error: 'Entry approval role Anda tidak ditemukan.' }, { status: 400 })
    }

    if (myApproval.signedAt) {
      return NextResponse.json({ error: 'Anda sudah menandatangani checksheet ini.' }, { status: 400 })
    }

    // Cek sequence signature chain
    const myIndex = ROLES_ORDER.indexOf(userRole)
    if (myIndex > 0) {
      const prevRole = ROLES_ORDER[myIndex - 1]
      const prevApproval = approvals.find((a) => a.role === prevRole)
      if (!prevApproval || !prevApproval.signedAt) {
        return NextResponse.json({
          error: `Menunggu tanda tangan ${PERAN_LABEL[prevRole]} terlebih dahulu.`,
        }, { status: 400 })
      }
    }

    // Update approval
    const updated = await prisma.checksheetApproval.update({
      where: { id: myApproval.id },
      data: {
        userId: Number(session.user.id),
        signedAt: new Date(),
      },
    })

    // Update status jadwal mingguan saat PIC atau ADM menandatangani
    if (userRole === 'PIC' || userRole === 'ADM') {
      try {
        const targetStatus = userRole === 'ADM' ? 'Sudah_Dikerjakan' : 'Proses_Approval'
        const laporan = await prisma.laporan.findUnique({ where: { id } })
        if (laporan) {
          if (laporan.jadwalId) {
            await prisma.jadwalMingguan.update({
              where: { id: Number(laporan.jadwalId) },
              data: { status: targetStatus as any }
            })
          } else {
            const lDate = new Date(laporan.tanggal)
            const matchedJadwals = await prisma.jadwalMingguan.findMany({
              where: { noMold: laporan.noMold, status: { not: 'Sudah_Dikerjakan' as any } }
            })
            for (const j of matchedJadwals) {
              if (!j.tanggalRencana) continue
              const jDate = new Date(j.tanggalRencana)
              const diffDays = Math.abs(lDate.getTime() - jDate.getTime()) / (1000 * 3600 * 24)
              if (diffDays <= 2) {
                await prisma.jadwalMingguan.update({
                  where: { id: j.id },
                  data: { status: targetStatus as any }
                })
              }
            }
          }
        }
      } catch (err) {
        console.warn('Gagal memproses sinkronisasi jadwal dari sign:', err)
      }
    }

    // === Kirim notifikasi ke role berikutnya ===
    const nextRole = NEXT_ROLE_MAP[userRole]
    if (nextRole) {
      try {
        const laporan = await prisma.laporan.findUnique({
          where: { id },
          include: { pic: { select: { nama: true } } }
        })

        if (laporan) {
          const nextUsers = await prisma.user.findMany({ where: { role: nextRole } })
          if (nextUsers.length > 0) {
            await prisma.notifikasi.createMany({
              data: nextUsers.map(u => ({
                userId: u.id,
                judul: `✍️ Perlu Approval Checksheet`,
                pesan: `Checksheet Mold ${laporan.noMold} (${laporan.jenis}) oleh ${laporan.pic.nama} sudah ditandatangani oleh ${PERAN_LABEL[userRole]}. Giliran Anda untuk approve.`,
                tipe: 'APPROVAL' as const,
                refId: id,
                refType: 'laporan',
              }))
            })
          }
        }
      } catch (notifErr) {
        // Jangan gagalkan sign hanya karena notifikasi gagal
        console.warn('Gagal kirim notifikasi:', notifErr)
      }
    }

    return NextResponse.json({ ok: true, signedAt: updated.signedAt })
  } catch (error) {
    console.error('API Error in POST /api/laporan/[id]/checksheet/sign:', error)
    return NextResponse.json({ error: 'Gagal menandatangani checksheet' }, { status: 500 })
  }
}
