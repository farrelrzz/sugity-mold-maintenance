'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { showToast } from '@/components/ui/Toast'

interface UserOption {
  id: number
  nama: string
  role: string
  shift: string | null
}

interface MoldSpec {
  noMold: string
  mc: string | null
  factory: string
  part: string | null
  tonase: string | null
  customer: string | null
  model: string | null
  coreStd: string | null
  cavStd: string | null
  heaterStd: any // array of numbers or strings
  outhouseId?: number | null
  lokasiMold?: string | null
  outhouse?: any
  dimensiW?: string | null
  dimensiH?: string | null
  dimensiT?: string | null
}

interface JadwalEntry {
  id: number
  tanggalRencana: string
  noMold: string
  picId: number
  hari: string
  jenis: string
  catatan: string | null
  status: string
  pic: {
    nama: string
  }
}

export default function LaporanBaruPage() {
  const router = useRouter()
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === 'authenticated') {
      const role = session?.user?.role
      if (role === 'GL' || role === 'CL' || role === 'ADM') {
        router.push('/riwayat')
      }
    }
  }, [status, session, router])

  // Form states
  const [tanggal, setTanggal] = useState('')
  const [shift, setShift] = useState('Nonshift')
  const [jenis, setJenis] = useState('OH MOLD')
  const [jenisLainnya, setJenisLainnya] = useState('')

  // Mold Search & Autocomplete (for Laporan)
  const [moldSearch, setMoldSearch] = useState('')
  const [moldOptions, setMoldOptions] = useState<MoldSpec[]>([])
  const [showMoldDropdown, setShowMoldDropdown] = useState(false)
  const [selectedMold, setSelectedMold] = useState<MoldSpec | null>(null)

  // Cooling & Heater actuals
  const [coreActual, setCoreActual] = useState('')
  const [cavActual, setCavActual] = useState('')
  const [heaterStatus, setHeaterStatus] = useState<'OK' | 'NG' | null>(null)
  const [heaterActuals, setHeaterActuals] = useState<string[]>([])
  const [shotCycle, setShotCycle] = useState('')
  const [shotMonth, setShotMonth] = useState('')

  // Info & CM
  const [info, setInfo] = useState('')
  const [countermeasure, setCountermeasure] = useState('')
  const [tempProblems, setTempProblems] = useState<string[]>([])
  const [tempCms, setTempCms] = useState<string[]>([])

  // PIC & Time
  const [picOptions, setPicOptions] = useState<UserOption[]>([]) // all PICs
  const [selectedPics, setSelectedPics] = useState<{ nama: string; shift: string }[]>([])
  const [picTambahan, setPicTambahan] = useState('')
  const [picTambahanShift, setPicTambahanShift] = useState('Nonshift')
  const [jamMulai, setJamMulai] = useState('')
  const [jamSelesai, setJamSelesai] = useState('')
  const [loading, setLoading] = useState(false)

  // Collapsible Jadwal
  const [daftarJadwal, setDaftarJadwal] = useState<JadwalEntry[]>([])
  const [bannerJadwal, setBannerJadwal] = useState<JadwalEntry | null>(null)

  // Modal Tambah & Hapus Mold
  const [showTambahMold, setShowTambahMold] = useState(false)
  const [newMoldNo, setNewMoldNo] = useState('')
  const [newMoldPart, setNewMoldPart] = useState('')
  const [newMoldFactory, setNewMoldFactory] = useState('F2')
  const [newMoldTonase, setNewMoldTonase] = useState('')
  const [newMoldCustomer, setNewMoldCustomer] = useState('')
  const [newMoldModel, setNewMoldModel] = useState('')
  const [newMoldCore, setNewMoldCore] = useState('')
  const [newMoldCav, setNewMoldCav] = useState('')
  const [tambahError, setTambahError] = useState('')

  const [showHapusMold, setShowHapusMold] = useState(false)
  const [hapusSearch, setHapusSearch] = useState('')
  const [hapusOptions, setHapusOptions] = useState<MoldSpec[]>([])
  const [selectedHapusMold, setSelectedHapusMold] = useState<MoldSpec | null>(null)
  const [hapusError, setHapusError] = useState('')

  // ===== DYNAMIC OPTIONS =====
  const [problemOptions, setProblemOptions] = useState<{id: number, value: string}[]>([])
  const [cmOptions, setCmOptions] = useState<{id: number, value: string}[]>([])
  const [newProblem, setNewProblem] = useState('')
  const [newCm, setNewCm] = useState('')

  const fetchOptions = async () => {
    try {
      const res = await fetch('/api/report-options')
      if (res.ok) {
        const data = await res.json()
        setProblemOptions(data.filter((d: any) => d.category === 'PROBLEM'))
        setCmOptions(data.filter((d: any) => d.category === 'COUNTERMEASURE'))
      }
    } catch (error) {
      console.error('Failed to fetch options', error)
    }
  }

  useEffect(() => {
    fetchOptions()
  }, [])

  const handleAddTempProblem = () => {
    if (!newProblem.trim()) {
      showToast('Ketik kalimat problem terlebih dahulu!', 'info')
      return
    }
    const val = newProblem.trim()
    setTempProblems(prev => prev.some(p => p.toLowerCase() === val.toLowerCase()) ? prev : [...prev, val])
    setInfo(prev => {
      const parts = prev ? prev.split(',').map(s => s.trim()).filter(Boolean) : []
      return !parts.some(p => p.toLowerCase() === val.toLowerCase()) ? [...parts, val].join(', ') : prev
    })
    setNewProblem('')
    showToast('Kalimat sekali pakai berhasil ditambahkan ke laporan! ✓', 'sukses')
  }

  const handleAddTempCm = () => {
    if (!newCm.trim()) {
      showToast('Ketik kalimat countermeasure terlebih dahulu!', 'info')
      return
    }
    const val = newCm.trim()
    setTempCms(prev => prev.some(p => p.toLowerCase() === val.toLowerCase()) ? prev : [...prev, val])
    setCountermeasure(prev => {
      const parts = prev ? prev.split(',').map(s => s.trim()).filter(Boolean) : []
      return !parts.some(p => p.toLowerCase() === val.toLowerCase()) ? [...parts, val].join(', ') : prev
    })
    setNewCm('')
    showToast('Tindakan sekali pakai berhasil ditambahkan ke laporan! ✓', 'sukses')
  }

  const handleAddOption = async (category: string, value: string) => {
    if (!value.trim()) return
    try {
      const res = await fetch('/api/report-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, value })
      })
      if (res.ok) {
        showToast('Opsi permanen berhasil disimpan & dipilih! ✓')
        if (category === 'PROBLEM') {
          const val = newProblem.trim()
          setInfo(prev => {
            const parts = prev ? prev.split(',').map(s => s.trim()).filter(Boolean) : []
            return !parts.some(p => p.toLowerCase() === val.toLowerCase()) ? [...parts, val].join(', ') : prev
          })
          setNewProblem('')
        }
        if (category === 'COUNTERMEASURE') {
          const val = newCm.trim()
          setCountermeasure(prev => {
            const parts = prev ? prev.split(',').map(s => s.trim()).filter(Boolean) : []
            return !parts.some(p => p.toLowerCase() === val.toLowerCase()) ? [...parts, val].join(', ') : prev
          })
          setNewCm('')
        }
        fetchOptions()
      } else {
        showToast('Gagal menambahkan opsi', 'error')
      }
    } catch (e) {
      showToast('Terjadi kesalahan jaringan', 'error')
    }
  }

  const handleDeleteOption = async (id: number) => {
    if (!confirm('Hapus opsi ini permanen?')) return
    try {
      const res = await fetch(`/api/report-options/${id}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        showToast('Opsi berhasil dihapus ✓')
        fetchOptions()
      } else {
        showToast('Gagal menghapus opsi', 'error')
      }
    } catch (e) {
      showToast('Terjadi kesalahan jaringan', 'error')
    }
  }

  const dropdownRef = useRef<HTMLDivElement>(null)
  const jmDropdownRef = useRef<HTMLDivElement>(null)
  const hapusDropdownRef = useRef<HTMLDivElement>(null)

  // Set default tanggal hari ini
  useEffect(() => {
    const today = new Date()
    setTanggal(today.toISOString().split('T')[0])
  }, [])

  // ===== JADWAL MINGGUAN =====
  const [showJadwal, setShowJadwal] = useState(false)
  const [bulanJadwal, setBulanJadwal] = useState(() => new Date().toISOString().slice(0, 7))
  const [mingguJadwal, setMingguJadwal] = useState(0) // Index minggu terpilih (0 = minggu ke-1)
  
  // Helpers untuk mendapatkan struktur minggu
  const formatTanggalLokal = (d: Date) => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  const getWeeksInMonth = (bulanYYYYMM: string) => {
    const [tahun, bln] = bulanYYYYMM.split('-').map(Number)
    const weeks: Date[][] = []
    
    let cursor = new Date(tahun, bln - 1, 1)
    // Cari Senin di minggu pertama
    const selisih = cursor.getDay() === 0 ? -6 : 1 - cursor.getDay()
    cursor.setDate(cursor.getDate() + selisih)
    
    for (let i = 0; i < 6; i++) { // maksimal 6 minggu dalam sebulan
      let hariDiBulan = 0
      const weekDays: Date[] = []
      
      for (let d = 0; d < 7; d++) {
        const h = new Date(cursor)
        weekDays.push(h)
        if (h.getFullYear() === tahun && h.getMonth() === bln - 1) {
          hariDiBulan++
        }
        cursor.setDate(cursor.getDate() + 1)
      }
      
      if (hariDiBulan >= 1) { // Jika ada setidaknya 1 hari di bulan ini, hitung sebagai minggu bulan tersebut
        weeks.push(weekDays)
      }
    }
    return weeks
  }

  const weeksOfSelectedMonth = getWeeksInMonth(bulanJadwal)
  const selectedWeekDays = weeksOfSelectedMonth[mingguJadwal] || []

  // Rencana Jadwal Input States
  const [jmMoldSearch, setJmMoldSearch] = useState('')
  const [jmMoldOptions, setJmMoldOptions] = useState<MoldSpec[]>([])
  const [showJmMoldDropdown, setShowJmMoldDropdown] = useState(false)
  const [jmSelectedMold, setJmSelectedMold] = useState<MoldSpec | null>(null)
  const [jmPicId, setJmPicId] = useState('')
  const [jmTanggal, setJmTanggal] = useState('') // Tanggal aktual yang dipilih dari 7 hari
  const [jmJenis, setJmJenis] = useState('OH MOLD')
  const [jmCatatan, setJmCatatan] = useState('')
  
  // Set default jmTanggal when selectedWeekDays changes
  useEffect(() => {
    if (selectedWeekDays.length > 0) {
      setJmTanggal(formatTanggalLokal(selectedWeekDays[0]))
    }
  }, [mingguJadwal, bulanJadwal])

  // Fetch users & PICs (filter role: 'PIC')
  useEffect(() => {
    fetch('/api/users')
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data.users || []
        // Filter role PIC untuk pilihan PIC pendamping
        const pics = list.filter((u: any) => u.role === 'PIC')
        setPicOptions(pics)
      })
      .catch((err) => console.error('Gagal mengambil daftar PIC:', err))
  }, [])

  // Fetch daftar jadwal mingguan berdasarkan startDate dan endDate minggu terpilih
  const loadJadwalMingguan = () => {
    if (!selectedWeekDays || selectedWeekDays.length === 0) return
    const startDate = formatTanggalLokal(selectedWeekDays[0])
    const endDate = formatTanggalLokal(selectedWeekDays[6])

    fetch(`/api/jadwal?startDate=${startDate}&endDate=${endDate}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setDaftarJadwal(data)
        }
      })
      .catch((err) => console.error('Gagal mengambil jadwal:', err))
  }

  useEffect(() => {
    loadJadwalMingguan()
  }, [bulanJadwal, mingguJadwal])

  // Handle outside click for mold dropdowns
  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowMoldDropdown(false)
      }
      if (jmDropdownRef.current && !jmDropdownRef.current.contains(event.target as Node)) {
        setShowJmMoldDropdown(false)
      }
      if (hapusDropdownRef.current && !hapusDropdownRef.current.contains(event.target as Node)) {
        setHapusOptions([])
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  // Search mold options dynamically (Laporan Form)
  // Search mold options dynamically (Laporan Form)
  useEffect(() => {
    const timer = setTimeout(() => {
      const url = moldSearch.trim()
        ? `/api/mold-book?query=${encodeURIComponent(moldSearch)}&limit=100`
        : `/api/mold-book?limit=100`
      fetch(url)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setMoldOptions(data)
          }
        })
        .catch((err) => console.error(err))
    }, 200)

    return () => clearTimeout(timer)
  }, [moldSearch])

  // Search mold options dynamically (Jadwal Form)
  useEffect(() => {
    const timer = setTimeout(() => {
      const url = jmMoldSearch.trim()
        ? `/api/mold-book?query=${encodeURIComponent(jmMoldSearch)}&limit=100`
        : `/api/mold-book?limit=100`
      fetch(url)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setJmMoldOptions(data)
          }
        })
        .catch((err) => console.error(err))
    }, 200)

    return () => clearTimeout(timer)
  }, [jmMoldSearch])

  // Search mold options dynamically (Hapus Mold Modal)
  useEffect(() => {
    const timer = setTimeout(() => {
      const url = hapusSearch.trim()
        ? `/api/mold-book?query=${encodeURIComponent(hapusSearch)}&limit=100`
        : `/api/mold-book?limit=100`
      fetch(url)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setHapusOptions(data)
          }
        })
        .catch((err) => console.error(err))
    }, 200)

    return () => clearTimeout(timer)
  }, [hapusSearch])

  // Reset actuals when selected mold changes
  useEffect(() => {
    if (selectedMold) {
      setCoreActual('')
      setCavActual('')
      setShotCycle('')
      setShotMonth('')
      const stdCount = Array.isArray(selectedMold.heaterStd) ? selectedMold.heaterStd.length : 0
      setHeaterActuals(new Array(stdCount).fill(''))
    } else {
      setHeaterActuals([])
    }
  }, [selectedMold])

  // Hitung durasi jam kerja
  const getDurasiJam = () => {
    if (!jamMulai || !jamSelesai) return 0
    const [hStart, mStart] = jamMulai.split(':').map(Number)
    const [hEnd, mEnd] = jamSelesai.split(':').map(Number)
    let diffMinutes = (hEnd * 60 + mEnd) - (hStart * 60 + mStart)
    if (diffMinutes < 0) {
      diffMinutes += 24 * 60
    }
    return diffMinutes / 60
  }

  // Hitung estimasi Man Power Cost (menggunakan rate 89.595)
  const hitungEstimasiMpCost = () => {
    const totalPics = Math.max(1, selectedPics.length)
    const durasiJam = getDurasiJam()
    if (durasiJam <= 0) return 0
    return Math.round(durasiJam * 89595 * totalPics)
  }

  // Quick Tags Helpers (Toggle behavior & no duplicates)
  const isTagSelected = (currentText: string, tag: string) => {
    if (!currentText || !tag) return false
    const parts = currentText.split(',').map(s => s.trim()).filter(Boolean)
    return parts.some(p => p.toLowerCase() === tag.trim().toLowerCase())
  }

  const handleToggleProblemTag = (val: string) => {
    setInfo((prev) => {
      const tag = val.trim()
      if (!tag) return prev
      const parts = prev ? prev.split(',').map(s => s.trim()).filter(Boolean) : []
      const exists = parts.some(p => p.toLowerCase() === tag.toLowerCase())
      if (exists) {
        return parts.filter(p => p.toLowerCase() !== tag.toLowerCase()).join(', ')
      } else {
        return [...parts, tag].join(', ')
      }
    })
  }

  const handleToggleCmTag = (val: string) => {
    setCountermeasure((prev) => {
      const tag = val.trim()
      if (!tag) return prev
      const parts = prev ? prev.split(',').map(s => s.trim()).filter(Boolean) : []
      const exists = parts.some(p => p.toLowerCase() === tag.toLowerCase())
      if (exists) {
        return parts.filter(p => p.toLowerCase() !== tag.toLowerCase()).join(', ')
      } else {
        return [...parts, tag].join(', ')
      }
    })
  }

  // Toggle PIC pendamping
  const handleTogglePic = (picItem: { nama: string; shift: string }) => {
    setSelectedPics((prev) => {
      if (prev.some(p => p.nama === picItem.nama)) {
        return prev.filter((p) => p.nama !== picItem.nama)
      } else {
        return [...prev, picItem]
      }
    })
  }

  const handleAddPicTambahan = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      await addPic()
    }
  }

  const handleAddPicTambahanClick = async () => {
    await addPic()
  }

  const addPic = async () => {
    if (picTambahan.trim()) {
      const nama = picTambahan.trim()
      const shift = picTambahanShift
      
      const payload = {
        nama,
        username: nama.toLowerCase().replace(/ /g, '.').substring(0, 50),
        password: 'password123',
        role: 'PIC',
        shift,
      }

      try {
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        const data = await res.json()
        if (data.ok) {
          const newPic = { id: data.userId, nama, shift, role: 'PIC' }
          setPicOptions(prev => [...prev, newPic])
          if (!selectedPics.some(p => p.nama === nama)) {
            setSelectedPics((prev) => [...prev, { nama, shift }])
          }
          setPicTambahan('')
        } else {
          showToast(data.error || 'Gagal menambahkan PIC', 'error')
        }
      } catch (err) {
        showToast('Terjadi kesalahan jaringan', 'error')
      }
    }
  }

  const handleRemovePicOption = async (picId: number, picNama: string) => {
    if (!confirm(`Hapus PIC ${picNama} dari database?`)) return
    try {
      const res = await fetch(`/api/users/${picId}`, { method: 'DELETE' })
      if (res.ok) {
        setPicOptions(prev => prev.filter(p => p.id !== picId))
        setSelectedPics(prev => prev.filter(p => p.nama !== picNama))
      } else {
        const data = await res.json()
        showToast(data.error || 'Gagal menghapus PIC', 'error')
      }
    } catch (err) {
      showToast('Terjadi kesalahan', 'error')
    }
  }

  // Simpan Jadwal Mingguan Baru ke Database
  const handleSimpanJadwalMingguan = async () => {
    if (!jmSelectedMold || !jmPicId || !jmTanggal || !jmJenis) {
      showToast('Mohon lengkapi seluruh field untuk jadwal mingguan!', 'error')
      return
    }

    // Hitung nama hari dari tanggal yang dipilih
    const d = new Date(jmTanggal)
    const namaHari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][d.getDay()]

    const payload = {
      tanggalRencana: jmTanggal,
      noMold: jmSelectedMold.noMold,
      picId: Number(jmPicId),
      hari: namaHari,
      jenis: jmJenis,
      catatan: jmCatatan,
    }

    try {
      const res = await fetch('/api/jadwal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json()
        showToast(err.error || 'Gagal menyimpan jadwal', 'error')
      } else {
        showToast('Jadwal mingguan berhasil ditambahkan! ✓')
        setJmMoldSearch('')
        setJmSelectedMold(null)
        setJmCatatan('')
        loadJadwalMingguan()
      }
    } catch {
      showToast('Kesalahan jaringan saat menyimpan jadwal', 'error')
    }
  }

  // Hapus Jadwal Mingguan
  const handleHapusJadwal = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus rencana jadwal ini?')) return

    try {
      const res = await fetch(`/api/jadwal/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        showToast('Gagal menghapus jadwal', 'error')
      } else {
        showToast('Jadwal berhasil dihapus ✓')
        loadJadwalMingguan()
      }
    } catch {
      showToast('Kesalahan jaringan', 'error')
    }
  }

  // Isi Laporan dari Jadwal
  const handleIsiDariJadwal = (item: JadwalEntry) => {
    setBannerJadwal(item)
    // Cari data mold lengkap
    fetch(`/api/mold-book?query=${item.noMold}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const mold = data.find((m) => m.noMold === item.noMold) || data[0]
          setSelectedMold(mold)
          setMoldSearch(mold.noMold)
        }
      })
    setJenis(item.jenis)
    // Coba pasang PIC utama pembuat laporan
    if (session?.user) {
      // Set PIC utama login
    }
    showToast(`Data jadwal mold ${item.noMold} ter-load! Lengkapi form untuk menyimpan laporan.`, 'info')
    // Scroll ke form
    document.getElementById('kartu-tanggal-shift')?.scrollIntoView({ behavior: 'smooth' })
  }

  // Simpan Laporan Akhir
  const handleSave = async () => {
    if (!tanggal || !selectedMold || !jenis) {
      showToast('Mohon lengkapi Tanggal, Jenis Pekerjaan, dan Nomor Mold!', 'error')
      return
    }

    setLoading(true)

    const payload = {
      noMold: selectedMold.noMold,
      jenis: jenis === 'LAINNYA' ? jenisLainnya || 'Lainnya' : jenis,
      factory: selectedMold.factory,
      shift,
      picId: session?.user?.id ? Number(session.user.id) : 1,
      tanggal,
      part: selectedMold.part,
      komentar: '',
      coreActual,
      cavActual,
      heaterActual: heaterStatus === 'OK' ? ['OK'] : heaterActuals,
      shotCycle,
      shotMonth,
      info,
      countermeasure,
      jamMulai,
      jamSelesai,
      picList: selectedPics,
      jadwalId: bannerJadwal ? bannerJadwal.id : null,
    }

    try {
      const res = await fetch('/api/laporan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json()
        showToast(err.error || 'Gagal menyimpan laporan', 'error')
      } else {
        showToast('Laporan berhasil disimpan! ✓')
        router.push('/riwayat')
      }
    } catch {
      showToast('Terjadi kesalahan jaringan', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Simpan Mold Baru
  const handleSaveMoldBaru = async () => {
    setTambahError('')
    if (!newMoldNo || !newMoldPart || !newMoldFactory) {
      setTambahError('Nomor Mold, Nama Part, dan Factory wajib diisi!')
      return
    }

    try {
      const res = await fetch('/api/mold-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noMold: newMoldNo,
          part: newMoldPart,
          factory: newMoldFactory,
          tonase: newMoldTonase,
          customer: newMoldCustomer,
          model: newMoldModel,
          coreStd: newMoldCore,
          cavStd: newMoldCav,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setTambahError(data.error || 'Gagal menyimpan mold.')
      } else {
        showToast('Mold baru berhasil ditambahkan! ✓')
        setSelectedMold(data)
        setMoldSearch(data.noMold)
        setShowTambahMold(false)
        // Reset states
        setNewMoldNo('')
        setNewMoldPart('')
        setNewMoldTonase('')
        setNewMoldCustomer('')
        setNewMoldModel('')
        setNewMoldCore('')
        setNewMoldCav('')
      }
    } catch {
      setTambahError('Kesalahan jaringan.')
    }
  }

  // Hapus Mold dari Database
  const handleDeleteMold = async () => {
    setHapusError('')
    if (!selectedHapusMold) {
      setHapusError('Pilih mold yang ingin dihapus terlebih dahulu!')
      return
    }

    if (!confirm(`Hapus mold ${selectedHapusMold.noMold} dari database?`)) return

    try {
      const res = await fetch(`/api/mold-book/${encodeURIComponent(selectedHapusMold.noMold)}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json()
        setHapusError(data.error || 'Gagal menghapus mold.')
      } else {
        showToast('Mold berhasil dihapus dari database! ✓')
        if (selectedMold?.noMold === selectedHapusMold.noMold) {
          setSelectedMold(null)
          setMoldSearch('')
        }
        setSelectedHapusMold(null)
        setHapusSearch('')
        setShowHapusMold(false)
      }
    } catch {
      setHapusError('Kesalahan jaringan.')
    }
  }

  return (
    <>
      <section>
        {/* Banner Dari Jadwal */}
        {bannerJadwal && (
          <div className="kartu" style={{ background: 'var(--hijau-bg)', borderColor: 'var(--hijau)' }}>
            <p style={{ margin: 0, fontWeight: 700, color: 'var(--hijau-tua)', fontSize: '14px', display: 'flex', justifyContent: 'space-between' }}>
              <span>📅 Mengisi laporan dari Jadwal Mingguan: Mold <strong>{bannerJadwal.noMold}</strong> ({bannerJadwal.jenis})</span>
              <button
                type="button"
                style={{ background: 'none', border: 'none', color: 'var(--merah)', fontWeight: 'bold', cursor: 'pointer', padding: 0 }}
                onClick={() => setBannerJadwal(null)}
              >
                Batalkan ✕
              </button>
            </p>
          </div>
        )}

        {/* Jadwal Maintenance Mingguan Card */}
        <div className="kartu" id="kartu-jadwal-mingguan">
          <div
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
            onClick={() => setShowJadwal(!showJadwal)}
          >
            <p className="label-besar" style={{ margin: 0 }}>📅 Jadwal Maintenance Mingguan</p>
            <span style={{ fontSize: '18px', color: 'var(--teks-redup)', transform: showJadwal ? 'rotate(180deg)' : 'none', transition: '.2s' }}>
              ▼
            </span>
          </div>

          {showJadwal && (
            <div style={{ marginTop: '14px' }} id="jadwal-mingguan-isi">
              <p className="pertanyaan">Buat rencana maintenance mingguan per mold. Jadwal ini tersimpan bersama dan terlihat oleh seluruh anggota.</p>

              {/* Rencana Input Jadwal Baru */}
              <div style={{ background: 'var(--krem)', padding: '14px', borderRadius: 'var(--radius)', marginBottom: '16px' }}>
                <b style={{ color: 'var(--hijau-tua)', fontSize: '14px', display: 'block', marginBottom: '8px' }}>+ Tambah Jadwal Rencana</b>
                
                <div className="baris2">
                  <div>
                    <label className="kecil" style={{ marginTop: 0 }}>Bulan Rencana</label>
                    <input type="month" value={bulanJadwal} onChange={(e) => setBulanJadwal(e.target.value)} />
                  </div>
                  <div>
                    <label className="kecil" style={{ marginTop: 0 }}>Minggu Ke-</label>
                    <select value={mingguJadwal} onChange={(e) => setMingguJadwal(Number(e.target.value))}>
                      {weeksOfSelectedMonth.map((_, i) => (
                        <option key={i} value={i}>Minggu ke-{i + 1}</option>
                      ))}
                    </select>
                  </div>
                  <div ref={jmDropdownRef}>
                    <label className="kecil" style={{ marginTop: 0 }}>Nomor Mold</label>
                    <div className="mold-search-wrap">
                      <input
                        type="text"
                        placeholder="Cari Mold..."
                        autoComplete="off"
                        value={jmMoldSearch}
                        onChange={(e) => {
                          setJmMoldSearch(e.target.value)
                          setShowJmMoldDropdown(true)
                        }}
                        onFocus={() => setShowJmMoldDropdown(true)}
                      />
                      {showJmMoldDropdown && jmMoldOptions.length > 0 && (
                        <div className="mold-dropdown" style={{ position: 'relative', marginTop: '4px', zIndex: 9999 }}>
                          {jmMoldOptions.map((opt) => (
                            <div key={opt.noMold} className="mold-opt" onClick={() => {
                              setJmSelectedMold(opt)
                              setJmMoldSearch(opt.noMold)
                              setShowJmMoldDropdown(false)
                            }}>
                              <span className="mold-opt-no">{opt.noMold}</span>
                              <span className="mold-opt-nama">{opt.part}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="baris2" style={{ marginTop: '10px' }}>
                  <div>
                    <label className="kecil" style={{ marginTop: 0 }}>Tanggal / Hari</label>
                    <select value={jmTanggal} onChange={(e) => setJmTanggal(e.target.value)}>
                      {selectedWeekDays.map((d, i) => {
                        const namaHari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][d.getDay()]
                        const tglFormat = formatTanggalLokal(d)
                        const tglDisplay = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
                        return (
                          <option key={i} value={tglFormat}>{namaHari}, {tglDisplay}</option>
                        )
                      })}
                    </select>
                  </div>
                  <div>
                    <label className="kecil" style={{ marginTop: 0 }}>Jenis Pekerjaan</label>
                    <select value={jmJenis} onChange={(e) => setJmJenis(e.target.value)}>
                      <option value="OH MOLD">OH Mold</option>
                      <option value="PM">PM (Preventive)</option>
                      <option value="I/M">I/M</option>
                      <option value="B/M">B/M</option>
                    </select>
                  </div>
                </div>

                <div className="baris2" style={{ marginTop: '10px' }}>
                  <div>
                    <label className="kecil" style={{ marginTop: 0 }}>PIC Ditugaskan</label>
                    <select value={jmPicId} onChange={(e) => setJmPicId(e.target.value)}>
                      <option value="">-- Pilih PIC --</option>
                      {picOptions.map((u) => (
                        <option key={u.id} value={u.id}>{u.nama}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="kecil" style={{ marginTop: 0 }}>Catatan (opsional)</label>
                    <input type="text" placeholder="Catatan tambahan" value={jmCatatan} onChange={(e) => setJmCatatan(e.target.value)} />
                  </div>
                </div>

                <button
                  type="button"
                  className="tombol-utama"
                  style={{ marginTop: '14px', padding: '10px' }}
                  onClick={handleSimpanJadwalMingguan}
                >
                  + Tambah ke Jadwal
                </button>
              </div>

              {/* Header List Minggu Ini */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', borderTop: '1px dashed var(--garis)', paddingTop: '14px' }}>
                <b style={{ fontSize: '14px', color: 'var(--hijau-tua)' }}>
                  Jadwal Minggu ke-{mingguJadwal + 1} ({selectedWeekDays.length > 0 ? `${formatTanggalLokal(selectedWeekDays[0])} s/d ${formatTanggalLokal(selectedWeekDays[selectedWeekDays.length - 1])}` : ''})
                </b>
              </div>

              {/* List Jadwal Mingguan */}
              <div id="jadwal-daftar" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {daftarJadwal.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--teks-redup)' }}>
                    Belum ada rencana jadwal untuk minggu ini.
                  </div>
                ) : (
                  daftarJadwal.map((item) => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fafaf9', border: '1px solid var(--garis)', borderRadius: '8px', padding: '10px 14px' }}>
                      <div>
                        <span className="tag oranye" style={{ fontSize: '11px', padding: '2px 8px' }}>{item.jenis}</span>
                        <span className="tag netral" style={{ fontSize: '11px', padding: '2px 8px' }}>
                          {item.hari}, {item.tanggalRencana ? new Date(item.tanggalRencana).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) : ''}
                        </span>
                        <div style={{ fontSize: '15px', fontWeight: 'bold', marginTop: '4px' }}>
                          {item.noMold} <span style={{ fontWeight: 'normal', fontSize: '13px', color: 'var(--teks-redup)' }}>&mdash; PIC: {item.pic.nama}</span>
                        </div>
                        {item.catatan && <div style={{ fontSize: '12px', color: 'var(--teks-redup)', marginTop: '2px' }}>Note: {item.catatan}</div>}
                      </div>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        {item.status === 'Belum_Dikerjakan' && (
                          <button
                            type="button"
                            className="pilih-btn terpilih"
                            style={{ padding: '6px 10px', fontSize: '12px' }}
                            onClick={() => handleIsiDariJadwal(item)}
                          >
                            Isi Laporan
                          </button>
                        )}
                        {(item.status === 'Sudah_Dikerjakan' || item.status === 'Sudah Dikerjakan') && (
                          <span className="tag hijau" style={{ margin: 0, padding: '6px 10px', borderRadius: '6px', background: '#c6f6d5', color: '#166534' }}>Selesai ✓</span>
                        )}
                        {(item.status === 'Proses_Approval' || item.status === 'Proses Approval') && (
                          <span className="tag oranye" style={{ margin: 0, padding: '6px 10px', borderRadius: '6px', background: '#fef3c7', color: '#92400e' }}>Proses Approval ⏳</span>
                        )}
                        {['ADM', 'GL', 'TL', 'CL', 'SUPER_ADMIN'].includes((session?.user as any)?.role || '') && (
                          <button
                            type="button"
                            className="pilih-btn"
                            style={{ padding: '6px 10px', fontSize: '12px', color: 'var(--merah)', borderColor: '#eac9c4' }}
                            onClick={() => handleHapusJadwal(item.id)}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>
          )}
        </div>

        {/* Section 1: Tanggal & Shift */}
        <div className="kartu" id="kartu-tanggal-shift">
          <p className="label-besar">1. Tanggal & Shift</p>
          <div className="baris2" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
            <div style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
              <label className="kecil" style={{ marginTop: 0 }}>Tanggal</label>
              <input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
              <label className="kecil" style={{ marginTop: 0 }}>Shift</label>
              <select 
                value={shift} 
                onChange={(e) => setShift(e.target.value)}
                style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}
              >
                <option value="Nonshift">Nonshift</option>
                <option value="Shift A">Shift A</option>
                <option value="Shift B">Shift B</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Jenis Pekerjaan */}
        <div className="kartu">
          <p className="label-besar">2. Jenis Pekerjaan</p>
          <div className="grid-pilih lebar">
            {['OH MOLD', 'B/M', 'I/M', 'PM', 'BM CHUCK', 'LAINNYA'].map((val) => (
              <button
                key={val}
                type="button"
                className={`pilih-btn ${jenis === val ? 'terpilih' : ''}`}
                onClick={() => setJenis(val)}
              >
                {val === 'B/M' ? 'B/M (Breakdown)' : val === 'I/M' ? 'I/M (Inspect)' : val === 'PM' ? 'PM (Preventive)' : val}
              </button>
            ))}
          </div>
          {jenis === 'LAINNYA' && (
            <input
              type="text"
              placeholder="Sebutkan jenis pekerjaan lainnya..."
              style={{ marginTop: '10px' }}
              value={jenisLainnya}
              onChange={(e) => setJenisLainnya(e.target.value)}
            />
          )}
        </div>

        {/* Section 3: Pilih Nomor Mold */}
        <div className="kartu" ref={dropdownRef}>
          <p className="label-besar">3. Pilih Nomor Mold</p>
          <p className="pertanyaan">Ketik nomor mold atau nama part untuk mencari, lalu tekan hasilnya</p>
          
          <div className="mold-search-wrap">
            <input
              type="text"
              placeholder="Cari: W30, W48, Bumper, Door Trim..."
              autoComplete="off"
              value={moldSearch}
              onChange={(e) => {
                setMoldSearch(e.target.value)
                setShowMoldDropdown(true)
              }}
              onFocus={() => setShowMoldDropdown(true)}
            />
            {showMoldDropdown && moldOptions.length > 0 && (
              <div className="mold-dropdown" style={{ position: 'relative', marginTop: '4px', zIndex: 9999 }}>
                {moldOptions.map((opt) => (
                  <div
                    key={opt.noMold}
                    className="mold-opt"
                    onClick={() => {
                      setSelectedMold(opt)
                      setMoldSearch(opt.noMold)
                      setShowMoldDropdown(false)
                    }}
                  >
                    <span className="mold-opt-no">{opt.noMold}</span>
                    <span className="mold-opt-nama">{opt.part}</span>
                    <span className="mold-opt-factory">{opt.outhouseId ? (opt.outhouse?.nama || 'Outhouse') : (opt.lokasiMold || opt.factory)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Admin / GL Add and Delete Mold buttons */}
          {['ADM', 'GL'].includes(session?.user?.role || '') && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="tombol-sekunder"
                style={{ marginTop: '10px', flex: 1 }}
                onClick={() => setShowTambahMold(true)}
              >
                + Tambah Mold Baru
              </button>
              <button
                type="button"
                className="tombol-sekunder"
                style={{ marginTop: '10px', flex: 1, color: 'var(--merah)', borderColor: '#eac9c4' }}
                onClick={() => setShowHapusMold(true)}
              >
                🗑️ Hapus Mold
              </button>
            </div>
          )}

          {/* Info Box Mold Terpilih */}
          {selectedMold && (
            <div className="info-mold-box aktif" id="info-mold-box">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                <b style={{ color: 'var(--hijau-tua)', fontSize: '15px' }}>Data Mold Terpilih:</b>
                <button
                  type="button"
                  className="tombol-sekunder"
                  style={{ margin: 0, padding: '4px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  onClick={() => {
                    // Reload data mold
                    const url = `/api/mold-book?query=${encodeURIComponent(selectedMold.noMold)}&limit=1`
                    fetch(url)
                      .then((res) => res.json())
                      .then((data) => {
                        if (Array.isArray(data) && data.length > 0) {
                          setSelectedMold(data[0])
                          showToast('Data Mold Terpilih diperbarui!', 'info')
                        }
                      })
                  }}
                >
                  🔄 Refresh Data Mold
                </button>
              </div>
              <div className="info-mold-grid">
                <div className="info-mold-item"><span>Nomor Mold</span><b>{selectedMold.noMold}</b></div>
                <div className="info-mold-item"><span>Lokasi</span><b>{selectedMold.outhouseId ? (selectedMold.outhouse?.nama || 'Outhouse') : (selectedMold.lokasiMold || selectedMold.factory)}</b></div>
                <div className="info-mold-item"><span>Tonase</span><b>{selectedMold.tonase || '-'}</b></div>
                <div className="info-mold-item"><span>Customer</span><b>{selectedMold.customer || '-'}</b></div>
                <div className="info-mold-item" style={{ gridColumn: 'span 2' }}><span>Nama Part</span><b>{selectedMold.part}</b></div>
                <div className="info-mold-item"><span>Model</span><b>{selectedMold.model || '-'}</b></div>
                <div className="info-mold-item"><span>M/C</span><b>{selectedMold.mc || '-'}</b></div>
                {(selectedMold.dimensiW || selectedMold.dimensiH || selectedMold.dimensiT) && (
                  <div className="info-mold-item" style={{ gridColumn: 'span 2' }}><span>Dimensi</span><b>{selectedMold.dimensiW || '?'} x {selectedMold.dimensiH || '?'} x {selectedMold.dimensiT || '?'} mm</b></div>
                )}
              </div>

              {/* Cooling Core Std vs Actual — SELALU TAMPIL */}
              <div className="sub-kondisi">
                <p className="label-kecil-sub">💧 Cooling Core (L/mnt)</p>
                <div className="baris2">
                  <div>
                    <label className="kecil" style={{ marginTop: 0 }}>Standard</label>
                    <input type="text" value={selectedMold.coreStd || 'Belum diisi'} readOnly style={{ color: selectedMold.coreStd ? 'inherit' : 'var(--teks-redup)' }} />
                  </div>
                  <div>
                    <label className="kecil" style={{ marginTop: 0 }}>Actual (isi manual)</label>
                    <input
                      type="text"
                      placeholder="cth: 12.5"
                      value={coreActual}
                      onChange={(e) => setCoreActual(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Cooling Cavity Std vs Actual — SELALU TAMPIL */}
              <div className="sub-kondisi">
                <p className="label-kecil-sub">💧 Cooling Cavity (L/mnt)</p>
                <div className="baris2">
                  <div>
                    <label className="kecil" style={{ marginTop: 0 }}>Standard</label>
                    <input type="text" value={selectedMold.cavStd || 'Belum diisi'} readOnly style={{ color: selectedMold.cavStd ? 'inherit' : 'var(--teks-redup)' }} />
                  </div>
                  <div>
                    <label className="kecil" style={{ marginTop: 0 }}>Actual (isi manual)</label>
                    <input
                      type="text"
                      placeholder="cth: 6.5"
                      value={cavActual}
                      onChange={(e) => setCavActual(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Heater Ohm Standard vs Actual — tampil jika ada, atau placeholder kosong */}
              <div className="sub-kondisi">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <p className="label-kecil-sub" style={{ margin: 0 }}>🔥 Heater (Ohm / Ω)</p>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                      <input 
                        type="radio" 
                        name="heater_status" 
                        checked={heaterStatus === 'OK'}
                        onChange={() => setHeaterStatus('OK')}
                      />
                      OK
                    </label>
                    <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                      <input 
                        type="radio" 
                        name="heater_status" 
                        checked={heaterStatus === 'NG'}
                        onChange={() => setHeaterStatus('NG')}
                      />
                      NG
                    </label>
                  </div>
                </div>
                
                {heaterStatus === 'NG' && (
                  <div style={{ marginTop: '12px', background: '#fafaf9', border: '1px solid var(--garis)', borderRadius: '6px', padding: '12px' }}>
                    {Array.isArray(selectedMold.heaterStd) && selectedMold.heaterStd.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {selectedMold.heaterStd.map((stdValue: number, idx: number) => (
                          <div className="heater-row" key={idx}>
                            <span>H{idx + 1}</span>
                            <input type="text" value={`Std: ${stdValue} Ω`} readOnly />
                            <input
                              type="text"
                              placeholder="Aktual (Ω)"
                              value={heaterActuals[idx] || ''}
                              onChange={(e) => {
                                const next = [...heaterActuals]
                                next[idx] = e.target.value
                                setHeaterActuals(next)
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <p style={{ fontSize: '12px', color: 'var(--teks-redup)', marginBottom: '4px' }}>
                          (Data Std Heater dari database kosong. Silakan isi aktual untuk H1-H8 secara manual)
                        </p>
                        {Array.from({ length: 8 }).map((_, idx) => (
                          <div className="heater-row" key={idx}>
                            <span>H{idx + 1}</span>
                            <input type="text" value="Std: -" readOnly style={{ color: 'var(--teks-redup)' }} />
                            <input
                              type="text"
                              placeholder={`Aktual H${idx + 1} (Ω)`}
                              value={heaterActuals[idx] || ''}
                              onChange={(e) => {
                                const next = [...heaterActuals]
                                next[idx] = e.target.value
                                setHeaterActuals(next)
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Shot/Cycle */}
              <div className="sub-kondisi">
                <div className="baris2">
                  <div>
                    <label className="kecil" style={{ marginTop: 0 }}>Shot/Cycle O/H (isi manual)</label>
                    <input
                      type="text"
                      placeholder="cth: 350000"
                      value={shotCycle}
                      onChange={(e) => setShotCycle(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="kecil" style={{ marginTop: 0 }}>Shot/Month (isi manual)</label>
                    <input
                      type="text"
                      placeholder="cth: 15000"
                      value={shotMonth}
                      onChange={(e) => setShotMonth(e.target.value)}
                    />
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Section 4: Informasi / Problem */}
        <div className="kartu">
          <p className="label-besar">4. Informasi / Problem</p>
          <p className="pertanyaan">Pilih satu atau lebih opsi di bawah ini atau tambahkan opsi baru:</p>
          
          <div className="grid-pilih lebar">
            {/* Dynamic Options */}
            {problemOptions.map((opt) => {
              const isSelected = isTagSelected(info, opt.value)
              return (
                <div key={opt.id} style={{ display: 'flex', alignItems: 'stretch' }}>
                  <button
                    type="button"
                    className={`pilih-btn ${isSelected ? 'terpilih' : ''}`}
                    style={{ 
                      flex: 1,
                      borderTopRightRadius: 0, 
                      borderBottomRightRadius: 0, 
                      borderRight: 'none',
                      margin: 0
                    }}
                    onClick={() => handleToggleProblemTag(opt.value)}
                  >
                    {opt.value}
                  </button>
                  <button
                    type="button"
                    className="pilih-btn"
                    style={{ 
                      borderTopLeftRadius: 0, 
                      borderBottomLeftRadius: 0, 
                      padding: '0 12px', 
                      color: 'var(--merah)',
                      margin: 0
                    }}
                    onClick={() => handleDeleteOption(opt.id)}
                    title="Hapus permanen"
                  >
                    ✖
                  </button>
                </div>
              )
            })}
            {tempProblems.map((opt, idx) => {
              const isSelected = isTagSelected(info, opt)
              return (
                <div key={`temp-prob-${idx}`} style={{ display: 'flex', alignItems: 'stretch' }}>
                  <button
                    type="button"
                    className={`pilih-btn ${isSelected ? 'terpilih' : ''}`}
                    style={{ 
                      flex: 1,
                      borderTopRightRadius: 0, 
                      borderBottomRightRadius: 0, 
                      borderRight: 'none',
                      margin: 0,
                      backgroundColor: isSelected ? '#0369a1' : '#f0f9ff',
                      color: isSelected ? '#fff' : '#0369a1',
                      border: '1px solid #0284c7',
                      fontWeight: 700
                    }}
                    onClick={() => handleToggleProblemTag(opt)}
                    title="Opsi sekali pakai untuk laporan ini"
                  >
                    ⚡ {opt} (Sekali Pakai)
                  </button>
                  <button
                    type="button"
                    className="pilih-btn"
                    style={{ 
                      borderTopLeftRadius: 0, 
                      borderBottomLeftRadius: 0, 
                      padding: '0 12px', 
                      color: 'var(--merah)',
                      border: '1px solid #0284c7',
                      margin: 0,
                      backgroundColor: '#fff'
                    }}
                    onClick={() => {
                      setTempProblems(prev => prev.filter((_, i) => i !== idx))
                      setInfo(prev => prev.split(',').map(s => s.trim()).filter(p => p.toLowerCase() !== opt.toLowerCase()).join(', '))
                      showToast('Opsi sekali pakai dihapus', 'info')
                    }}
                    title="Hapus opsi sekali pakai"
                  >
                    ✖
                  </button>
                </div>
              )
            })}
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '14px', alignItems: 'stretch', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Ketik problem atau kalimat sekali pakai di sini..."
              value={newProblem}
              onChange={(e) => setNewProblem(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTempProblem())}
              style={{ 
                flex: '1 1 280px',
                minWidth: '250px',
                height: '54px', 
                padding: '0 16px', 
                fontSize: '15px', 
                color: '#0f172a', 
                backgroundColor: '#ffffff', 
                border: '2px solid #cbd5e1', 
                borderRadius: '10px',
                outline: 'none'
              }}
            />
            <button
              type="button"
              onClick={handleAddTempProblem}
              style={{ 
                height: '54px', 
                padding: '0 22px', 
                fontSize: '14.5px',
                fontWeight: 800, 
                background: 'linear-gradient(135deg, #0284c7, #0369a1)', 
                color: '#ffffff', 
                border: 'none', 
                borderRadius: '10px', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 3px 6px rgba(2, 132, 199, 0.25)',
                whiteSpace: 'nowrap',
                transition: 'transform 0.1s'
              }}
              title="Gunakan hanya untuk laporan ini (Sekali Pakai & Tidak masuk ke daftar permanen)"
            >
              ⚡ Gunakan Sekali Pakai
            </button>
            <button
              type="button"
              onClick={() => handleAddOption('PROBLEM', newProblem)}
              style={{ 
                height: '54px', 
                padding: '0 20px', 
                fontSize: '14px',
                fontWeight: 700, 
                background: 'linear-gradient(135deg, #ea580c, #c2410c)', 
                color: '#ffffff', 
                border: 'none', 
                borderRadius: '10px', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 3px 6px rgba(234, 88, 12, 0.25)',
                whiteSpace: 'nowrap'
              }}
              title="Simpan permanen ke daftar tombol opsi agar dapat dipilih lagi oleh teknisi lain"
            >
              💾 Simpan ke Daftar Permanen
            </button>
          </div>
          {info && (
            <div style={{ marginTop: '14px', padding: '12px 16px', background: '#f8fafc', border: '1px solid #cbd5e1', borderLeft: '4px solid #0284c7', borderRadius: '10px' }}>
              <span style={{ fontWeight: 800, color: '#64748b', display: 'block', marginBottom: '4px', fontSize: '12.5px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                📌 Hasil Teks Problem (Akan Masuk ke Checksheet OH & CM):
              </span>
              <div style={{ color: '#0f172a', fontWeight: 700, fontSize: '15px', lineHeight: 1.5 }}>{info}</div>
            </div>
          )}
        </div>

        {/* Section 5: Countermeasure */}
        <div className="kartu">
          <p className="label-besar">5. Countermeasure (Tindakan)</p>
          <p className="pertanyaan">Pilih satu atau lebih opsi tindakan di bawah ini atau tambahkan opsi baru:</p>
          <div className="grid-pilih lebar">
            {/* Dynamic Options */}
            {cmOptions.map((opt) => {
              const isSelected = isTagSelected(countermeasure, opt.value)
              return (
                <div key={opt.id} style={{ display: 'flex', alignItems: 'stretch' }}>
                  <button
                    type="button"
                    className={`pilih-btn ${isSelected ? 'terpilih' : ''}`}
                    style={{ 
                      flex: 1,
                      borderTopRightRadius: 0, 
                      borderBottomRightRadius: 0, 
                      borderRight: 'none',
                      margin: 0
                    }}
                    onClick={() => handleToggleCmTag(opt.value)}
                  >
                    {opt.value}
                  </button>
                  <button
                    type="button"
                    className="pilih-btn"
                    style={{ 
                      borderTopLeftRadius: 0, 
                      borderBottomLeftRadius: 0, 
                      padding: '0 12px', 
                      color: 'var(--merah)',
                      margin: 0
                    }}
                    onClick={() => handleDeleteOption(opt.id)}
                    title="Hapus permanen"
                  >
                    ✖
                  </button>
                </div>
              )
            })}
            {tempCms.map((opt, idx) => {
              const isSelected = isTagSelected(countermeasure, opt)
              return (
                <div key={`temp-cm-${idx}`} style={{ display: 'flex', alignItems: 'stretch' }}>
                  <button
                    type="button"
                    className={`pilih-btn ${isSelected ? 'terpilih' : ''}`}
                    style={{ 
                      flex: 1,
                      borderTopRightRadius: 0, 
                      borderBottomRightRadius: 0, 
                      borderRight: 'none',
                      margin: 0,
                      backgroundColor: isSelected ? '#047857' : '#ecfdf5',
                      color: isSelected ? '#fff' : '#047857',
                      border: '1px solid #059669',
                      fontWeight: 700
                    }}
                    onClick={() => handleToggleCmTag(opt)}
                    title="Tindakan sekali pakai untuk laporan ini"
                  >
                    ⚡ {opt} (Sekali Pakai)
                  </button>
                  <button
                    type="button"
                    className="pilih-btn"
                    style={{ 
                      borderTopLeftRadius: 0, 
                      borderBottomLeftRadius: 0, 
                      padding: '0 12px', 
                      color: 'var(--merah)',
                      border: '1px solid #059669',
                      margin: 0,
                      backgroundColor: '#fff'
                    }}
                    onClick={() => {
                      setTempCms(prev => prev.filter((_, i) => i !== idx))
                      setCountermeasure(prev => prev.split(',').map(s => s.trim()).filter(p => p.toLowerCase() !== opt.toLowerCase()).join(', '))
                      showToast('Tindakan sekali pakai dihapus', 'info')
                    }}
                    title="Hapus opsi sekali pakai"
                  >
                    ✖
                  </button>
                </div>
              )
            })}
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '14px', alignItems: 'stretch', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Ketik tindakan atau kalimat sekali pakai di sini..."
              value={newCm}
              onChange={(e) => setNewCm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTempCm())}
              style={{ 
                flex: '1 1 280px',
                minWidth: '250px',
                height: '54px', 
                padding: '0 16px', 
                fontSize: '15px', 
                color: '#0f172a', 
                backgroundColor: '#ffffff', 
                border: '2px solid #cbd5e1', 
                borderRadius: '10px',
                outline: 'none'
              }}
            />
            <button
              type="button"
              onClick={handleAddTempCm}
              style={{ 
                height: '54px', 
                padding: '0 22px', 
                fontSize: '14.5px',
                fontWeight: 800, 
                background: 'linear-gradient(135deg, #059669, #047857)', 
                color: '#ffffff', 
                border: 'none', 
                borderRadius: '10px', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 3px 6px rgba(5, 150, 105, 0.25)',
                whiteSpace: 'nowrap',
                transition: 'transform 0.1s'
              }}
              title="Gunakan hanya untuk laporan ini (Sekali Pakai & Tidak masuk ke daftar permanen)"
            >
              ⚡ Gunakan Sekali Pakai
            </button>
            <button
              type="button"
              onClick={() => handleAddOption('COUNTERMEASURE', newCm)}
              style={{ 
                height: '54px', 
                padding: '0 20px', 
                fontSize: '14px',
                fontWeight: 700, 
                background: 'linear-gradient(135deg, #ea580c, #c2410c)', 
                color: '#ffffff', 
                border: 'none', 
                borderRadius: '10px', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 3px 6px rgba(234, 88, 12, 0.25)',
                whiteSpace: 'nowrap'
              }}
              title="Simpan permanen ke daftar tombol opsi agar dapat dipilih lagi"
            >
              💾 Simpan ke Daftar Permanen
            </button>
          </div>
          {countermeasure && (
            <div style={{ marginTop: '14px', padding: '12px 16px', background: '#f8fafc', border: '1px solid #cbd5e1', borderLeft: '4px solid #059669', borderRadius: '10px' }}>
              <span style={{ fontWeight: 800, color: '#64748b', display: 'block', marginBottom: '4px', fontSize: '12.5px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                📌 Hasil Teks Tindakan (Akan Masuk ke Checksheet OH & CM):
              </span>
              <div style={{ color: '#0f172a', fontWeight: 700, fontSize: '15px', lineHeight: 1.5 }}>{countermeasure}</div>
            </div>
          )}
        </div>

        {/* Section 6: PIC & Jam Kerja */}
        <div className="kartu">
          <p className="label-besar">6. PIC & Jam Kerja</p>
          <label className="kecil">Nama PIC Pendamping (bisa pilih lebih dari satu orang)</label>
          <p className="pertanyaan">Pilih PIC yang bertugas membantu Anda dalam pekerjaan ini</p>
          
          <div className="grid-pilih lebar" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '8px' }}>
            {picOptions.map((pic) => (
              <div key={pic.id} style={{ display: 'flex', alignItems: 'stretch' }}>
                <button
                  type="button"
                  className={`pilih-btn ${selectedPics.some(p => p.nama === pic.nama) ? 'terpilih' : ''}`}
                  onClick={() => handleTogglePic({ nama: pic.nama, shift: pic.shift || 'Nonshift' })}
                  style={{ 
                    flex: 1,
                    margin: 0,
                    borderTopRightRadius: 0,
                    borderBottomRightRadius: 0,
                    borderRight: 'none',
                    padding: '12px 8px',
                    textAlign: 'center',
                    minHeight: '60px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: '1.2'
                  }}
                  title={pic.nama}
                >
                  <b>{pic.nama}</b>
                </button>
                <button
                  type="button"
                  className="pilih-btn"
                  style={{ 
                    borderTopLeftRadius: 0, 
                    borderBottomLeftRadius: 0, 
                    padding: '0 12px', 
                    color: 'var(--merah)',
                    margin: 0
                  }}
                  onClick={() => handleRemovePicOption(pic.id, pic.nama)}
                  title="Hapus permanen"
                >
                  ✖
                </button>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '16px', alignItems: 'stretch' }}>
            <input
              type="text"
              placeholder="Tambah nama PIC baru..."
              value={picTambahan}
              onChange={(e) => setPicTambahan(e.target.value)}
              onKeyDown={handleAddPicTambahan}
              style={{ 
                flex: 1, 
                width: '100%',
                height: '56px', 
                padding: '0 18px', 
                fontSize: '16px', 
                color: '#000000', 
                backgroundColor: '#ffffff', 
                border: '2px solid #ccc', 
                borderRadius: '8px',
                lineHeight: '52px'
              }}
            />
            <button
              type="button"
              className="tombol-utama"
              style={{ margin: 0, width: 'auto', flexShrink: 0, height: '56px', padding: '0 24px', fontSize: '15px' }}
              onClick={handleAddPicTambahanClick}
            >
              Tambah PIC
            </button>
          </div>

          {selectedPics.length > 0 && (
            <div id="f-pic-terpilih-wrap" style={{ marginTop: '14px' }}>
              <p className="kecil" style={{ marginBottom: '6px' }}>Daftar PIC Terpilih:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {selectedPics.map((p) => (
                  <span
                    key={p.nama}
                    className="tag netral"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', background: 'var(--biru-bg)', color: 'var(--biru)', borderColor: 'var(--biru)', padding: '6px 12px' }}
                    onClick={() => handleTogglePic(p)}
                    title="Klik untuk menghapus"
                  >
                    <b>{p.nama}</b> ({p.shift === 'Shift_A' ? 'Shift A' : p.shift === 'Shift_B' ? 'Shift B' : 'Nonshift'}) <span style={{ color: 'var(--merah)' }}>✕</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="baris2" style={{ marginTop: '14px', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
            <div style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
              <label className="kecil">Jam Mulai</label>
              <input
                type="time"
                value={jamMulai}
                onChange={(e) => setJamMulai(e.target.value)}
                style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
              <label className="kecil">Jam Selesai</label>
              <input
                type="time"
                value={jamSelesai}
                onChange={(e) => setJamSelesai(e.target.value)}
                style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {/* Man Power Cost Estimator Preview */}
          {jamMulai && jamSelesai && (
            <div
              id="mp-cost-preview"
              style={{
                display: 'block',
                marginTop: '14px',
                background: 'var(--krem)',
                borderRadius: 'var(--radius)',
                padding: '14px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--teks-redup)', marginBottom: '4px' }}>
                <span>Estimasi: {Math.max(1, selectedPics.length)} Orang × {getDurasiJam().toFixed(1)} Jam × Rp 89.595 / Jam</span>
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--hijau-tua)' }}>
                Man Power Cost: Rp {hitungEstimasiMpCost().toLocaleString('id-ID')}
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          className="tombol-utama"
          type="button"
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? 'MENYIMPAN LAPORAN...' : 'SIMPAN LAPORAN'}
        </button>
      </section>

      {/* ===== MODAL TAMBAH MOLD BARU ===== */}
      {showTambahMold && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowTambahMold(false) }}>
          <div className="modal-box" style={{ maxWidth: '420px', textAlign: 'left' }}>
            <div className="modal-tgl" style={{ fontSize: '18px' }}>+ Tambah Mold Baru</div>
            <div className="modal-sub" style={{ marginBottom: '14px' }}>Mold baru akan langsung tersimpan dan bisa dicari oleh seluruh anggota</div>

            <label className="kecil" style={{ marginTop: 0 }}>Nomor Mold *</label>
            <input type="text" placeholder="Contoh: W60" value={newMoldNo} onChange={(e) => setNewMoldNo(e.target.value)} />

            <label className="kecil">Nama Part *</label>
            <input type="text" placeholder="Contoh: COVER FR BUMPER STD" value={newMoldPart} onChange={(e) => setNewMoldPart(e.target.value)} />

            <div className="baris2">
              <div>
                <label className="kecil">Factory *</label>
                <select value={newMoldFactory} onChange={(e) => setNewMoldFactory(e.target.value)}>
                  <option value="F2">Factory 2</option>
                  <option value="F3">Factory 3</option>
                  <option value="F4">Factory 4</option>
                </select>
              </div>
              <div>
                <label className="kecil">M/C Tonase</label>
                <input type="text" placeholder="cth: 3500T" value={newMoldTonase} onChange={(e) => setNewMoldTonase(e.target.value)} />
              </div>
            </div>

            <div className="baris2">
              <div>
                <label className="kecil">Customer</label>
                <input type="text" placeholder="cth: ADM" value={newMoldCustomer} onChange={(e) => setNewMoldCustomer(e.target.value)} />
              </div>
              <div>
                <label className="kecil">Model</label>
                <input type="text" placeholder="cth: D26A" value={newMoldModel} onChange={(e) => setNewMoldModel(e.target.value)} />
              </div>
            </div>

            <div className="baris2">
              <div>
                <label className="kecil">Cooling Core Std (L/mnt)</label>
                <input type="text" placeholder="cth: 16.3" value={newMoldCore} onChange={(e) => setNewMoldCore(e.target.value)} />
              </div>
              <div>
                <label className="kecil">Cooling Cav Std (L/mnt)</label>
                <input type="text" placeholder="cth: 19.0" value={newMoldCav} onChange={(e) => setNewMoldCav(e.target.value)} />
              </div>
            </div>

            {tambahError && <p className="login-error tampil" style={{ marginTop: '10px' }}>{tambahError}</p>}

            <div className="modal-actions" style={{ marginTop: '16px' }}>
              <button className="btn-modal-batal" onClick={() => setShowTambahMold(false)}>Batal</button>
              <button className="btn-modal-simpan" onClick={handleSaveMoldBaru}>Simpan Mold</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL HAPUS MOLD ===== */}
      {showHapusMold && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowHapusMold(false) }}>
          <div className="modal-box" style={{ maxWidth: '420px', textAlign: 'left' }} ref={hapusDropdownRef}>
            <div className="modal-tgl" style={{ fontSize: '18px' }}>🗑️ Hapus Mold</div>
            <div className="modal-sub" style={{ marginBottom: '14px' }}>Mold yang dihapus tidak akan muncul lagi di pencarian, tapi riwayat laporan lama tetap tersimpan.</div>

            <label className="kecil" style={{ marginTop: 0 }}>Cari Nomor Mold</label>
            <div className="mold-search-wrap">
              <input
                type="text"
                placeholder="Cari nomor mold..."
                autoComplete="off"
                value={hapusSearch}
                onChange={(e) => {
                  setHapusSearch(e.target.value)
                }}
              />
              {hapusOptions.length > 0 && (
                <div className="mold-dropdown">
                  {hapusOptions.map((opt) => (
                    <div key={opt.noMold} className="mold-opt" onClick={() => {
                      setSelectedHapusMold(opt)
                      setHapusSearch(opt.noMold)
                      setHapusOptions([])
                    }}>
                      <span className="mold-opt-no">{opt.noMold}</span>
                      <span className="mold-opt-part">{opt.part}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedHapusMold && (
              <div id="hm-terpilih" style={{ marginTop: '10px', fontSize: '14px', background: 'var(--krem)', padding: '10px', borderRadius: '6px' }}>
                Terpilih: <strong>{selectedHapusMold.noMold}</strong> ({selectedHapusMold.part})
              </div>
            )}

            {hapusError && <p className="login-error tampil" style={{ marginTop: '10px' }}>{hapusError}</p>}

            <div className="modal-actions" style={{ marginTop: '16px' }}>
              <button className="btn-modal-batal" onClick={() => setShowHapusMold(false)}>Batal</button>
              <button className="btn-modal-simpan" style={{ background: 'var(--merah)', borderColor: 'var(--merah)' }} onClick={handleDeleteMold}>Hapus Mold</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
