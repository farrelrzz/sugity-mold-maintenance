import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Helper week number calculator
function getWeekAndYear(dateStr: string) {
  const d = new Date(dateStr)
  // Copy date so don't modify original
  const tempDate = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  // Set to nearest Thursday: current date + 4 - current day number
  // Thursday weeks start in UTC
  tempDate.setUTCDate(tempDate.getUTCDate() + 4 - (tempDate.getUTCDay() || 7))
  // Get first day of year
  const yearStart = new Date(Date.UTC(tempDate.getUTCFullYear(), 0, 1))
  // Calculate full weeks to nearest Thursday
  const weekNo = Math.ceil((((tempDate.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return { week: weekNo, year: tempDate.getUTCFullYear() }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Parameter startDate dan endDate wajib diisi.' }, { status: 400 })
    }

    const start = new Date(startDate)
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)

    const schedules = await prisma.jadwalMingguan.findMany({
      where: {
        tanggalRencana: {
          gte: start,
          lt: end,
        },
      },
      include: {
        pic: {
          select: {
            id: true,
            nama: true,
            role: true,
          },
        },
        laporan: {
          select: {
            id: true,
            tanggal: true,
            noMold: true,
            checksheet: {
              select: {
                approvals: {
                  select: { role: true, signedAt: true }
                }
              }
            }
          }
        }
      },
      orderBy: {
        id: 'asc',
      },
    })

    const moldList = Array.from(new Set(schedules.map(j => j.noMold)))
    let allRelatedReports: any[] = []
    if (moldList.length > 0) {
      allRelatedReports = await prisma.laporan.findMany({
        where: { noMold: { in: moldList } },
        select: {
          id: true,
          tanggal: true,
          noMold: true,
          jadwalId: true,
          checksheet: {
            select: {
              approvals: {
                select: { role: true, signedAt: true }
              }
            }
          }
        }
      })
    }

    const syncedSchedules = await Promise.all(schedules.map(async (j) => {
      const linked = (j as any).laporan || []
      const matching = linked.length > 0 ? linked : allRelatedReports.filter((rep: any) => {
        if (rep.noMold.trim().toLowerCase() !== j.noMold.trim().toLowerCase()) return false
        if (!j.tanggalRencana) return true
        const jDate = new Date(j.tanggalRencana)
        const repDate = new Date(rep.tanggal)
        const diffDays = Math.abs(repDate.getTime() - jDate.getTime()) / (1000 * 3600 * 24)
        return diffDays <= 2
      })

      let computedStatus = 'Belum_Dikerjakan'
      if (matching.length > 0) {
        const isApprovedByAdm = matching.some((rep: any) => {
          const approvals = rep.checksheet?.approvals || []
          const admApp = approvals.find((a: any) => a.role === 'ADM')
          return admApp && admApp.signedAt !== null
        })
        const isApprovedByPic = matching.some((rep: any) => {
          const approvals = rep.checksheet?.approvals || []
          const picApp = approvals.find((a: any) => a.role === 'PIC')
          return picApp && picApp.signedAt !== null
        })

        if (isApprovedByAdm) {
          computedStatus = 'Sudah_Dikerjakan'
        } else if (isApprovedByPic) {
          computedStatus = 'Proses_Approval'
        } else {
          computedStatus = 'Sedang_Dikerjakan'
        }
      }

      if (j.status !== computedStatus) {
        try {
          await prisma.jadwalMingguan.update({
            where: { id: j.id },
            data: { status: computedStatus as any }
          })
        } catch (e) {
          console.warn('Silent update error:', e)
        }
      }

      return {
        ...j,
        status: computedStatus
      }
    }))

    return NextResponse.json(syncedSchedules)
  } catch (error) {
    console.error('API Error in GET /api/jadwal:', error)
    return NextResponse.json({ error: 'Gagal mengambil jadwal mingguan' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      tanggalRencana, // format: YYYY-MM-DD
      noMold,
      picId,
      hari,
      jenis,
      catatan,
    } = body

    if (!tanggalRencana || !noMold || !picId || !hari || !jenis) {
      return NextResponse.json({ error: 'Field wajib tidak lengkap' }, { status: 400 })
    }

    const { week, year } = getWeekAndYear(tanggalRencana)

    const jadwal = await prisma.jadwalMingguan.create({
      data: {
        tanggalRencana: new Date(tanggalRencana),
        mingguKe: week,
        tahun: year,
        noMold,
        picId: Number(picId),
        hari,
        jenis,
        catatan: catatan || null,
        status: 'Belum_Dikerjakan',
      },
      include: {
        pic: {
          select: {
            id: true,
            nama: true,
          },
        },
      },
    })

    return NextResponse.json(jadwal, { status: 201 })
  } catch (error) {
    console.error('API Error in POST /api/jadwal:', error)
    return NextResponse.json({ error: 'Gagal menyimpan jadwal' }, { status: 500 })
  }
}
