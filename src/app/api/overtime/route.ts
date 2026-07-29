import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const bulanParam = searchParams.get('bulan') || new Date().toISOString().slice(0, 7)
    const [tahun, bln] = bulanParam.split('-').map(Number)
    const startDate = new Date(tahun, bln - 1, 1)
    const endDate = new Date(tahun, bln, 0, 23, 59, 59, 999)

    const entries = await prisma.overtimeEntry.findMany({
      where: {
        tanggal: { gte: startDate, lte: endDate },
      },
      include: {
        user: {
          select: { id: true, nama: true, shift: true, role: true, factory: true },
        },
      },
      orderBy: [{ tanggal: 'asc' }, { userId: 'asc' }],
    })

    // Group by shift then by user (total for the month)
    type UserSummary = {
      userId: number
      nama: string
      shift: string
      role: string
      totalPlan: number
      totalAktual: number
      entries: { tanggal: string; jamRencana: number; jamAktual: number }[]
    }

    const grouped: Record<string, Record<number, UserSummary>> = {
      Nonshift: {},
      Shift_A: {},
      Shift_B: {},
    }

    entries.forEach((e) => {
      const shiftKey = (e.user.shift || 'Nonshift') as string
      const uid = e.userId
      if (!grouped[shiftKey]) grouped[shiftKey] = {}
      if (!grouped[shiftKey][uid]) {
        grouped[shiftKey][uid] = {
          userId: uid,
          nama: e.user.nama,
          shift: shiftKey,
          role: e.user.role,
          totalPlan: 0,
          totalAktual: 0,
          entries: [],
        }
      }
      grouped[shiftKey][uid].totalPlan += Number(e.jamRencana || 0)
      grouped[shiftKey][uid].totalAktual += Number(e.jamAktual || 0)
      grouped[shiftKey][uid].entries.push({
        tanggal: new Date(e.tanggal).toISOString().slice(0, 10),
        jamRencana: Number(e.jamRencana || 0),
        jamAktual: Number(e.jamAktual || 0),
      })
    })

    return NextResponse.json({
      bulan: bulanParam,
      Nonshift: Object.values(grouped['Nonshift']),
      Shift_A: Object.values(grouped['Shift_A']),
      Shift_B: Object.values(grouped['Shift_B']),
    })
  } catch (error) {
    console.error('API Error in GET /api/overtime:', error)
    return NextResponse.json({ error: 'Gagal memuat data overtime' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { userId, tanggal, jamRencana, jamAktual } = body

    if (!userId || !tanggal) {
      return NextResponse.json({ error: 'userId dan tanggal wajib diisi.' }, { status: 400 })
    }

    const parsedDate = new Date(tanggal)

    const entry = await prisma.overtimeEntry.upsert({
      where: {
        userId_tanggal: {
          userId: Number(userId),
          tanggal: parsedDate,
        },
      },
      create: {
        userId: Number(userId),
        tanggal: parsedDate,
        bulan: new Date(parsedDate.getFullYear(), parsedDate.getMonth(), 1),
        jamRencana: Number(jamRencana || 0),
        jamAktual: Number(jamAktual || 0),
      },
      update: {
        jamRencana: Number(jamRencana || 0),
        jamAktual: Number(jamAktual || 0),
      },
    })

    return NextResponse.json(entry)
  } catch (error) {
    console.error('API Error in POST /api/overtime:', error)
    return NextResponse.json({ error: 'Gagal menyimpan data overtime' }, { status: 500 })
  }
}
