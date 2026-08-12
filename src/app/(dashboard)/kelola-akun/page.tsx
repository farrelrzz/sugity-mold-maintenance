'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { showToast } from '@/components/ui/Toast'
import { confirmDialog } from '@/components/ui/ConfirmModal'
import Pagination from '@/components/ui/Pagination'

export default function KelolaAkunPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [users, setUsers] = useState<any[]>([])
  const [searchUser, setSearchUser] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(6)
  
  const [editingId, setEditingId] = useState<number | null>(null)
  
  const [nama, setNama] = useState('')
  const [nik, setNik] = useState('')
  const [tempatLahir, setTempatLahir] = useState('')
  const [tanggalLahir, setTanggalLahir] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('PIC')
  const [shift, setShift] = useState('Nonshift')
  const [signature, setSignature] = useState<string | null>(null)

  const [loading, setLoading] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(true)

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users')
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoadingUsers(false)
    }
  }

  const canManage = ['SUPER_ADMIN', 'SUPERADMIN', 'ADM'].includes(session?.user?.role || '')

  useEffect(() => {
    if (canManage) {
      fetchUsers()
    }
  }, [session, canManage])

  if (status === 'loading') return <p style={{ padding: '20px' }}>Loading...</p>

  if (!canManage) {
    return (
      <div className="kartu" style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Akses Ditolak</h2>
        <p>Hanya Super Admin & Admin yang diizinkan untuk mengakses halaman ini.</p>
        <button className="tombol-utama" onClick={() => router.push('/dashboard')}>Kembali ke Dashboard</button>
      </div>
    )
  }

  const resetForm = () => {
    setEditingId(null)
    setNama('')
    setNik('')
    setTempatLahir('')
    setTanggalLahir('')
    setUsername('')
    setPassword('')
    setRole('PIC')
    setShift('Nonshift')
    setSignature(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nama || !username) {
      showToast('Nama Lengkap dan Username wajib diisi!', 'error')
      return
    }
    
    if (!editingId && !password) {
      showToast('Password wajib diisi untuk akun baru!', 'error')
      return
    }

    setLoading(true)
    try {
      const url = editingId ? `/api/users/${editingId}` : '/api/users'
      const method = editingId ? 'PATCH' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama, nik, tempatLahir, tanggalLahir, username, password, role, shift, signature
        })
      })

      const data = await res.json()
      if (!res.ok) {
        showToast(data.error || 'Gagal menyimpan akun', 'error')
      } else {
        showToast(editingId ? 'Akun berhasil diperbarui! ✓' : 'Akun berhasil dibuat! ✓', 'sukses')
        resetForm()
        fetchUsers()
      }
    } catch (err) {
      showToast('Terjadi kesalahan jaringan', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (u: any) => {
    setEditingId(u.id)
    setNama(u.nama)
    setUsername(u.username)
    setRole(u.role)
    setShift(u.shift || 'Nonshift')
    setNik(u.nik || '')
    setTempatLahir(u.tempatLahir || '')
    setTanggalLahir(u.tanggalLahir ? new Date(u.tanggalLahir).toISOString().slice(0, 10) : '')
    setPassword('') 
    setSignature(u.signature || null)
  }

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      showToast('Ukuran file tanda tangan maksimal 5 MB!', 'error')
      e.target.value = ''
      return
    }
    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result as string
      // Resize menggunakan canvas agar ukuran file ringan di cloud
      const img = new Image()
      img.src = result
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const maxW = 350
        const scale = img.width > maxW ? maxW / img.width : 1
        canvas.width = img.width * scale
        canvas.height = img.height * scale
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          const optimized = canvas.toDataURL('image/png')
          setSignature(optimized)
        } else {
          setSignature(result)
        }
      }
    }
    reader.readAsDataURL(file)
  }

  const handleDelete = async (id: number) => {
    const isConfirmed = await confirmDialog({
      title: 'Hapus Akun?',
      message: 'Apakah Anda yakin ingin menghapus akun ini secara permanen? Semua akses dari pengguna ini akan dicabut.',
      type: 'danger',
      confirmText: 'Ya, Hapus'
    })
    if (!isConfirmed) return
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' })
      if (res.ok) {
        showToast('Akun berhasil dihapus', 'sukses')
        fetchUsers()
      } else {
        const data = await res.json()
        showToast(data.error || 'Gagal menghapus akun', 'error')
      }
    } catch (err) {
      showToast('Terjadi kesalahan jaringan', 'error')
    }
  }

  const handleApproveReset = async (userId: number, action: 'APPROVE' | 'REJECT' | 'RESET', username: string) => {
    try {
      const res = await fetch('/api/users/reset-approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action })
      })
      if (res.ok) {
        showToast(`Reset password ${username} berhasil ${action === 'APPROVE' ? 'Disetujui (Approved) ✓' : 'Ditolak/Dibatalkan'}`, 'sukses')
        fetchUsers()
      } else {
        const err = await res.json()
        showToast(err.error || 'Gagal memproses approval reset', 'error')
      }
    } catch {
      showToast('Terjadi kesalahan jaringan', 'error')
    }
  }

  const pendingResetUsers = users.filter(u => u.resetStatus === 'PENDING')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
      {pendingResetUsers.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
          border: '1px solid #f59e0b',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: '0 4px 16px rgba(245, 158, 11, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '26px' }}>🚨</span>
              <div>
                <h3 style={{ margin: 0, color: '#92400e', fontSize: '17px', fontWeight: 800 }}>
                  Permintaan Reset Password (Pending Approval)
                </h3>
                <p style={{ margin: '3px 0 0', color: '#b45309', fontSize: '13.5px', fontWeight: 500 }}>
                  Ada <b>{pendingResetUsers.length} akun</b> yang lupa password dan mengajukan izin ganti password. Jika disetujui, user dapat langsung mengatur password barunya sendiri pada saat login.
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '12px', marginTop: '4px' }}>
            {pendingResetUsers.map((u) => (
              <div key={u.id} style={{
                background: '#ffffff',
                border: '1px solid #fcd34d',
                borderRadius: '12px',
                padding: '14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '10px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
              }}>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>{u.nama}</div>
                  <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '2px' }}>Username: <b>{u.username}</b> • Role: <b style={{ color: '#d97706' }}>{u.role}</b></div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => handleApproveReset(u.id, 'APPROVE', u.username)}
                    style={{ background: '#10b981', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '8px', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)' }}
                    title="Setujui agar user bisa isi password baru"
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => handleApproveReset(u.id, 'REJECT', u.username)}
                    style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '8px', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
                    title="Tolak pengajuan"
                  >
                    ✕ Tolak
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div className="kartu" style={{ flex: '1 1 350px' }}>
        <p className="label-besar">{editingId ? '✏️ Edit Akun' : '➕ Tambah Pengguna Baru'}</p>
        <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
          <div style={{ marginBottom: '14px' }}>
            <label className="kecil">Nama Lengkap *</label>
            <input type="text" value={nama} onChange={e => setNama(e.target.value)} placeholder="Contoh: Budi Santoso" />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label className="kecil">Username *</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Contoh: budi123" />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label className="kecil">Password {editingId ? '(Isi jika ingin merubah password)' : '*'}</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={editingId ? "Ketik password baru jika ingin merubah" : "Minimal 4 karakter"} />
          </div>

          <div className="baris2" style={{ marginBottom: '14px' }}>
            <div>
              <label className="kecil">Role (Peran) *</label>
              <select value={role} onChange={e => setRole(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}>
                <option value="PIC">Member / PIC</option>
                <option value="TL">Team Leader (TL)</option>
                <option value="GL">Group Leader (GL)</option>
                <option value="ADM">Admin (ADM)</option>
                <option value="SUPER_ADMIN">Super Admin (SUPER_ADMIN)</option>
              </select>
            </div>
            <div>
              <label className="kecil">Shift *</label>
              <select value={shift} onChange={e => setShift(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}>
                <option value="Nonshift">Nonshift</option>
                <option value="Shift_A">Shift A</option>
                <option value="Shift_B">Shift B</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label className="kecil">NIK (Opsional)</label>
            <input type="text" value={nik} onChange={e => setNik(e.target.value)} placeholder="Nomor Induk Karyawan/KTP" />
          </div>

          <div className="baris2" style={{ marginBottom: '20px' }}>
            <div>
              <label className="kecil">Tempat Lahir (Opsional)</label>
              <input type="text" value={tempatLahir} onChange={e => setTempatLahir(e.target.value)} placeholder="Kota kelahiran" />
            </div>
            <div>
              <label className="kecil">Tanggal Lahir (Opsional)</label>
              <input type="date" value={tanggalLahir} onChange={e => setTanggalLahir(e.target.value)} />
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label className="kecil" style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>
              Upload Tanda Tangan {editingId ? '(Opsional, Biarkan jika tidak ingin ubah)' : '(Opsional)'} - Max 5MB
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleSignatureUpload}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '6px',
                border: '1px solid #ccc',
                background: '#fff',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            />
            {signature && (
              <div style={{ marginTop: '10px', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '12.5px', fontWeight: 'bold', color: '#64748b' }}>Preview TTD:</span>
                  <img src={signature} alt="TTD" style={{ maxHeight: '44px', objectFit: 'contain', border: '1px dashed #cbd5e1', padding: '2px', background: '#fff', borderRadius: '4px' }} />
                </div>
                <button
                  type="button"
                  onClick={() => setSignature(null)}
                  style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.15s' }}
                >
                  ✕ Hapus TTD
                </button>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" className="tombol-utama" disabled={loading} style={{ flex: 1 }}>
              {loading ? 'Menyimpan...' : (editingId ? '💾 Simpan Perubahan' : '➕ Buat Akun')}
            </button>
            {editingId && (
              <button type="button" className="tombol-sekunder" onClick={resetForm} style={{ flex: 1 }}>
                Batal Edit
              </button>
            )}
          </div>
        </form>
      </div>

      <div style={{ flex: '2 1 600px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <p style={{ fontSize: '18px', fontWeight: 800, color: '#003b30', margin: 0 }}>Daftar Akun Terdaftar</p>
          <input
            type="text"
            placeholder="🔍 Cari Nama, Username, Role..."
            value={searchUser}
            onChange={(e) => { setSearchUser(e.target.value); setCurrentPage(1); }}
            style={{
              padding: '8px 14px',
              borderRadius: '20px',
              border: '1px solid #cbd5e1',
              fontSize: '13.5px',
              fontWeight: 500,
              outline: 'none',
              minWidth: '220px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
            }}
          />
        </div>
        {loadingUsers ? (
          <p style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontWeight: 600 }}>⌛ Memuat daftar akun...</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(() => {
              const filteredUsers = users.filter(u => {
                const s = searchUser.toLowerCase()
                return u.nama.toLowerCase().includes(s) ||
                       u.username.toLowerCase().includes(s) ||
                       u.role.toLowerCase().includes(s) ||
                       (u.nik && String(u.nik).toLowerCase().includes(s))
              })
              const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

              if (filteredUsers.length === 0) {
                return (
                  <div style={{ padding: '30px 20px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', color: '#64748b' }}>
                    Tidak ada akun yang sesuai dengan pencarian Anda.
                  </div>
                )
              }

              return (
                <>
                  {paginatedUsers.map(u => {
                    const isSuperAdmin = u.role === 'SUPER_ADMIN' || u.role === 'SUPERADMIN'
                    const roleName = u.role === 'PIC' ? 'Member' : u.role === 'TL' ? 'Team Leader' : u.role === 'GL' ? 'Group Leader' : isSuperAdmin ? 'Super Admin' : 'ADM'
                    return (
                      <div
                        key={u.id}
                        onClick={() => handleEdit(u)}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                          padding: '14px 18px',
                          background: '#fff',
                          border: '1px solid #e2e8f0',
                          borderLeft: `6px solid ${isSuperAdmin ? '#7c3aed' : '#14553b'}`,
                          borderRadius: '12px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.06)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
                      >
                        {/* Atas: Badge, Nama, Hapus */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                            <span style={{
                              background: isSuperAdmin ? '#7c3aed' : '#de7a38',
                              color: '#fff',
                              padding: '4px 12px',
                              borderRadius: '20px',
                              fontSize: '12px',
                              fontWeight: 800,
                              letterSpacing: '0.3px',
                              textTransform: 'uppercase'
                            }}>
                              {roleName}
                            </span>
                            <span style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                              {u.nama}
                            </span>
                            {u.signature && (
                              <span style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '3px 10px', borderRadius: '12px', fontSize: '11.5px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                ✍️ TTD Ready
                              </span>
                            )}
                            {u.resetStatus === 'PENDING' && (
                              <span style={{ background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a', padding: '3px 10px', borderRadius: '12px', fontSize: '11.5px', fontWeight: 800 }}>
                                ⏳ Reset Pending
                              </span>
                            )}
                            {u.resetStatus === 'APPROVED' && (
                              <span style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', padding: '3px 10px', borderRadius: '12px', fontSize: '11.5px', fontWeight: 800 }}>
                                🎉 Reset Approved (Menunggu User Input)
                              </span>
                            )}
                          </div>
                          {u.id !== session?.user?.id && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDelete(u.id); }}
                              style={{
                                background: '#fef2f2',
                                color: '#ef4444',
                                border: '1px solid #fecaca',
                                padding: '6px 14px',
                                borderRadius: '8px',
                                fontSize: '12.5px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.15s'
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = '#fff'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#ef4444'; }}
                            >
                              🗑️ Hapus
                            </button>
                          )}
                        </div>
                        {/* Bawah: Username & NIK */}
                        <div style={{ fontSize: '13.5px', color: '#475569', display: 'flex', gap: '8px', alignItems: 'center', marginTop: '2px' }}>
                          <span>Username: <b style={{ color: '#0f172a' }}>{u.username}</b></span>
                          <span style={{ color: '#14553b', fontWeight: 'bold' }}>•</span>
                          <span>NIK: <b style={{ color: '#0f172a' }}>{u.nik || '-'}</b></span>
                        </div>
                      </div>
                    )
                  })}

                  <Pagination
                    currentPage={currentPage}
                    totalItems={filteredUsers.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={setItemsPerPage}
                    itemLabel="akun"
                    pageSizeOptions={[5, 6, 10, 20]}
                  />
                </>
              )
            })()}
          </div>
        )}
      </div>
    </div>
    </div>
  )
}
