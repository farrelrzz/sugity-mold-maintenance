import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const { username, nik, tempatLahir, tanggalLahir } = await req.json()

    const user = await prisma.user.findUnique({ where: { username } })
    if (!user) {
      return NextResponse.json({ error: 'Username tidak ditemukan.' }, { status: 404 })
    }

    const tglLahir = new Date(tanggalLahir)
    const cocok =
      user.nik === nik &&
      user.tempatLahir?.toLowerCase() === tempatLahir.toLowerCase() &&
      user.tanggalLahir?.toISOString().slice(0, 10) === tglLahir.toISOString().slice(0, 10)

    if (!cocok) {
      return NextResponse.json({ error: 'Data identitas tidak cocok.' }, { status: 400 })
    }

    return NextResponse.json({ userId: user.id })
  } catch {
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
  }
}
