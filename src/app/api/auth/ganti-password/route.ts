import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const { userId, passwordBaru } = await req.json()

    if (!userId || !passwordBaru || passwordBaru.length < 4) {
      return NextResponse.json({ error: 'Data tidak valid.' }, { status: 400 })
    }

    const hash = await bcrypt.hash(passwordBaru, 10)
    await prisma.user.update({
      where: { id: Number(userId) },
      data: { passwordHash: hash },
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
  }
}
