import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const settings = await prisma.systemSetting.findMany()
    return NextResponse.json({ settings })
  } catch (error) {
    console.error('API Error in GET /api/system-settings:', error)
    return NextResponse.json({ error: 'Gagal mengambil data' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { key, value } = await req.json()
    if (!key || value === undefined) {
      return NextResponse.json({ error: 'Key atau value tidak lengkap' }, { status: 400 })
    }

    const updated = await prisma.systemSetting.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) }
    })

    // Audit Log
    let actionDesc = `Pengaturan sistem diubah: ${key} = ${value}`
    if (key === 'maintenance_mode') {
      actionDesc = value === 'true' ? 'Maintenance mode diaktifkan' : 'Maintenance mode dinonaktifkan'
    }

    await prisma.auditLog.create({
      data: {
        userId: (session.user as any).id,
        aktivitas: actionDesc
      }
    })

    return NextResponse.json({ ok: true, setting: updated })
  } catch (error) {
    console.error('API Error in PATCH /api/system-settings:', error)
    return NextResponse.json({ error: 'Gagal update data' }, { status: 500 })
  }
}
