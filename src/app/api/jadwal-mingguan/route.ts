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

    const { searchParams } = new URL(req.url)
    const sortBy = searchParams.get('sortBy') || 'tanggalRencana' // asc or desc handled in frontend
    const sortOrder = searchParams.get('sortOrder') === 'desc' ? 'desc' : 'asc'
    const search = searchParams.get('search') || ''

    const whereClause: any = {}
    if (search) {
      whereClause.OR = [
        { noMold: { contains: search } },
        { jenis: { contains: search } },
        { catatan: { contains: search } }
      ]
    }

    const jadwalList = await prisma.jadwalMingguan.findMany({
      where: whereClause,
      include: {
        pic: { select: { id: true, nama: true, role: true } },
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
        [sortBy]: sortOrder
      }
    })

    const moldList = Array.from(new Set(jadwalList.map(j => j.noMold)))
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

    const syncedJadwal = await Promise.all(jadwalList.map(async (j) => {
      const linked = (j as any).laporan || []
      const matching = linked.length > 0 ? linked : allRelatedReports.filter((rep: any) => {
        if (rep.noMold.trim().toLowerCase() !== j.noMold.trim().toLowerCase()) return false
        if (!j.tanggalRencana) return true
        const jDate = new Date(j.tanggalRencana)
        const repDate = new Date(rep.tanggal)
        const diffDays = Math.abs(repDate.getTime() - jDate.getTime()) / (1000 * 3600 * 24)
        return (repDate.getMonth() === jDate.getMonth() && repDate.getFullYear() === jDate.getFullYear()) || diffDays <= 14
      })

      let computedStatus = 'Belum_Dikerjakan'
      if (matching.length > 0) {
        const isApprovedByAdm = matching.some((rep: any) => {
          const approvals = rep.checksheet?.approvals || []
          const admApp = approvals.find((a: any) => a.role === 'ADM')
          return admApp && admApp.signedAt !== null
        })
        computedStatus = isApprovedByAdm ? 'Sudah_Dikerjakan' : 'Proses_Approval'
      }

      if (j.status !== computedStatus) {
        try {
          await prisma.jadwalMingguan.update({
            where: { id: j.id },
            data: { status: computedStatus as any }
          })
        } catch (e) {
          console.warn('Silent update error for jadwal status sync:', e)
        }
      }

      return {
        ...j,
        status: computedStatus
      }
    }))

    return NextResponse.json({ jadwal: syncedJadwal })
  } catch (error) {
    console.error('API Error in GET /api/jadwal-mingguan:', error)
    return NextResponse.json({ error: 'Gagal mengambil data jadwal' }, { status: 500 })
  }
}

