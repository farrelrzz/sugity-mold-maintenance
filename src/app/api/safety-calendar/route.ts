import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const role = (session?.user as any)?.role

    if (!session || !['TL', 'GL', 'CL', 'ADM', 'SUPER_ADMIN'].includes(role)) {
      return NextResponse.json({ 
        error: 'Akses Ditolak: Hanya Team Leader (TL), Group Leader (GL), Chief Leader (CL), dan Admin (ADM) yang berhak mengakses Kalender Safety.' 
      }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const year = Number(searchParams.get('year')) || new Date().getFullYear()

    const records = await prisma.safetyRecord.findMany({
      where: { year },
      include: {
        user: {
          select: { nama: true, username: true, role: true }
        }
      },
      orderBy: [{ month: 'asc' }, { day: 'asc' }]
    })

    const history = await prisma.safetyHistory.findMany({
      take: 100,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { nama: true, username: true, role: true }
        }
      }
    })

    return NextResponse.json({ records, history, year })
  } catch (err: any) {
    console.error('Error fetching safety calendar:', err)
    return NextResponse.json({ error: `Gagal memuat kalender safety: ${err.message || String(err)}` }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const role = (session?.user as any)?.role
    const userId = Number((session?.user as any)?.id)

    if (!session || !['TL', 'GL', 'CL', 'ADM', 'SUPER_ADMIN'].includes(role)) {
      return NextResponse.json({ 
        error: 'Akses Ditolak: Hanya Team Leader (TL), Group Leader (GL), Chief Leader (CL), dan Admin (ADM) yang berhak mengelola Kalender Safety.' 
      }, { status: 403 })
    }

    const body = await req.json()
    const { action } = body

    if (action === 'UPDATE_DAY') {
      const { year, month, day, status, keterangan } = body
      if (!year || !month || !day || !status) {
        return NextResponse.json({ error: 'Data tanggal atau status tidak lengkap' }, { status: 400 })
      }

      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

      const updated = await prisma.safetyRecord.upsert({
        where: { date: dateStr },
        update: {
          status,
          keterangan: keterangan || null,
          updatedBy: userId
        },
        create: {
          date: dateStr,
          year: Number(year),
          month: Number(month),
          day: Number(day),
          status,
          keterangan: keterangan || null,
          updatedBy: userId
        },
        include: {
          user: { select: { nama: true, username: true, role: true } }
        }
      })

      // Create history record
      await prisma.safetyHistory.create({
        data: {
          date: dateStr,
          status,
          keterangan: keterangan ? `Catatan: ${keterangan}` : `Status diubah menjadi ${status === 'NO_ACCIDENT' ? 'No Accident (Aman)' : 'ACCIDENT (Terjadi Insiden)'}`,
          action: 'UPDATE_DAY',
          modifiedBy: userId
        }
      })

      return NextResponse.json({ success: true, record: updated })
    } 
    
    else if (action === 'BULK_FILL_MONTH') {
      const { year, month, status = 'NO_ACCIDENT' } = body
      if (!year || !month) {
        return NextResponse.json({ error: 'Tahun dan bulan wajib diisi' }, { status: 400 })
      }

      // Determine days in this month (1-indexed month passed as arg 0 of next month in JS Date)
      const daysInMonth = new Date(year, month, 0).getDate()
      let updatedCount = 0

      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
        
        await prisma.safetyRecord.upsert({
          where: { date: dateStr },
          update: {
            status,
            updatedBy: userId
          },
          create: {
            date: dateStr,
            year: Number(year),
            month: Number(month),
            day: d,
            status,
            updatedBy: userId
          }
        })
        updatedCount++
      }

      const monthNames = [
        '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ]

      await prisma.safetyHistory.create({
        data: {
          date: `${year}-${String(month).padStart(2, '0')}-ALL`,
          status,
          keterangan: `Mengisi otomatis seluruh hari pada bulan ${monthNames[month]} ${year} menjadi ${status === 'NO_ACCIDENT' ? 'No Accident (Zero Accident)' : status}`,
          action: 'BULK_FILL_MONTH',
          modifiedBy: userId
        }
      })

      return NextResponse.json({ success: true, count: updatedCount })
    }

    return NextResponse.json({ error: 'Action tidak dikenali' }, { status: 400 })
  } catch (err: any) {
    console.error('Error modifying safety calendar:', err)
    return NextResponse.json({ error: `Gagal menyimpan data: ${err.message || String(err)}` }, { status: 500 })
  }
}
