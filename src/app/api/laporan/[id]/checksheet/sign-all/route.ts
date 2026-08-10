import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

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

    const userRole = session.user.role
    const allowedRoles = ['PIC', 'TL', 'GL', 'ADM', 'SUPER_ADMIN']
    
    // Pastikan user memiliki akses
    if (!allowedRoles.includes(userRole)) {
      return NextResponse.json({ error: 'Role Anda tidak memiliki akses untuk Approve All.' }, { status: 403 })
    }

    // Temukan checksheet
    const checksheet = await prisma.checksheet.findUnique({
      where: { laporanId: id },
    })

    if (!checksheet) {
      return NextResponse.json({ error: 'Checksheet belum dibuat.' }, { status: 404 })
    }

    // Temukan semua approval untuk PIC, TL, GL, ADM yang belum di TTD
    const approvals = await prisma.checksheetApproval.findMany({
      where: { 
        checksheetId: checksheet.id,
        role: { in: ['PIC', 'TL', 'GL', 'ADM'] }
      },
    })

    const unsignedApprovals = approvals.filter(a => !a.signedAt)

    if (unsignedApprovals.length === 0) {
      return NextResponse.json({ error: 'Semua approval (PIC, TL, GL, ADM) sudah ditandatangani.' }, { status: 400 })
    }

    const userId = Number(session.user.id)
    const now = new Date()

    // Lakukan update massal menggunakan transaksi
    await prisma.$transaction(
      unsignedApprovals.map(approval => 
        prisma.checksheetApproval.update({
          where: { id: approval.id },
          data: {
            userId,
            signedAt: now
          }
        })
      )
    )

    // Update status jadwal mingguan karena ADM sudah otomatis ter-approve
    try {
      const laporan = await prisma.laporan.findUnique({ where: { id } })
      if (laporan && laporan.jadwalId) {
        await prisma.jadwalMingguan.update({
          where: { id: Number(laporan.jadwalId) },
          data: { status: 'Sudah_Dikerjakan' }
        })
      }
    } catch (err) {
      console.warn('Gagal memproses sinkronisasi jadwal otomatis dari sign-all:', err)
    }

    return NextResponse.json({ ok: true, signedCount: unsignedApprovals.length })
  } catch (error) {
    console.error('API Error in POST /api/laporan/[id]/checksheet/sign-all:', error)
    return NextResponse.json({ error: 'Gagal melakukan Approve All' }, { status: 500 })
  }
}
