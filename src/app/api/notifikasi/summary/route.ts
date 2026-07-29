import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { UserRole } from '@prisma/client'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = Number(session.user.id)
    const role = session.user.role as UserRole

    // 1. Tugas Approval (Require Approval from me)
    let requireApproval: any[] = []
    if (['TL', 'GL', 'CL', 'ADM'].includes(role)) {
      const checksheets = await prisma.checksheet.findMany({
        include: {
          laporan: { include: { pic: true } },
          approvals: { include: { user: true } },
        },
        orderBy: { createdAt: 'desc' },
      })

      const pending = checksheets.filter((cs) => {
        const myApproval = cs.approvals.find((a) => a.role === role)
        if (myApproval?.signedAt) return false // I already approved

        const ROLES_ORDER = ['PIC', 'TL', 'GL', 'CL', 'ADM']
        const myIndex = ROLES_ORDER.indexOf(role)
        if (myIndex > 0) {
          const prevRole = ROLES_ORDER[myIndex - 1] as UserRole
          const prevApproval = cs.approvals.find((a) => a.role === prevRole)
          if (!prevApproval || !prevApproval.signedAt) {
            return false // Previous role hasn't approved yet
          }
        }
        return true
      })
      requireApproval = pending.map((cs) => ({
        id: cs.id,
        laporanId: cs.laporanId,
        noMold: cs.laporan.noMold,
        picName: cs.laporan.pic.nama,
        tanggal: cs.laporan.tanggal,
        jenis: cs.laporan.jenis,
      }))
    }

    // 2. Progress Laporan Saya (My Reports Progress)
    const myReports = await prisma.checksheet.findMany({
      where: {
        laporan: { picId: userId }
      },
      include: {
        laporan: true,
        approvals: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    const myProgress = myReports.map(cs => {
      // Determine overall status
      const ROLES_ORDER = ['PIC', 'TL', 'GL', 'CL', 'ADM']
      let currentStage = 'PIC'
      let isFullyApproved = true

      for (const r of ROLES_ORDER) {
        const approval = cs.approvals.find(a => a.role === r)
        if (!approval || !approval.signedAt) {
          currentStage = r
          isFullyApproved = false
          break
        }
      }

      return {
        id: cs.id,
        laporanId: cs.laporanId,
        noMold: cs.laporan.noMold,
        tanggal: cs.laporan.tanggal,
        isFullyApproved,
        currentStage, // Role yang ditunggu
        approvals: cs.approvals.map(a => ({ role: a.role, signedAt: a.signedAt }))
      }
    })

    // 3. Update Mold Terbaru (Recent Molds)
    const recentMoldsRaw = await prisma.moldBook.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 5,
      include: {
        updatedByUser: {
          select: { nama: true }
        }
      }
    })
    
    // Some old records might not have updatedAt, fallback to noMold if needed, but it's okay to just map them
    const recentMolds = recentMoldsRaw.filter(m => m.updatedAt).map(m => ({
      noMold: m.noMold,
      updatedAt: m.updatedAt,
      updater: m.updatedByUser?.nama || 'System'
    }))

    // Return the combined summary
    return NextResponse.json({
      requireApproval,
      myProgress,
      recentMolds
    })
  } catch (error) {
    console.error('GET /api/notifikasi/summary error:', error)
    return NextResponse.json({ error: 'Gagal mengambil summary notifikasi' }, { status: 500 })
  }
}
