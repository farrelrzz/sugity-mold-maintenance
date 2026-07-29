import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// PATCH /api/revisi/[id] - ADM approve atau tolak revisi
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (session.user.role !== 'ADM') return NextResponse.json({ error: 'Hanya ADM yang bisa respond revisi' }, { status: 403 })

    const { id } = await params
    const revisiId = Number(id)
    const responderId = Number(session.user.id)
    const { action } = await req.json() // action: 'DISETUJUI' | 'DITOLAK'

    if (!['DISETUJUI', 'DITOLAK'].includes(action)) {
      return NextResponse.json({ error: 'Action tidak valid' }, { status: 400 })
    }

    const revisi = await prisma.checksheetRevisi.findUnique({
      where: { id: revisiId },
      include: {
        checksheet: { include: { approvals: true, laporan: { include: { pic: true } } } },
        requestBy: true,
      }
    })
    if (!revisi) return NextResponse.json({ error: 'Revisi tidak ditemukan' }, { status: 404 })

    // Update status revisi
    const updatedRevisi = await prisma.checksheetRevisi.update({
      where: { id: revisiId },
      data: {
        status: action as 'DISETUJUI' | 'DITOLAK',
        respondedById: responderId,
        respondedAt: new Date(),
      }
    })

    // Jika disetujui → hapus TTD PIC agar checksheet bisa diedit kembali
    if (action === 'DISETUJUI') {
      const picApproval = revisi.checksheet.approvals.find((a: any) => a.role === 'PIC')
      if (picApproval) {
        await prisma.checksheetApproval.update({
          where: { id: picApproval.id },
          data: { signedAt: null, userId: null }
        })
      }
    }

    // Kirim notifikasi ke PIC
    const laporan = revisi.checksheet.laporan
    const notifPesan = action === 'DISETUJUI'
      ? `Pengajuan revisi Anda untuk Mold ${laporan.noMold} telah DISETUJUI. Silakan edit dan submit kembali.`
      : `Pengajuan revisi Anda untuk Mold ${laporan.noMold} DITOLAK.`

    await prisma.notifikasi.create({
      data: {
        userId: revisi.requestById,
        judul: action === 'DISETUJUI' ? '✅ Revisi Disetujui' : '❌ Revisi Ditolak',
        pesan: notifPesan,
        tipe: 'REVISI',
        refId: revisiId,
        refType: 'checksheet_revisi',
      }
    })

    return NextResponse.json({ revisi: updatedRevisi, message: `Revisi ${action.toLowerCase()}` })
  } catch (error) {
    console.error('PATCH /api/revisi/[id] error:', error)
    return NextResponse.json({ error: 'Gagal memproses revisi' }, { status: 500 })
  }
}
