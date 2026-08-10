import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = session.user.role

    const checksheets = await prisma.checksheet.findMany({
      include: {
        laporan: {
          include: {
            pic: true,
          }
        },
        approvals: {
          include: {
            user: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const data = checksheets.map(cs => {
      // Find current role approval
      const myApproval = cs.approvals.find(a => a.role === role)
      
      let status = 'MENUNGGU'
      if (myApproval?.signedAt) {
        status = 'APPROVED'
      } else {
        // Sequential check
        const ROLES_ORDER = ['PIC', 'TL', 'GL', 'ADM']
        const myIndex = ROLES_ORDER.indexOf(role)
        if (myIndex > 0) {
          const prevRole = ROLES_ORDER[myIndex - 1]
          const prevApproval = cs.approvals.find(a => a.role === prevRole)
          if (!prevApproval || !prevApproval.signedAt) {
            status = 'BELUM_GILIRAN'
          }
        }
      }

      return {
        id: cs.id,
        laporanId: cs.laporanId,
        noMold: cs.laporan.noMold,
        tanggal: cs.laporan.tanggal,
        jenis: cs.laporan.jenis,
        picName: cs.laporan.pic.nama,
        status: status, // MENUNGGU | APPROVED | BELUM_GILIRAN
        approvals: cs.approvals
      }
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error('API Error in GET /api/approval:', error)
    return NextResponse.json({ error: 'Gagal mengambil data' }, { status: 500 })
  }
}
