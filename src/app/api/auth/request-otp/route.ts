import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import nodemailer from 'nodemailer'

export async function POST(req: Request) {
  try {
    const { username, email, securityLetter } = await req.json()

    if (!username || !email) {
      return NextResponse.json({ error: 'Username dan Email wajib diisi.' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { username } })
    
    if (!user) {
      return NextResponse.json({ error: 'Username tidak ditemukan.' }, { status: 404 })
    }

    // Check Lockout
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingTime = Math.ceil((user.lockedUntil.getTime() - Date.now()) / (1000 * 60))
      return NextResponse.json({ 
        error: `Akun Anda sedang dikunci sementara karena terlalu banyak percobaan gagal. Silakan coba lagi dalam ${remainingTime} menit.` 
      }, { status: 429 })
    }

    if (user.email && user.email.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json({ error: 'Email yang Anda masukkan tidak cocok dengan data pengguna.' }, { status: 400 })
    }

    // Check security letter if provided
    if (!securityLetter) {
      return NextResponse.json({ error: 'Harap masukkan huruf depan nama Anda.' }, { status: 400 })
    }

    const actualFirstLetter = user.nama.trim().charAt(0).toLowerCase()
    
    if (securityLetter.toLowerCase() !== actualFirstLetter) {
      // Handle Failure
      let newAttempts = user.otpAttempts + 1
      let newLockedUntil = null
      let newLockoutStage = user.lockoutStage

      if (newAttempts >= 3) {
        if (user.lockoutStage === 0) {
          // Lock for 1 hour
          newLockedUntil = new Date(Date.now() + 60 * 60 * 1000)
          newLockoutStage = 1
        } else if (user.lockoutStage === 1) {
          // Lock for 8 hours
          newLockedUntil = new Date(Date.now() + 8 * 60 * 60 * 1000)
          newLockoutStage = 2
        } else {
          // Lock for 24 hours
          newLockedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000)
          newLockoutStage = 3
        }
        newAttempts = 0 // Reset attempts for next cycle
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          otpAttempts: newAttempts,
          lockedUntil: newLockedUntil,
          lockoutStage: newLockoutStage
        }
      })

      // Audit Log for Super Admin
      await prisma.auditLog.create({
        data: {
          aktivitas: `Percobaan lupa password gagal untuk user ${username} (Salah tebak huruf depan).${newLockedUntil ? ` Akun dikunci hingga ${newLockedUntil.toLocaleTimeString('id-ID')}` : ''}`,
          userId: user.id
        }
      })

      if (newLockedUntil) {
        return NextResponse.json({ error: 'Terlalu banyak percobaan gagal. Akun dikunci sementara demi keamanan.' }, { status: 429 })
      }

      return NextResponse.json({ error: 'Verifikasi keamanan gagal. Huruf depan salah.' }, { status: 400 })
    }

    // Success - Reset rate limits
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expires = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now

    await prisma.user.update({
      where: { id: user.id },
      data: {
        email: email.toLowerCase(),
        resetOtp: otp,
        resetOtpExpires: expires,
        otpAttempts: 0,
        lockedUntil: null,
        lockoutStage: 0
      }
    })

    // Audit Log Success
    await prisma.auditLog.create({
      data: {
        aktivitas: `Permintaan OTP lupa password berhasil untuk user ${username}. OTP dikirim ke ${email}.`,
        userId: user.id
      }
    })

    // SEND EMAIL 
    const smtpHost = process.env.SMTP_HOST
    const smtpUser = process.env.SMTP_USER
    const smtpPass = process.env.SMTP_PASS

    if (smtpHost && smtpUser && smtpPass) {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      })

      await transporter.sendMail({
        from: `"Sugity Mold Maintenance" <${smtpUser}>`,
        to: email,
        subject: 'Kode OTP Lupa Password',
        text: `Kode OTP Anda adalah: ${otp}\n\nKode ini berlaku selama 10 menit. Jangan bagikan kode ini kepada siapapun.`,
        html: `<p>Kode OTP Anda adalah: <b>${otp}</b></p><p>Kode ini berlaku selama 10 menit. Jangan bagikan kode ini kepada siapapun.</p>`
      })
      console.log(`[EMAIL SENT] OTP dikirim ke ${email}`)
    } else {
      // Fallback for dev if SMTP not configured
      console.log(`\n=========================================\n`)
      console.log(`[EMAIL MOCK] To: ${email}`)
      console.log(`Subject: Sugity Mold Maintenance - OTP Lupa Password`)
      console.log(`Body: Kode OTP Anda adalah: ${otp}. Kode ini berlaku selama 10 menit.\n`)
      console.log(`=========================================\n`)
    }

    return NextResponse.json({ ok: true, message: 'OTP telah dikirim ke email.' })
  } catch (error) {
    console.error('Request OTP Error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
  }
}
