import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'

export async function GET() {
  const superadminExists = await prisma.user.findUnique({
    where: { username: 'superadmin' }
  })

  let msg = []
  if (!superadminExists) {
    const passwordHash = await hash('password123', 10)
    await prisma.user.create({
      data: {
        nama: 'Super Admin',
        username: 'superadmin',
        passwordHash,
        role: 'SUPER_ADMIN',
        factory: 'F2',
        shift: 'Nonshift'
      }
    })
    msg.push('Super Admin user created')
  } else {
    msg.push('Super Admin user already exists')
  }

  const mmSetting = await prisma.systemSetting.findUnique({
    where: { key: 'maintenance_mode' }
  })

  if (!mmSetting) {
    await prisma.systemSetting.create({
      data: {
        key: 'maintenance_mode',
        value: 'false'
      }
    })
    msg.push('maintenance_mode created')
  } else {
    msg.push('maintenance_mode exists')
  }

  return NextResponse.json({ msg })
}
