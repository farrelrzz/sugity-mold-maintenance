import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Shift } from '@prisma/client'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { bulan, shift, target } = body

    if (!bulan || !shift || target === undefined) {
      return NextResponse.json({ error: 'Parameter tidak lengkap' }, { status: 400 })
    }

    // Ubah "2026-07" -> Date objek tanggal 1
    const [year, month] = bulan.split('-').map(Number)
    const targetBulan = new Date(year, month - 1, 1)

    const prismaShift = shift === 'Shift_A' || shift === 'Shift A' ? Shift.Shift_A : Shift.Shift_B

    // Upsert target
    const targetEntry = await prisma.planningTarget.upsert({
      where: {
        bulan_shift: {
          bulan: targetBulan,
          shift: prismaShift,
        },
      },
      update: {
        targetOh: Number(target) || 0,
      },
      create: {
        bulan: targetBulan,
        shift: prismaShift,
        targetOh: Number(target) || 0,
      },
    })

    return NextResponse.json({ ok: true, targetEntry })
  } catch (error) {
    console.error('API Error in POST /api/dashboard/planning-target:', error)
    return NextResponse.json({ error: 'Gagal menyimpan target planning' }, { status: 500 })
  }
}
