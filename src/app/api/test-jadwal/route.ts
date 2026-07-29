import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    const today = new Date()
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const tomorrowMidnight = new Date(todayMidnight)
    tomorrowMidnight.setDate(tomorrowMidnight.getDate() + 1)
    
    const daysId = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
    const todayName = daysId[today.getDay()]

    const todayMaintenance = await prisma.jadwalMingguan.findMany({
      where: {
        status: 'Belum_Dikerjakan',
        OR: [
          {
            tanggalRencana: {
              gte: todayMidnight,
              lt: tomorrowMidnight,
            }
          },
          {
            tanggalRencana: null,
            hari: todayName
          }
        ]
      },
      include: {
        pic: { select: { nama: true } }
      }
    })

    return NextResponse.json({
        debug: {
            today: today.toISOString(),
            todayMidnight: todayMidnight.toISOString(),
            tomorrowMidnight: tomorrowMidnight.toISOString(),
            todayName
        },
        todayMaintenance,
        all: await prisma.jadwalMingguan.findMany()
    })
}
