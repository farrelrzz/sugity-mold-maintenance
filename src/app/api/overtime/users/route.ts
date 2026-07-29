import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const bulanParam = searchParams.get('bulan') || new Date().toISOString().slice(0, 7)
    const [tahun, bln] = bulanParam.split('-').map(Number)
    const startDate = new Date(tahun, bln - 1, 1)
    const endDate = new Date(tahun, bln, 0, 23, 59, 59, 999)

    // Fetch all users with their overtime totals for the month
    const users = await prisma.user.findMany({
      select: {
        id: true,
        nama: true,
        shift: true,
        role: true,
        factory: true,
        overtimeEntry: {
          where: {
            tanggal: { gte: startDate, lte: endDate },
          },
          select: {
            tanggal: true,
            jamRencana: true,
            jamAktual: true,
          },
        },
      },
      orderBy: [{ shift: 'asc' }, { nama: 'asc' }],
    })

    const result = users.map((u) => ({
      id: u.id,
      nama: u.nama,
      shift: u.shift || 'Nonshift',
      role: u.role,
      factory: u.factory,
      totalPlan: u.overtimeEntry.reduce((s, e) => s + Number(e.jamRencana || 0), 0),
      totalAktual: u.overtimeEntry.reduce((s, e) => s + Number(e.jamAktual || 0), 0),
      entries: u.overtimeEntry.map((e) => ({
        tanggal: new Date(e.tanggal).toISOString().slice(0, 10),
        jamRencana: Number(e.jamRencana || 0),
        jamAktual: Number(e.jamAktual || 0),
      })),
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error('API Error in GET /api/overtime/users:', error)
    return NextResponse.json({ error: 'Gagal memuat data users overtime' }, { status: 500 })
  }
}
