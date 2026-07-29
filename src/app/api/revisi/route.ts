import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADM') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const revisi = await prisma.checksheetRevisi.findMany({
      include: {
        checksheet: {
          include: {
            laporan: {
              include: { pic: true }
            }
          }
        },
        requestBy: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(revisi)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Gagal mengambil data' }, { status: 500 })
  }
}
