import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const { username, otp } = await req.json()

    if (!username || !otp) {
      return NextResponse.json({ error: 'Username dan OTP wajib diisi.' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { username } })
    
    if (!user) {
      return NextResponse.json({ error: 'Username tidak ditemukan.' }, { status: 404 })
    }

    if (!user.resetOtp || user.resetOtp !== otp) {
      return NextResponse.json({ error: 'Kode OTP salah.' }, { status: 400 })
    }

    if (!user.resetOtpExpires || new Date() > user.resetOtpExpires) {
      return NextResponse.json({ error: 'Kode OTP telah kedaluwarsa. Silakan minta kode baru.' }, { status: 400 })
    }

    // Clear the OTP so it can't be reused
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetOtp: null,
        resetOtpExpires: null
      }
    })

    return NextResponse.json({ ok: true, userId: user.id })
  } catch (error) {
    console.error('Verify OTP Error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
  }
}
