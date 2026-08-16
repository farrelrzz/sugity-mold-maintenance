'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const callbackUrl = params.get('callbackUrl') || '/'

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Lupa Password modal (Admin Approval & Self-Service Flow)
  const [showLupaPass, setShowLupaPass] = useState(false)
  const [lpStep, setLpStep] = useState<'CHECK' | 'PENDING' | 'APPROVED'>('CHECK')
  const [lpUsername, setLpUsername] = useState('')
  const [lpMessage, setLpMessage] = useState('')
  const [lpError, setLpError] = useState('')
  const [lpLoading, setLpLoading] = useState(false)
  const [lpPassBaru, setLpPassBaru] = useState('')
  const [lpPassUlang, setLpPassUlang] = useState('')
  const [lpVerifiedId, setLpVerifiedId] = useState<number | null>(null)
  const [lpUserNama, setLpUserNama] = useState('')

  const usernameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    usernameRef.current?.focus()
    document.documentElement.removeAttribute('data-role')
    document.body.removeAttribute('data-role')
    router.prefetch(callbackUrl) // Prefetch untuk transisi instan
  }, [router, callbackUrl])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !password) {
      setError('Username dan password wajib diisi.')
      return
    }
    setLoading(true)
    setError('')

    const result = await signIn('credentials', {
      username: username.trim(),
      password: password.trim(),
      redirect: false,
    })

    if (result?.error) {
      setLoading(false)
      setError('Username atau password salah. Pastikan tidak ada spasi berlebih atau salah mengetik huruf besar/kecil.')
    } else {
      // Tetap loading=true saat router sedang transisi agar UI tidak berkedip
      router.replace(callbackUrl)
    }
  }

  const handleCheckOrRequestReset = async () => {
    if (!lpUsername.trim()) {
      setLpError('Username wajib diisi.')
      return
    }
    setLpError('')
    setLpMessage('')
    setLpLoading(true)
    try {
      const res = await fetch('/api/auth/request-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: lpUsername })
      })
      const data = await res.json()
      if (!res.ok) {
        setLpError(data.error || 'Gagal memeriksa akun')
        return
      }
      
      setLpVerifiedId(data.userId || null)
      setLpUserNama(data.nama || '')
      
      if (data.status === 'APPROVED') {
        setLpStep('APPROVED')
        setLpMessage(data.message || 'Permintaan disetujui. Silakan masukkan password baru Anda.')
      } else {
        setLpStep('PENDING')
        setLpMessage(data.message)
      }
    } catch {
      setLpError('Terjadi kesalahan koneksi jaringan.')
    } finally {
      setLpLoading(false)
    }
  }

  const handleExecuteResetPassword = async () => {
    if (lpPassBaru !== lpPassUlang) {
      setLpError('Password baru dan konfirmasi tidak cocok.')
      return
    }
    if (lpPassBaru.length < 4) {
      setLpError('Password minimal 4 karakter.')
      return
    }
    setLpError('')
    setLpLoading(true)
    try {
      const res = await fetch('/api/auth/execute-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: lpVerifiedId, username: lpUsername, newPassword: lpPassBaru })
      })
      const data = await res.json()
      if (!res.ok) {
        setLpError(data.error || 'Gagal mengubah password.')
        return
      }
      alert('✅ ' + (data.message || 'Password berhasil diperbarui! Silakan login.'))
      resetLupaPass()
      setTimeout(() => {
        usernameRef.current?.focus()
      }, 100)
    } catch {
      setLpError('Terjadi kesalahan koneksi. Coba lagi.')
    } finally {
      setLpLoading(false)
    }
  }

  const resetLupaPass = () => {
    setShowLupaPass(false)
    setLpStep('CHECK')
    setLpUsername('')
    setLpMessage('')
    setLpError('')
    setLpPassBaru('')
    setLpPassUlang('')
    setLpVerifiedId(null)
    setLpUserNama('')
  }

  return (
    <>
      <div id="layar-login">
        <div className="login-box">
          {/* Logo */}
          <div className="login-logo-wrap" style={{ width: 'auto', background: 'transparent', padding: 0, boxShadow: 'none' }}>
            <img src="/logo-sugity.jpg" alt="PT SUGITY CREATIVES" style={{ height: '70px', objectFit: 'contain', filter: 'url(#remove-black)' }} />
          </div>

          <h2>Sistem Maintenance</h2>
          <p className="sub">PT SUGITY CREATIVES &mdash; Molding Maintenance</p>

          <form onSubmit={handleLogin}>
            <div className="login-field">
              <label htmlFor="login-user">Username</label>
              <input
                ref={usernameRef}
                type="text"
                id="login-user"
                placeholder="Masukkan username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="login-field">
              <label htmlFor="login-pass">Password</label>
              <div className="login-pass-wrap">
                <input
                  type={showPass ? 'text' : 'password'}
                  id="login-pass"
                  placeholder="Masukkan password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="login-toggle-pass"
                  onClick={() => setShowPass(!showPass)}
                  aria-label={showPass ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn-login"
              disabled={loading}
            >
              {loading ? 'Memproses...' : 'Masuk'}
            </button>
          </form>

          {/* Error message */}
          <p className={`login-error ${error ? 'tampil' : ''}`}>
            {error}
          </p>

          {/* Lupa password link */}
          <p style={{ textAlign: 'center', marginTop: '14px' }}>
            <button
              type="button"
              onClick={() => setShowLupaPass(true)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--hijau-tua)',
                fontSize: '13.5px',
                fontWeight: 600,
                textDecoration: 'underline',
                cursor: 'pointer',
                width: 'auto',
                padding: 0,
              }}
            >
              Lupa password?
            </button>
          </p>

          <p className="login-foot">Molding Maintenance Report System</p>
        </div>
      </div>

      {/* ===== MODAL LUPA PASSWORD (ADMIN APPROVAL & SELF-SERVICE) ===== */}
      {showLupaPass && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) resetLupaPass() }}>
          <div className="modal-box" style={{ maxWidth: '440px', textAlign: 'left', borderRadius: '16px', overflow: 'hidden', padding: '24px', background: '#fff' }}>
            <div className="modal-tgl" style={{ fontSize: '19px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span>🔐</span> Lupa / Reset Password Akun
            </div>

            {lpStep === 'CHECK' && (
              <>
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: '12px 14px', borderRadius: '10px', fontSize: '13px', lineHeight: '1.5', marginBottom: '16px' }}>
                  💡 <b>Tanpa Email & Verifikasi OTP!</b><br/>
                  Masukkan <b>Username</b> akun Anda. Pengajuan reset akan dikirimkan ke <b>Super Admin</b> untuk disetujui. Jika sudah disetujui, Anda langsung dapat membuat password baru di jendela ini!
                </div>

                <label className="kecil" style={{ marginTop: 0, fontWeight: 700, color: '#334155' }}>Username Akun Anda</label>
                <input
                  type="text"
                  value={lpUsername}
                  onChange={(e) => setLpUsername(e.target.value)}
                  placeholder="Contoh: pic_danary / yudha"
                  autoComplete="off"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleCheckOrRequestReset(); }}
                  style={{ padding: '12px 14px', fontSize: '14px', borderRadius: '10px', border: '1px solid #cbd5e1', width: '100%', boxSizing: 'border-box', marginTop: '6px' }}
                />

                <p className={`login-error ${lpError ? 'tampil' : ''}`} style={{ marginTop: '10px' }}>{lpError}</p>
                <button
                  className="tombol-utama"
                  disabled={lpLoading}
                  style={{ marginTop: '14px', padding: '13px', fontSize: '15px', width: '100%', borderRadius: '12px', background: '#16a34a', color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer' }}
                  onClick={handleCheckOrRequestReset}
                >
                  {lpLoading ? '⏳ Memeriksa Akun...' : '🔍 Cek / Ajukan Reset Password'}
                </button>
              </>
            )}

            {lpStep === 'PENDING' && (
              <>
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', padding: '16px', borderRadius: '12px', fontSize: '13.5px', lineHeight: '1.6', marginBottom: '16px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 800, marginBottom: '6px', color: '#b45309', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>⏳ STATUS: PENDING APPROVAL ADMIN</span>
                  </div>
                  {lpMessage}
                </div>
                
                <div style={{ fontSize: '12.5px', color: '#64748b', background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  👨‍🔧 <b>Akun:</b> {lpUserNama} ({lpUsername})<br/>
                  💡 Anda dapat menutup jendela ini dan mencoba kembali setelah Super Admin menyetujui pengajuan Anda.
                </div>

                <button
                  className="tombol-utama"
                  style={{ marginTop: '20px', padding: '12px', fontSize: '14px', width: '100%', borderRadius: '10px', background: '#334155', color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer' }}
                  onClick={resetLupaPass}
                >
                  Tutup Jendela & Tunggu Approval
                </button>
              </>
            )}

            {lpStep === 'APPROVED' && (
              <>
                <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857', padding: '14px', borderRadius: '12px', fontSize: '13.5px', lineHeight: '1.5', marginBottom: '16px' }}>
                  <div style={{ fontWeight: 800, fontSize: '15px', marginBottom: '4px' }}>🎉 STATUS: DISETUJUI SUPER ADMIN!</div>
                  {lpMessage}
                </div>

                <div style={{ fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '12px' }}>
                  👤 Akun Terpilih: <span style={{ color: '#16a34a' }}>{lpUserNama} ({lpUsername})</span>
                </div>

                <label className="kecil" style={{ marginTop: 0, fontWeight: 700, color: '#334155' }}>Password Baru Anda</label>
                <input
                  type="password"
                  value={lpPassBaru}
                  onChange={(e) => setLpPassBaru(e.target.value)}
                  placeholder="Ketik password baru mandiri"
                  style={{ padding: '12px 14px', fontSize: '14px', borderRadius: '10px', border: '1px solid #cbd5e1', width: '100%', boxSizing: 'border-box', marginTop: '6px', marginBottom: '12px' }}
                />

                <label className="kecil" style={{ fontWeight: 700, color: '#334155' }}>Ulangi Password Baru</label>
                <input
                  type="password"
                  value={lpPassUlang}
                  onChange={(e) => setLpPassUlang(e.target.value)}
                  placeholder="Ketik ulang password baru Anda"
                  style={{ padding: '12px 14px', fontSize: '14px', borderRadius: '10px', border: '1px solid #cbd5e1', width: '100%', boxSizing: 'border-box', marginTop: '6px' }}
                />

                <p className={`login-error ${lpError ? 'tampil' : ''}`} style={{ marginTop: '10px' }}>{lpError}</p>
                
                <button
                  className="tombol-utama"
                  disabled={lpLoading}
                  style={{ marginTop: '16px', padding: '13px', fontSize: '15px', width: '100%', borderRadius: '12px', background: '#10b981', color: '#fff', fontWeight: 800, border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)' }}
                  onClick={handleExecuteResetPassword}
                >
                  {lpLoading ? '⏳ Menyimpan Password...' : '💾 Simpan & Pakai Password Baru'}
                </button>
              </>
            )}

            {lpStep === 'CHECK' && (
              <div className="modal-actions" style={{ marginTop: '16px', display: 'flex', justifyContent: 'center' }}>
                <button type="button" className="btn-modal-batal" style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontWeight: 600, fontSize: '13.5px' }} onClick={resetLupaPass}>Batal / Tutup</button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div id="layar-login">
        <div className="login-box">
          <div className="login-logo-wrap">
            <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
              <rect width="52" height="52" rx="14" fill="#1d6f42"/>
              <text x="26" y="34" textAnchor="middle" fill="white" fontSize="22" fontWeight="bold" fontFamily="Arial">S</text>
            </svg>
          </div>
          <h2>Memuat...</h2>
          <p className="sub">Mohon tunggu sebentar</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}

