import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { UserRole } from '@prisma/client'

const ROLES_ORDER: UserRole[] = ['PIC', 'TL', 'GL', 'ADM']

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { laporanIds } = body

    if (!Array.isArray(laporanIds) || laporanIds.length === 0) {
      return NextResponse.json({ error: 'Tidak ada laporan yang dipilih' }, { status: 400 })
    }

    const parsedLaporanIds = laporanIds.map(id => Number(id)).filter(id => !isNaN(id))
    if (parsedLaporanIds.length === 0) {
      return NextResponse.json({ error: 'ID laporan tidak valid' }, { status: 400 })
    }

    const userRole = session.user.role as UserRole
    if (!ROLES_ORDER.includes(userRole)) {
      return NextResponse.json({ error: 'Role Anda tidak diizinkan.' }, { status: 403 })
    }

    const userId = Number(session.user.id)
    const myIndex = ROLES_ORDER.indexOf(userRole)
    const prevRole = myIndex > 0 ? ROLES_ORDER[myIndex - 1] : null

    // Fetch all relevant checksheets and their approvals
    const checksheets = await prisma.checksheet.findMany({
      where: { laporanId: { in: parsedLaporanIds } },
      include: {
        approvals: true,
        laporan: true
      }
    })

    const toUpdateApprovalIds: number[] = []
    const toUpdateJadwalIdsToProses: number[] = []
    const toUpdateJadwalIdsToSelesai: number[] = []
    let successCount = 0

    for (const cs of checksheets) {
      const myApproval = cs.approvals.find((a) => a.role === userRole)
      if (!myApproval || myApproval.signedAt) continue // skip if already signed or not found

      if (prevRole) {
        const prevApproval = cs.approvals.find((a) => a.role === prevRole)
        if (!prevApproval || !prevApproval.signedAt) continue // skip if previous role hasn't signed
      }

      // Valid to sign
      toUpdateApprovalIds.push(myApproval.id)
      successCount++

      // If PIC or ADM, collect schedules to update
      if (userRole === 'PIC' || userRole === 'ADM') {
        if (cs.laporan.jadwalId) {
          if (userRole === 'ADM') {
            toUpdateJadwalIdsToSelesai.push(Number(cs.laporan.jadwalId))
          } else {
            toUpdateJadwalIdsToProses.push(Number(cs.laporan.jadwalId))
          }
        }
      }
    }

    if (toUpdateApprovalIds.length === 0) {
      return NextResponse.json({ error: 'Tidak ada dokumen yang valid untuk disetujui saat ini.' }, { status: 400 })
    }

    // Execute bulk updates in a transaction
    await prisma.$transaction([
      prisma.checksheetApproval.updateMany({
        where: { id: { in: toUpdateApprovalIds } },
        data: {
          userId,
          signedAt: new Date(),
        }
      }),
      ...(toUpdateJadwalIdsToProses.length > 0 ? [
        prisma.jadwalMingguan.updateMany({
          where: { id: { in: toUpdateJadwalIdsToProses } },
          data: { status: 'Proses_Approval' }
        })
      ] : []),
      ...(toUpdateJadwalIdsToSelesai.length > 0 ? [
        prisma.jadwalMingguan.updateMany({
          where: { id: { in: toUpdateJadwalIdsToSelesai } },
          data: { status: 'Sudah_Dikerjakan' }
        })
      ] : [])
    ])

    return NextResponse.json({ ok: true, signedCount: successCount })
  } catch (error) {
    console.error('API Error in POST /api/approval/sign-bulk:', error)
    return NextResponse.json({ error: 'Gagal melakukan Approve Bulk' }, { status: 500 })
  }
}
