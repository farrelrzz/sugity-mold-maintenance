import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/laporan/[id]/revisi - cek status revisi aktif
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const laporanId = Number(id)

    const checksheet = await prisma.checksheet.findUnique({ where: { laporanId } })
    if (!checksheet) return NextResponse.json({ revisi: null })

    const revisi = await prisma.checksheetRevisi.findFirst({
      where: { checksheetId: checksheet.id },
      include: { requestBy: { select: { nama: true } }, respondedBy: { select: { nama: true } } },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ revisi })
  } catch (error) {
    console.error('GET /api/laporan/[id]/revisi error:', error)
    return NextResponse.json({ error: 'Gagal mengambil data revisi' }, { status: 500 })
  }
}

// POST /api/laporan/[id]/revisi - ajukan revisi baru
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const laporanId = Number(id)
    const userId = Number(session.user.id)
    const { alasan } = await req.json()

    if (!alasan?.trim()) {
      return NextResponse.json({ error: 'Alasan revisi wajib diisi' }, { status: 400 })
    }

    const checksheet = await prisma.checksheet.findUnique({
      where: { laporanId },
      include: { approvals: true }
    })
    if (!checksheet) return NextResponse.json({ error: 'Checksheet tidak ditemukan' }, { status: 404 })

    // Cek apakah PIC sudah TTD (locked)
    const picSign = checksheet.approvals.find(a => a.role === 'PIC')
    if (!picSign?.signedAt) {
      return NextResponse.json({ error: 'Checksheet belum dikunci, tidak perlu revisi' }, { status: 400 })
    }

    // Cek apakah sudah ada revisi MENUNGGU
    const existingRevisi = await prisma.checksheetRevisi.findFirst({
      where: { checksheetId: checksheet.id, status: 'MENUNGGU' }
    })
    if (existingRevisi) {
      return NextResponse.json({ error: 'Sudah ada pengajuan revisi yang sedang menunggu' }, { status: 400 })
    }

    // Buat revisi baru
    const revisi = await prisma.checksheetRevisi.create({
      data: {
        checksheetId: checksheet.id,
        requestById: userId,
        alasan: alasan.trim(),
      }
    })

    // Kirim notifikasi ke semua ADM
    const admUsers = await prisma.user.findMany({ where: { role: 'ADM' } })
    const laporan = await prisma.laporan.findUnique({
      where: { id: laporanId },
      include: { pic: { select: { nama: true } } }
    })

    if (laporan) {
      await prisma.notifikasi.createMany({
        data: admUsers.map(adm => ({
          userId: adm.id,
          judul: '📋 Pengajuan Revisi Checksheet',
          pesan: `${laporan.pic.nama} mengajukan revisi untuk laporan Mold ${laporan.noMold}. Alasan: ${alasan.trim()}`,
          tipe: 'REVISI' as const,
          refId: revisi.id,
          refType: 'checksheet_revisi',
        }))
      })
    }

    return NextResponse.json({ revisi, message: 'Revisi berhasil diajukan' })
  } catch (error) {
    console.error('POST /api/laporan/[id]/revisi error:', error)
    return NextResponse.json({ error: 'Gagal mengajukan revisi' }, { status: 500 })
  }
}
