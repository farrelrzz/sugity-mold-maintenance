'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { showToast } from '@/components/ui/Toast'
import { ArrowLeft, RefreshCcw, Printer, Save } from 'lucide-react'
import { optimizeAndCompressImage } from '@/lib/imageOptimizer'

interface ApprovalEntry {
  id: number
  role: string
  userId: number | null
  signedAt: string | null
  user?: {
    nama: string
    signature?: string | null
  } | null
}

interface SparepartEntry {
  id?: number
  namaSparepart: string
  qty: number
  hargaSatuan: number
}

interface FotoEntry {
  id?: number
  filePath: string
}

interface LaporanData {
  id: number
  noMold: string
  jenis: string
  factory: string
  shift: string | null
  tanggal: string
  part: string | null
  info: string | null
  countermeasure: string | null
  coreActual?: string | null
  cavActual?: string | null
  heaterActual?: any
  moldData?: {
    noMold?: string | null
    mc?: string | null
    factory?: string | null
    tonase?: string | null
    customer?: string | null
    model?: string | null
    part?: string | null
    lokasiMold?: string | null
    coreStd?: string | null
    cavStd?: string | null
    heaterStd?: any
    shotCycle?: string | null
    shotMonth?: string | null
  } | null
  pic: {
    nama: string
  }
  checksheet?: {
    id: number
    checklist: any // JSON
    jamMulai: string | null
    jamSelesai: string | null
    jumlahOrang: number
    spareparts?: SparepartEntry[]
    foto?: FotoEntry[]
    approvals?: ApprovalEntry[]
  } | null
}

const OH_SECTIONS_A = [
  {
    kode: 'A1', judul: '1. KELUHAN OPERATOR (diisi oleh operator produksi)',
    items: [
      { label: 'Cycle time', metode: '-', standar: 'Sama / Naik' },
      { label: 'Part Condition (Burry, Scratch, Short)', metode: '-', standar: 'Sama / Naik' },
      { label: 'Mold temperatur', metode: '-', standar: 'Sama / Naik' },
      { label: 'Others', metode: '-', standar: '-' }
    ]
  },
  {
    kode: 'A2', judul: '2. MOLD ACCESSORIES',
    items: [
      { label: 'Special spare part', metode: 'Visual', standar: 'Tersimpan lengkap' },
      { label: 'Eye bolt', metode: 'Visual', standar: 'Tidak bengkok' },
      { label: 'Cover ejector, Name Plate', metode: 'Visual', standar: 'Terpasang Lengkap' },
      { label: 'Metacon, LS, Terminal', metode: 'Visual, Tester', standar: 'Terpasang, Interlock ok' },
      { label: 'Mould Colour', metode: 'Visual', standar: 'Std Customer / TPS' }
    ]
  },
  {
    kode: 'A3', judul: '3. EJECTOR UNIT',
    items: [
      { label: 'Pergerakan Ejector', metode: 'Visual, Gerakan', standar: 'T/A Noise, Smooth' },
      { label: 'Overhaul Status', metode: 'Cek Master Schedule', standar: 'Max 4x OH harus bongkar' },
      { label: 'Gas spring tidak bocor', metode: 'Visual dg preasure', standar: 'Tidak Lemah' },
      { label: 'Ejector Runner pin', metode: 'Visual setelah dicabut', standar: 'Tidak luka, tidak seret' }
    ]
  },
  {
    kode: 'A4', judul: '4. CAVITY & CORE SURFACE',
    items: [
      { label: 'Cavity Product Area', metode: 'Visual', standar: 'T/A Cacat, T/A UnderCut' },
      { label: 'Parting Line & Air Vent', metode: 'Visual dan diraba', standar: 'T/A Cacat' },
      { label: 'Emboss / Shibo', metode: 'Visual', standar: 'T/A Cacat' },
      { label: 'Guide Pin & Bush', metode: 'Visual dan diraba', standar: 'T/A Luka, ada Grease' },
      { label: 'Inrow / Inlock', metode: 'Visual', standar: 'T/A Luka, ada Grease' },
      { label: 'Rib', metode: 'Visual dan diraba', standar: 'T/A Undercut' },
      { label: 'Core Product Area', metode: 'Visual', standar: 'T/A Cacat' },
      { label: 'Special Insert', metode: 'Visual, Colour Check', standar: 'T/A Crack' },
      { label: "Kode type Mat'l", metode: 'Visual, dan diraba', standar: 'Ada, terbaca jelas' }
    ]
  },
  {
    kode: 'A5', judul: '5. SLIDE CORE & SLIDE CAV',
    items: [
      { label: 'Product Area', metode: 'Visual', standar: 'T/A Cacat' },
      { label: 'Angular pin & Hole', metode: 'Visual dan diraba', standar: 'T/A Luka, T/A Bengkok' },
      { label: 'Inlock Area', metode: 'Visual dan diraba', standar: 'T/A Luka, ada grease' },
      { label: 'Guide Rail', metode: 'Visual', standar: 'T/A Luka' },
      { label: 'Spring', metode: 'Visual', standar: 'Tidak Lemah' },
      { label: 'Stopper', metode: 'Visual saat slider mundur', standar: 'Touch dg slider' },
      { label: 'Bolt & Ulir', metode: 'Visual dg Kunci L', standar: 'Kencang, Drat normal' },
      { label: 'Grease Slider', metode: 'Visual', standar: 'Ada Grease' },
      { label: 'Sliding Cek', metode: 'Visual', standar: 'Smooth' }
    ]
  },
  {
    kode: 'A6', judul: '6. COOLING',
    items: [
      { label: 'Flow Cooling', metode: 'Check Sheet Cooling', standar: 'Sesuai standart awal' },
      { label: 'Selang Cooling', metode: 'Visual dan ditarik', standar: 'T/A Cacat, Tdk Bocor' },
      { label: 'Joint Nepple', metode: 'Visual dg preasure', standar: 'T/A Bocor' },
      { label: 'Coupler', metode: 'Visual', standar: 'T/A Bocor' }
    ]
  },
  {
    kode: 'A7', judul: '7. AUTO CONECTOR',
    items: [
      { label: 'Bracket / dudukan', metode: 'Visual', standar: 'Tidak kendor, Center' },
      { label: 'Kondisi wiring', metode: 'Tester, Visual', standar: 'Koneksi baik, rapi' },
      { label: 'Kondisi Piping / Hosing', metode: 'Visual', standar: 'Tidak bocor, rapi' },
      { label: 'Kondisi Pin Conector', metode: 'Visual', standar: 'Tidak bengkok/goyang' }
    ]
  },
  {
    kode: 'A8', judul: '8. HOT RUNNER',
    items: [
      { label: 'Kebocoran Material', metode: 'Visual', standar: 'T/A Bocor' },
      { label: 'Resistansi Heater', metode: 'Tester (check sheet)', standar: 'Sesuai Watt Heater' },
      { label: 'Kondisi Isolator', metode: 'Megger / Tester', standar: 'Min 0,2 MΩ' },
      { label: 'Metacon', metode: 'Visual', standar: 'T/A rusak, T/A Spark' },
      { label: 'Harting (pin)', metode: 'Visual', standar: 'T/A rusak, T/A Spark' },
      { label: 'Kekencangan Baut ikat', metode: 'Kunci L', standar: 'Tidak kendor / Patah' }
    ]
  },
  {
    kode: 'A9', judul: '9. VALVE GATE',
    items: [
      { label: 'Kebocoran material', metode: 'Visual', standar: 'T/A Kebocoran' },
      { label: 'Interlock', metode: 'Visual, Tester', standar: 'Interlock OK' },
      { label: 'Pressure', metode: 'Pressure tester', standar: 'Pressure tidak down' }
    ]
  },
  {
    kode: 'A10', judul: '10. HYDROULIK SISTEM',
    items: [
      { label: 'Sliding / Gerakan Hyd', metode: 'Visual, Hyd Pump', standar: 'Smooth' },
      { label: 'Sistem Interlock', metode: 'Visual, Tester', standar: 'Interlock OK' },
      { label: 'Kebocoran oli', metode: 'Visual', standar: 'T/A Bocor (tidak ada kebocoran angin)' }
    ]
  },
  {
    kode: 'A11', judul: '11. CHUCK',
    items: [
      { label: 'Kondisi Chuck', metode: 'Check Sheet Chuck', standar: 'Berfungsi Normal' }
    ]
  }
]

const OH_SECTIONS_EG = [
  {
    kode: 'EG1', judul: '1. EJECTOR GROUP',
    items: [
      { label: 'Spring / Gas Spring', metode: 'Visual', standar: 'Tidak Lemah' },
      { label: 'Ejector Pin', metode: 'Visual dan diraba', standar: 'T/A scratch, bengkok' },
      { label: 'Ejector Blade', metode: 'Visual dan diraba', standar: 'T/A scratch, bengkok' },
      { label: 'Ejector Sleeve', metode: 'Visual dan diraba', standar: 'T/A scratch, bengkok' },
      { label: 'Guide Pin & Bushing', metode: 'Visual dan diraba', standar: 'T/A scratch, bengkok' }
    ]
  },
  {
    kode: 'EG2', judul: '2. EJECTOR BLOCK',
    items: [
      { label: 'Block', metode: 'Visual', standar: 'T/A Cacat' },
      { label: 'Rod Pin', metode: 'Visual dan diraba', standar: 'T/A scratch, bengkok' },
      { label: 'Knock Pin', metode: 'Visual', standar: 'Tidak Longgar' },
      { label: 'Baut Ikat', metode: 'Visual, Kunci L', standar: 'Kencang, Drat normal' }
    ]
  },
  {
    kode: 'EG3', judul: '3. KEISHA CORE',
    items: [
      { label: 'Block', metode: 'Visual', standar: 'T/A Cacat' },
      { label: 'Rod Pin', metode: 'Visual dan diraba', standar: 'T/A scratch, bengkok' },
      { label: 'Slide Unit', metode: 'Visual', standar: 'T/A Cacat' },
      { label: 'Knock / Dowel Pin', metode: 'Visual', standar: 'Tidak Longgar' },
      { label: 'Baut Ikat', metode: 'Visual, Kunci L', standar: 'Kencang, Drat normal' }
    ]
  },
  {
    kode: 'EG4', judul: '4. FINAL CHECK',
    items: [
      { label: 'Moving / Surface Ejector', metode: 'Visual, Magnet check', standar: 'Smooth, T/A miss assy' }
    ]
  }
]

const OH_SECTIONS_CDE = [
  {
    kode: 'C', judul: "C. HOT RUNNER SYSTEM", costLabel: 'b3',
    std: "Tidak ada bocor mat'l, Tidak ada heater / thermocouple putus, Tidak ada dowel pin patah",
    metodeCheck: 'Bongkar Hot Runner',
    img: '/checksheet/hot_runner.png',
    items: ['Nozzle Bush', 'Baut Ikat', 'Casting / Pin Heater', 'Band Heater', 'Thermocouple', 'Dowel Pin', 'Washer', 'Plug', 'Touching Area']
  },
  {
    kode: 'D', judul: 'D. VALVE GATE & L/S', costLabel: 'b4',
    std: "Tidak ada bocor mat'l, Tabung tidak ngempos, Sensor normal, Angin tidak bocor",
    metodeCheck: 'Bongkar Valve Gate',
    jenisPilihan: ['Sekisui', 'Kata Sistem', 'Oil Sistem'],
    img: '/checksheet/valve_gate.png',
    items: ['Stick L/S', 'L/S', 'Tabung', 'O-Ring', 'Bushing', 'V/G Pin', 'Hose / Joint', 'Nepple', 'Baut Ikat', "Mat'l Bocor"]
  },
  {
    kode: 'E', judul: 'E. HYDRUOLIC CHECK', costLabel: 'b5',
    std: 'Tidak ada bagian yang crack, Interlock berfungsi, Sliding smooth, Hyd tidak bocor',
    metodeCheck: 'Bongkar Hyd Unit',
    img: '/checksheet/hydraulic.png',
    items: ['Stick L/S', 'L/S', 'Stopper LS', 'Tabung Hyd', 'Oring - Oring', 'Nepple / Coupler', 'Hyd Hose', 'Hyd As / Rod', 'Bracket', 'Insert Pin / Makuri']
  }
]

const CM_CARD_FIELDS = [
  "Deskripsi problem yang ditemukan",
  "Analisa penyebab (root cause)",
  "Tindakan perbaikan (countermeasure) yang dilakukan",
  "Part / material yang digunakan (bila ada penggantian)",
  "Hasil verifikasi setelah perbaikan"
]

const ROLES_ORDER = ['PIC', 'TL', 'GL', 'ADM']

const PERAN_LABEL: Record<string, string> = {
  PIC: 'Member (PIC)',
  TL: 'Team Leader',
  GL: 'Group Leader',
  CL: 'Chief Leader',
  ADM: 'ADM',
}

export default function ChecksheetPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { data: session } = useSession()
  const { id: idParam } = React.use(params)
  const laporanId = Number(idParam)

  const [laporan, setLaporan] = useState<LaporanData | null>(null)
  const [loading, setLoading] = useState(true)
  const [katalogList, setKatalogList] = useState<{id: number, nama: string, hargaSatuan: number}[]>([])
  const [revisiStatus, setRevisiStatus] = useState<string | null>(null)

  // Checksheet data states
  const [checklist, setChecklist] = useState<Record<string, any>>({})
  const [jamMulai, setJamMulai] = useState('')
  const [jamSelesai, setJamSelesai] = useState('')
  const [jumlahOrang, setJumlahOrang] = useState(1)
  const [catatan, setCatatan] = useState('')

  // Spareparts
  const [spareparts, setSpareparts] = useState<SparepartEntry[]>([])
  const [activeSpDropdown, setActiveSpDropdown] = useState<number | null>(null)
  const [savingNewKatalogIdx, setSavingNewKatalogIdx] = useState<number | null>(null)

  // Katalog Modal States
  const [isKatalogModalOpen, setIsKatalogModalOpen] = useState(false)
  const [newKatalogNama, setNewKatalogNama] = useState('')
  const [newKatalogHarga, setNewKatalogHarga] = useState('')
  const [isSubmittingKatalog, setIsSubmittingKatalog] = useState(false)

  // Fotos upload
  const [foto, setFoto] = useState<string[]>([])

  const fetchKatalog = () => {
    fetch('/api/sparepart')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setKatalogList(data)
      })
      .catch(console.error)
  }

  useEffect(() => {
    fetchKatalog()

    fetch(`/api/laporan/${laporanId}/checksheet`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          showToast(data.error, 'error')
        } else {
          // Fetch revisi status
          fetch(`/api/laporan/${laporanId}/revisi`)
            .then(r => r.json())
            .then(revData => {
              if (revData.revisi) {
                setRevisiStatus(revData.revisi.status)
              }
            }).catch(console.error)

          setLaporan(data)
          if (data.checksheet) {
            setChecklist(data.checksheet.checklist?.items || {})
            setJamMulai(data.checksheet.jamMulai || '')
            setJamSelesai(data.checksheet.jamSelesai || '')
            setJumlahOrang(data.checksheet.jumlahOrang || 1)
            setCatatan(data.checksheet.checklist?.catatan || '')
            setSpareparts(
              (data.checksheet.spareparts || []).map((sp: any) => ({
                namaSparepart: sp.namaSparepart,
                qty: sp.qty,
                hargaSatuan: Number(sp.hargaSatuan),
              }))
            )
            setFoto((data.checksheet.foto || []).map((f: any) => f.filePath))
          }
        }
      })
      .catch((err) => {
        console.error(err)
        showToast('Gagal memuat data checksheet', 'error')
      })
      .finally(() => setLoading(false))
  }, [laporanId])

  // Get duration helper
  const getDurasiJam = (m1?: string, m2?: string) => {
    const start = m1 || jamMulai
    const end = m2 || jamSelesai
    if (!start || !end) return 0
    const [hStart, minStart] = start.split(':').map(Number)
    const [hEnd, minEnd] = end.split(':').map(Number)
    let diffMinutes = (hEnd * 60 + minEnd) - (hStart * 60 + minStart)
    if (diffMinutes < 0) diffMinutes += 24 * 60
    return diffMinutes / 60
  }

  // Cost Box MP Cost calculator (89.595 hourly rate)
  const getMpCostFromBox = (boxKey: string) => {
    const box = checklist[boxKey] || {}
    const start = box.jamMulai || ''
    const end = box.jamSelesai || ''
    const people = Number(box.orang) || 0
    const hours = getDurasiJam(start, end)
    return Math.round(hours * 89595 * people)
  }

  const handleCostBoxChange = (boxKey: string, field: string, val: string | number) => {
    const box = checklist[boxKey] || {}
    const nextBox = { ...box, [field]: val }
    setChecklist({ ...checklist, [boxKey]: nextBox })
  }

  const handleChecklistChange = (key: string, type: 'judge' | 'komentar', val: string) => {
    const entry = checklist[key] || { judge: '', komentar: '' }
    const nextEntry = { ...entry, [type]: val }
    setChecklist({ ...checklist, [key]: nextEntry })
  }

  const handleMasterChecklistChange = (secKode: string, numItems: number, value: 'OK' | 'NG') => {
    const newChecklist = { ...checklist }
    newChecklist[`master_${secKode}`] = value

    if (value === 'OK') {
      for (let idx = 0; idx < numItems; idx++) {
        const key = `${secKode}|${idx}`
        if (!newChecklist[key]) newChecklist[key] = {}
        newChecklist[key].judge = 'OK'
        newChecklist[key].komentar = ''
      }
    }
    setChecklist(newChecklist)
  }

  // Calculate Total MP Cost (Overhaul b1-b5)
  const getOverhaulTotalMpCost = () => {
    return ['b1', 'b2', 'b3', 'b4', 'b5'].reduce((s, k) => s + getMpCostFromBox(k), 0)
  }

  // Calculate Total Sparepart
  const getTotalSparepartCost = () => {
    return spareparts.reduce((s, sp) => s + (sp.qty * sp.hargaSatuan), 0)
  }

  // Spareparts actions
  const handleAddSparepart = () => {
    const newIdx = spareparts.length
    setSpareparts([...spareparts, { namaSparepart: '', qty: 1, hargaSatuan: 0 }])
    setActiveSpDropdown(newIdx)
  }

  const handleUpdateSparepart = (idx: number, field: keyof SparepartEntry, val: string | number) => {
    const next = [...spareparts]
    next[idx] = { ...next[idx], [field]: val } as any
    
    // Auto-fill price if picking from catalog
    if (field === 'namaSparepart') {
      const selectedItem = katalogList.find(k => k.nama.toLowerCase() === String(val).trim().toLowerCase())
      if (selectedItem && next[idx].hargaSatuan === 0) {
        next[idx].hargaSatuan = Number(selectedItem.hargaSatuan)
      }
    }

    setSpareparts(next)
  }

  const handleSelectKatalog = (idx: number, item: { nama: string; hargaSatuan: number }) => {
    const next = [...spareparts]
    next[idx] = { ...next[idx], namaSparepart: item.nama, hargaSatuan: Number(item.hargaSatuan) }
    setSpareparts(next)
    setActiveSpDropdown(null)
  }

  const handleSaveToKatalog = async (idx: number) => {
    const item = spareparts[idx]
    if (!item || !item.namaSparepart.trim()) return showToast('Nama sparepart belum diisi', 'error')
    if (!item.hargaSatuan || Number(item.hargaSatuan) <= 0) return showToast('Harap isi harga satuan sebelum menyimpan ke katalog', 'error')
    
    setSavingNewKatalogIdx(idx)
    try {
      const res = await fetch('/api/sparepart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nama: item.namaSparepart.trim(), hargaSatuan: Number(item.hargaSatuan) })
      })
      if (res.ok) {
        const newKatalog = await res.json()
        setKatalogList((prev) => [...prev, newKatalog].sort((a, b) => a.nama.localeCompare(b.nama)))
        showToast(`✨ "${item.namaSparepart}" berhasil tersimpan di Katalog Master! Besok cukup ketik huruf depannya saja!`, 'sukses')
        setActiveSpDropdown(null)
      } else {
        const err = await res.json()
        showToast(err.error || 'Gagal menyimpan ke katalog', 'error')
      }
    } catch (e: any) {
      showToast('Terjadi kesalahan sistem', 'error')
    } finally {
      setSavingNewKatalogIdx(null)
    }
  }

  const handleRemoveSparepart = (idx: number) => {
    setSpareparts(spareparts.filter((_, i) => i !== idx))
    if (activeSpDropdown === idx) setActiveSpDropdown(null)
  }

  const handleAddKatalog = async () => {
    if (!newKatalogNama || !newKatalogHarga) return showToast('Harap isi nama dan harga', 'error')
    setIsSubmittingKatalog(true)
    try {
      const res = await fetch('/api/sparepart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nama: newKatalogNama, hargaSatuan: Number(newKatalogHarga) })
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Gagal menambahkan katalog')
      }
      showToast('Katalog berhasil ditambahkan', 'sukses')
      setNewKatalogNama('')
      setNewKatalogHarga('')
      fetchKatalog()
    } catch (err: any) {
      showToast(err.message, 'error')
    } finally {
      setIsSubmittingKatalog(false)
    }
  }

  const handleDeleteKatalog = async (id: number) => {
    if (!confirm('Hapus item ini dari katalog?')) return
    try {
      const res = await fetch(`/api/sparepart/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Gagal menghapus katalog')
      showToast('Katalog dihapus', 'sukses')
      fetchKatalog()
    } catch (err: any) {
      showToast(err.message, 'error')
    }
  }

  // Save changes to database
  const handleSave = async (showNotification = true) => {
    if (!laporan) return

    const payload = {
      checklist: {
        items: checklist,
        catatan,
      },
      jamMulai,
      jamSelesai,
      jumlahOrang,
      spareparts,
      foto,
    }

    try {
      const res = await fetch(`/api/laporan/${laporanId}/checksheet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        showToast('Gagal menyimpan checksheet', 'error')
        return false
      }
      if (showNotification) {
        showToast('Checksheet berhasil disimpan! ✓')
      }
      return true
    } catch {
      showToast('Kesalahan jaringan saat menyimpan', 'error')
      return false
    }
  }

  // Sign dynamic approval sequence
  const handleSign = async (role: string) => {
    // 1. Simpan checksheet saat ini dulu untuk memastikan data terbaru ter-save
    const saveOk = await handleSave(false)
    if (!saveOk) return

    try {
      const res = await fetch(`/api/laporan/${laporanId}/checksheet/sign`, {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok) {
        showToast(data.error || 'Gagal menandatangani', 'error')
      } else {
        showToast(`Tanda tangan sebagai ${PERAN_LABEL[role]} berhasil! ✓`)
        // Reload page data
        window.location.reload()
      }
    } catch {
      showToast('Kesalahan jaringan', 'error')
    }
  }

  const handleSignAll = async () => {
    const saveOk = await handleSave(false)
    if (!saveOk) return

    if (!confirm('Apakah Anda yakin ingin menyetujui seluruh tahapan persetujuan (TL, GL, ADM) sekaligus secara otomatis?')) return

    try {
      const res = await fetch(`/api/laporan/${laporanId}/checksheet/sign-all`, {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok) {
        showToast(data.error || 'Gagal Approve All', 'error')
      } else {
        showToast(`Berhasil menyetujui ${data.signedCount} tahapan sekaligus! ✓`)
        window.location.reload()
      }
    } catch {
      showToast('Kesalahan jaringan', 'error')
    }
  }

  // Upload dynamic image with WebP high-definition ultra-compression
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const MAX_SIZE = 10 * 1024 * 1024 // Batas awal 10 MB sebelum dikompres

    for (const file of Array.from(files)) {
      if (file.size > MAX_SIZE) {
        showToast(`Foto Checksheet "${file.name}" terlalu besar! Maksimal 10 MB sebelum kompresi.`, 'error')
        continue
      }
      try {
        // Kompres foto kamera HP ke format WebP super ringan (~40-80 KB) dengan resolusi tajam
        const compressedBase64 = await optimizeAndCompressImage(file, { maxDimension: 1024, quality: 0.8 })
        setFoto((prev) => [...prev, compressedBase64])
        showToast(`Foto "${file.name}" berhasil dioptimasi & dikompres ke resolusi tajam!`, 'sukses')
      } catch (err) {
        console.error('Gagal memproses foto:', err)
        showToast(`Gagal mengoptimasi foto "${file.name}"`, 'error')
      }
    }
  }

  const handleRemoveFoto = (idx: number) => {
    setFoto(foto.filter((_, i) => i !== idx))
  }

  const handleAjukanRevisi = async () => {
    const alasan = window.prompt('Masukkan alasan pengajuan revisi:')
    if (!alasan) return
    try {
      const res = await fetch(`/api/laporan/${laporanId}/revisi`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alasan })
      })
      const data = await res.json()
      if (res.ok) {
        showToast('Revisi berhasil diajukan ✓', 'sukses')
        window.location.reload()
      } else {
        showToast(data.error, 'error')
      }
    } catch {
      showToast('Gagal mengajukan revisi', 'error')
    }
  }

  // Print function specifically for CM CARD (PM, BM, IM - Mold Problem) QF/MOLD-013
  const handlePrintCmCard = () => {
    if (!laporan) return

    const tglKerja = new Date(laporan.tanggal)
    const year2 = String(tglKerja.getFullYear()).slice(-2)
    const month2 = String(tglKerja.getMonth() + 1).padStart(2, '0')
    const day2 = String(tglKerja.getDate()).padStart(2, '0')
    const dateFormatted = tglKerja.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })

    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    
    // Determine card type
    let defaultCardType = 'BM'
    if (laporan.jenis?.toUpperCase().includes('PM')) defaultCardType = 'PM'
    if (laporan.jenis?.toUpperCase().includes('IM')) defaultCardType = 'IM'
    const cardType = checklist.cm_card_type || defaultCardType

    // Calculations for Waktu Kerja and Costs
    let maintHours = 0
    let maintMins = 0
    let totalHoursDecimal = 0
    if (jamMulai && jamSelesai) {
      const [hS, mS] = jamMulai.split(':').map(Number)
      const [hE, mE] = jamSelesai.split(':').map(Number)
      let diffMins = (hE * 60 + mE) - (hS * 60 + mS)
      if (diffMins < 0) diffMins += 24 * 60
      maintHours = Math.floor(diffMins / 60)
      maintMins = diffMins % 60
      totalHoursDecimal = Number((diffMins / 60).toFixed(2))
    }
    const mcHours = Number(checklist.cm_waktu_mc_h || 0)
    const mcMins = Number(checklist.cm_waktu_mc_m || 0)
    
    const totalCombinedMins = (maintHours * 60 + maintMins) + (mcHours * 60 + mcMins)
    const totHours = Math.floor(totalCombinedMins / 60)
    const totMins = totalCombinedMins % 60
    const totDecimal = Number((totalCombinedMins / 60).toFixed(2))

    // Costs
    const inHouseCost = Math.round(totDecimal * jumlahOrang * 89595)
    const outHouseCost = Number(checklist.cm_outhouse_cost || 0)
    const _totalSparepart = spareparts.reduce((s, sp) => s + (sp.qty * Number(sp.hargaSatuan)), 0)
    const grandTotalCost = inHouseCost + outHouseCost + _totalSparepart

    // Approvals
    const approvals = laporan.checksheet?.approvals || []
    const getSignName = (role: string) => {
      const a = approvals.find(x => x.role === role)
      return a && a.signedAt ? (a.user?.nama || 'Signed') : ''
    }

    // Categories list
    const categories = ['Ejector', 'Core', 'Cav', 'Cooling', 'H-Runner', 'Slider', 'Auto Connect', 'Interlock', 'Chuck', 'V-Gate', 'Hyd', 'Electric', 'Q-Part', 'Others']
    const selectedCat = (checklist.cm_category === 'V-Galp' ? 'V-Gate' : checklist.cm_category) || ''

    // Spare parts rows (minimum 4 rows for clean appearance)
    let spRowsHtml = ''
    const maxSp = Math.max(spareparts.length, 4)
    for (let i = 0; i < maxSp; i++) {
      const sp = spareparts[i]
      if (sp) {
        const sub = sp.qty * Number(sp.hargaSatuan)
        spRowsHtml += `
          <tr style="height: 16px;">
            <td style="border: 1px solid #000; text-align: center;">${i + 1}</td>
            <td style="border: 1px solid #000; padding: 1px 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${sp.namaSparepart}</td>
            <td style="border: 1px solid #000; text-align: center;">STD</td>
            <td style="border: 1px solid #000; text-align: center;">${sp.qty}</td>
            <td style="border: 1px solid #000; text-align: right; padding: 1px 4px; font-weight: bold;">Rp ${sub.toLocaleString('id-ID')}</td>
          </tr>`
      } else {
        spRowsHtml += `
          <tr style="height: 16px;">
            <td style="border: 1px solid #000; text-align: center;">${i + 1}</td>
            <td style="border: 1px solid #000;"></td>
            <td style="border: 1px solid #000;"></td>
            <td style="border: 1px solid #000;"></td>
            <td style="border: 1px solid #000;"></td>
          </tr>`
      }
    }

    // Photos HTML (Fix base64 Data URL and Blob display when printing)
    const getPrintImgSrc = (img: string) => {
      if (!img) return ''
      if (img.startsWith('data:') || img.startsWith('http') || img.startsWith('blob:')) return img
      return img.startsWith('/') ? origin + img : origin + '/' + img
    }

    let photoHtml = '<div style="color: #777; font-style: italic; padding: 25px 0; text-align: center; font-size: 8px;">( Tidak ada foto terlampir / sketsa manual )</div>'
    if (foto && foto.length > 0) {
      photoHtml = `<div style="display: flex; gap: 6px; justify-content: center; align-items: center; flex-wrap: wrap; padding: 4px;">
        ${foto.slice(0, 2).map(f => `<div style="border: 1px solid #aaa; padding: 2px; background: #fff; display: flex; align-items: center; justify-content: center;"><img src="${getPrintImgSrc(f)}" style="max-height: 85px; max-width: 135px; object-fit: contain; display: block;" /></div>`).join('')}
      </div>`
    }

    const rank = checklist.cm_rank || 'C'
    const judgeResult = checklist.cm_judge_result || checklist.cm_judge || 'OK'
    const judgeType = checklist.cm_judge_type || 'Permanent'

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>CM CARD - ${laporan.noMold} (${laporan.jenis})</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  @page { size: A4 portrait; margin: 5mm 6mm; }
  body { font-family: 'Arial', sans-serif; font-size: 8px; color: #000; line-height: 1.25; width: 100%; max-width: 100%; overflow: hidden; }
  table { border-collapse: collapse; width: 100%; table-layout: fixed; }
  th, td { box-sizing: border-box; word-wrap: break-word; overflow-wrap: break-word; }
  .chk { display: inline-block; width: 8px; height: 8px; border: 1px solid #000; text-align: center; font-size: 7px; line-height: 7px; margin-right: 2px; vertical-align: middle; font-weight: bold; }
  .title-main { font-size: 15px; font-weight: 900; letter-spacing: 0.5px; text-align: center; }
  .table-main, .table-main th, .table-main td { border: 1px solid #000; }
</style>
</head>
<body onload="window.print()">

<!-- HEADER SECTION -->
<table class="table-main" style="margin-bottom: 3px; width: 100%;">
  <tr>
    <td style="width: 28%; padding: 3px 5px; font-size: 8px; vertical-align: top;">
      <b>PT SUGITY CREATIVES</b><br>
      <span>MOLD MAINTENANCE DIVISION</span>
    </td>
    <td style="width: 46%; text-align: center; vertical-align: middle;">
      <div class="title-main">CM CARD [Corrective Maintenance]</div>
    </td>
    <td style="width: 26%; text-align: right; padding: 3px 5px; vertical-align: bottom; font-weight: bold; font-size: 10px;">
      QF/MOLD-013
    </td>
  </tr>
</table>

<!-- SECTION 1, 2, 3 -->
<table class="table-main" style="width: 100%; margin-bottom: 3px;">
  <tr>
    <td style="width: 28%; border-right: 1px solid #000; vertical-align: top; padding: 3px 5px;">
      <b>1. CARD TYPE</b><br>
      <div style="margin-top: 3px;"><span class="chk">${cardType === 'BM' ? '✓' : ''}</span> <b>BM CARD</b> (Breakdown)</div>
      <div style="margin-top: 2px;"><span class="chk">${cardType === 'PM' ? '✓' : ''}</span> <b>PM CARD</b> (Preventive)</div>
      <div style="margin-top: 2px;"><span class="chk">${cardType === 'IM' ? '✓' : ''}</span> <b>IM CARD</b> (Information)</div>
    </td>
    <td style="width: 34%; border-right: 1px solid #000; vertical-align: top; padding: 3px 5px;">
      <b>2. FILLING CODE</b>
      <table style="width: 100%; margin-top: 4px; border: 1px solid #000; text-align: center; table-layout: fixed;">
        <tr style="background: #e8e8e8; font-size: 7.5px; font-weight: bold;">
          <td colspan="3" style="border-right: 1px solid #000; border-bottom: 1px solid #000; width: 54%;">DATE</td>
          <td rowspan="2" style="border-bottom: 1px solid #000; vertical-align: middle; width: 46%;">MOLD NO</td>
        </tr>
        <tr style="font-size: 7px; background: #f5f5f5;">
          <td style="border-right: 1px solid #000; border-bottom: 1px solid #000; width: 18%;">YY</td>
          <td style="border-right: 1px solid #000; border-bottom: 1px solid #000; width: 18%;">MM</td>
          <td style="border-right: 1px solid #000; border-bottom: 1px solid #000; width: 18%;">DD</td>
        </tr>
        <tr style="font-weight: bold; font-size: 10.5px;">
          <td style="border-right: 1px solid #000; padding: 3px 1px;">${year2}</td>
          <td style="border-right: 1px solid #000; padding: 3px 1px;">${month2}</td>
          <td style="border-right: 1px solid #000; padding: 3px 1px;">${day2}</td>
          <td style="padding: 3px 1px; font-size: 11px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${laporan.noMold}</td>
        </tr>
      </table>
    </td>
    <td style="width: 38%; vertical-align: top; padding: 3px 5px;">
      <b>3. FLOW APPROVAL</b>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px; text-align: center; width: 100%;">
        <div style="flex: 1; min-width: 0;">
          <div style="font-size: 6.5px; font-weight: bold; border: 1px solid #000; border-bottom: none; background: #eee;">OPR</div>
          <div style="height: 22px; border: 1px solid #000; font-size: 7px; display: flex; align-items: flex-end; justify-content: center; overflow: hidden; white-space: nowrap;">${laporan.pic.nama.split(' ')[0] || 'OPR'}</div>
        </div>
        <div style="padding: 0 1px; font-size: 8px;">➔</div>
        <div style="flex: 1; min-width: 0;">
          <div style="font-size: 6.5px; font-weight: bold; border: 1px solid #000; border-bottom: none; background: #eee;">GL</div>
          <div style="height: 22px; border: 1px solid #000; font-size: 7px; display: flex; align-items: flex-end; justify-content: center; overflow: hidden; white-space: nowrap;">${getSignName('GL')}</div>
        </div>
        <div style="padding: 0 1px; font-size: 8px;">➔</div>
        <div style="flex: 1; min-width: 0;">
          <div style="font-size: 6.5px; font-weight: bold; border: 1px solid #000; border-bottom: none; background: #eee;">FRM/SPV</div>
          <div style="height: 22px; border: 1px solid #000; font-size: 7px; display: flex; align-items: flex-end; justify-content: center; overflow: hidden; white-space: nowrap;">${getSignName('TL')}</div>
        </div>
        <div style="padding: 0 1px; font-size: 8px;">➔</div>
        <div style="flex: 1; min-width: 0;">
          <div style="font-size: 6.5px; font-weight: bold; border: 1px solid #000; border-bottom: none; background: #eee;">STAFF</div>
          <div style="height: 22px; border: 1px solid #000; font-size: 7px; display: flex; align-items: flex-end; justify-content: center; overflow: hidden; white-space: nowrap;">${getSignName('ADM')}</div>
        </div>
      </div>
    </td>
  </tr>
</table>

<!-- SECTION 4 & 5: LOKASI & KEJADIAN -->
<table class="table-main" style="margin-bottom: 3px; width: 100%;">
  <tr>
    <td style="width: 45%; vertical-align: top; padding: 4px 5px;">
      <div style="font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 1px; margin-bottom: 3px;">4. LOKASI</div>
      <div style="margin-bottom: 3px;"><b>Factory / Lokasi :</b> ${checklist.cm_lokasi || laporan.moldData?.lokasiMold || laporan.moldData?.factory || laporan.factory || '-'}</div>
      <div style="margin-bottom: 3px;"><b>Mold Name :</b> ${checklist.cm_mold_name || laporan.moldData?.noMold || laporan.noMold || '-'}</div>
      <div style="margin-bottom: 3px;"><b>Model :</b> ${checklist.cm_model || laporan.moldData?.model || laporan.moldData?.part || laporan.part || '-'}</div>
      <div><b>Customer :</b> ${checklist.cm_customer || laporan.moldData?.customer || '-'}</div>
    </td>
    <td style="width: 55%; vertical-align: top; padding: 4px 5px;">
      <div style="font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 1px; margin-bottom: 3px;">5. KEJADIAN</div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
        <span><b>Tanggal :</b> ${dateFormatted}</span>
        <span><b>Jam :</b> ${jamMulai || '-'}</span>
        <span><b>Shift :</b> ${laporan.shift || '-'}</span>
      </div>
      <div style="margin-bottom: 4px;"><b>Problem :</b> ${checklist.cm_problem || laporan.info || '-'}</div>
      <div style="font-size: 7.5px; border-top: 1px dashed #ccc; padding-top: 3px; line-height: 1.35;">
        ${categories.map(cat => `<span style="display:inline-block; padding: 0 2px; ${selectedCat === cat ? 'border: 1px solid #000; font-weight: bold; background: #eee;' : ''}">${cat}</span>`).join(' / ')}
      </div>
    </td>
  </tr>
</table>

<!-- SECTION 6 & 7: PHOTO / SKETSA & ANALISA ROOT CAUSE -->
<table class="table-main" style="margin-bottom: 3px; width: 100%;">
  <tr>
    <td style="width: 48%; vertical-align: top; padding: 0;">
      <div style="background: #eee; font-weight: bold; padding: 2px 5px; border-bottom: 1px solid #000;">6. PHOTO / SKETSA PROBLEM</div>
      <div style="min-height: 85px; padding: 4px; display: flex; align-items: center; justify-content: center;">
        ${photoHtml}
      </div>
      <table style="width: 100%; border-top: 1px solid #000; font-size: 7.5px; table-layout: fixed;">
        <tr>
          <td style="width: 44%; border-right: 1px solid #000; padding: 3px; vertical-align: top;">
            <div style="font-weight: bold; margin-bottom: 1px;">Rank</div>
            <div><span class="chk">${rank === 'A' ? '✓' : ''}</span> <b>A :</b> Line stop customer</div>
            <div><span class="chk">${rank === 'B' ? '✓' : ''}</span> <b>B :</b> Feedback to engineering/maker</div>
            <div><span class="chk">${rank === 'C' ? '✓' : ''}</span> <b>C :</b> Problem ringan</div>
          </td>
          <td style="width: 26%; border-right: 1px solid #000; padding: 3px 2px; text-align: center; vertical-align: middle;">
            <div style="font-weight: bold; font-size: 7px;">TARGET PRODUKSI</div>
            <div style="margin-top: 2px; font-size: 7.5px;"><b>TGL:</b> ${checklist.cm_target_tgl || '-'}</div>
            <div style="margin-top: 1px; font-size: 7.5px;"><b>JAM:</b> ${checklist.cm_target_jam || '-'}</div>
          </td>
          <td style="width: 30%; padding: 0; vertical-align: top;">
            <table style="width: 100%; text-align: center; font-size: 6.5px; table-layout: fixed;">
              <tr style="background: #eee; font-weight: bold;"><td colspan="3" style="border-bottom: 1px solid #000;">Sign & Mistake %</td></tr>
              <tr style="font-weight: bold;"><td style="border-right: 1px solid #000; border-bottom: 1px solid #000; width: 33%;">Prod</td><td style="border-right: 1px solid #000; border-bottom: 1px solid #000; width: 34%;">Mold</td><td style="border-bottom: 1px solid #000; width: 33%;">Others</td></tr>
              <tr style="height: 14px;"><td style="border-right: 1px solid #000; border-bottom: 1px solid #000;">${checklist.cm_sign_prod || ''}</td><td style="border-right: 1px solid #000; border-bottom: 1px solid #000;">${checklist.cm_sign_mold || '✓'}</td><td style="border-bottom: 1px solid #000;">${checklist.cm_sign_others || ''}</td></tr>
              <tr style="font-size: 7px; font-weight: bold;"><td style="border-right: 1px solid #000;">${checklist.cm_mistake_prod || '0'}%</td><td style="border-right: 1px solid #000;">${checklist.cm_mistake_mold || '100'}%</td><td>${checklist.cm_mistake_others || '0'}%</td></tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
    <td style="width: 52%; vertical-align: top; padding: 0;">
      <div style="background: #eee; font-weight: bold; padding: 2px 5px; border-bottom: 1px solid #000;">7. ANALISA PENYEBAB TERJADINYA MASALAH</div>
      <div style="padding: 3px 5px; font-weight: bold; color: #444; font-size: 8px; border-bottom: 1px dashed #ccc;">Why ➔ Why ➔ Why ➔ Why ➔ Root Cause</div>
      <div style="padding: 5px; font-size: 8px; line-height: 1.4; min-height: 140px;">
        ${(checklist.cm_why1 || checklist.cm_why2 || checklist.cm_why3 || checklist.cm_why4 || checklist.cm_why5) ? `
          <div style="margin-bottom: 3px;"><b>Why 1 :</b> ${checklist.cm_why1 || '-'}</div>
          <div style="margin-bottom: 3px;"><b>Why 2 :</b> ${checklist.cm_why2 || '-'}</div>
          <div style="margin-bottom: 3px;"><b>Why 3 :</b> ${checklist.cm_why3 || '-'}</div>
          <div style="margin-bottom: 3px;"><b>Why 4 :</b> ${checklist.cm_why4 || '-'}</div>
          <div style="margin-top: 4px; padding-top: 3px; border-top: 1px solid #ccc; font-weight: bold; color: #000;"><b>Why 5 (Root Cause) :</b> ${checklist.cm_why5 || '-'}</div>
        ` : `<div style="white-space: pre-wrap;">${checklist.cm_why || laporan.countermeasure || 'Belum ada analisa Root Cause (5-Why)'}</div>`}
      </div>
    </td>
  </tr>
</table>

<!-- SECTION 8, 9, 10, 11: PERBAIKAN, WAKTU KERJA, JUDGEMENT, FEEDBACK -->
<table class="table-main" style="margin-bottom: 3px; width: 100%;">
  <tr>
    <td style="width: 52%; vertical-align: top; padding: 0;">
      <div style="background: #eee; font-weight: bold; padding: 2px 5px; border-bottom: 1px solid #000;">8. PERBAIKAN & KAIZEN</div>
      <table style="width: 100%; border-collapse: collapse; font-size: 7.5px; table-layout: fixed;">
        <tr style="background: #f8f8f8; text-align: center; font-weight: bold;">
          <td style="border-right: 1px solid #000; border-bottom: 1px solid #000; width: 65%; padding: 2px;">ITEM PERBAIKAN / KAIZEN</td>
          <td style="border-right: 1px solid #000; border-bottom: 1px solid #000; width: 20%; padding: 2px;">TANGGAL</td>
          <td style="border-bottom: 1px solid #000; width: 15%; padding: 2px;">JAM</td>
        </tr>
        <tr style="height: 36px; vertical-align: top;">
          <td style="border-right: 1px solid #000; padding: 3px; font-size: 8px;">${checklist.cm_perbaikan_item || laporan.countermeasure || '-'}</td>
          <td style="border-right: 1px solid #000; text-align: center; padding: 3px;">${checklist.cm_perbaikan_tgl || dateFormatted}</td>
          <td style="text-align: center; padding: 3px;">${checklist.cm_perbaikan_jam || jamSelesai || '-'}</td>
        </tr>
      </table>
      <div style="background: #eee; font-weight: bold; padding: 2px 5px; border-top: 1px solid #000; border-bottom: 1px solid #000;">11. FEED BACK ( RANK B ONLY )</div>
      <div style="padding: 4px 5px; min-height: 22px; font-size: 8px;">${rank === 'B' ? (checklist.cm_feedback || '(Tulis feedback ke engineering/maker)') : '(Hanya berlaku untuk problem Rank B)'}</div>
    </td>
    <td style="width: 48%; vertical-align: top; padding: 0;">
      <div style="background: #eee; font-weight: bold; padding: 2px 5px; border-bottom: 1px solid #000;">9. WAKTU KERJA</div>
      <table style="width: 100%; font-size: 8px; padding: 2px; line-height: 1.4; table-layout: fixed;">
        <tr>
          <td style="padding: 2px 5px; width: 60%;"><b>Perbaikan di M/C</b> (Mesin)</td>
          <td style="width: 40%;">: <b>${mcHours}</b> H &nbsp;&nbsp; <b>${mcMins}</b> M</td>
        </tr>
        <tr>
          <td style="padding: 2px 5px;"><b>Perbaikan di Maint</b> (Bengkel)</td>
          <td>: <b>${maintHours}</b> H &nbsp;&nbsp; <b>${maintMins}</b> M</td>
        </tr>
        <tr style="border-top: 1px dashed #ccc; font-weight: bold;">
          <td style="padding: 2px 5px;">Total Waktu</td>
          <td>: <b>${totHours}</b> H &nbsp; <b>${totMins}</b> M &nbsp; (= <b>${totDecimal}</b> H)</td>
        </tr>
      </table>
      <div style="background: #eee; font-weight: bold; padding: 2px 5px; border-top: 1px solid #000; border-bottom: 1px solid #000;">10. JUDGEMENT</div>
      <div style="padding: 3px 5px; font-size: 8px; border-bottom: 1px solid #000;">
        <b>AKTUAL SELESAI :</b> &nbsp; TGL : <b>${checklist.cm_selesai_tgl || dateFormatted}</b> &nbsp; JAM : <b>${jamSelesai || '-'}</b>
      </div>
      <table style="width: 100%; text-align: center; font-size: 7.5px; table-layout: fixed;">
        <tr>
          <td style="width: 46%; border-right: 1px solid #000; padding: 3px 4px; text-align: left;">
            <div style="margin-bottom: 3px;"><span class="chk">${judgeType === 'Temporary' ? '✓' : ''}</span> Temporary &nbsp; <span class="chk">${judgeResult === 'OK' ? '✓' : ''}</span> <b>OK</b></div>
            <div><span class="chk">${judgeType === 'Permanent' ? '✓' : ''}</span> Permanent &nbsp; <span class="chk">${judgeResult === 'NG' ? '✓' : ''}</span> <b>NG</b></div>
          </td>
          <td style="width: 54%; padding: 0;">
            <table style="width: 100%; font-size: 7px; table-layout: fixed;">
              <tr style="background: #f5f5f5; font-weight: bold;"><td style="border-right: 1px solid #000; border-bottom: 1px solid #000; width: 25%;">Prod</td><td style="border-right: 1px solid #000; border-bottom: 1px solid #000; width: 25%;">QA/QI</td><td style="border-right: 1px solid #000; border-bottom: 1px solid #000; width: 25%;">MOLD</td><td style="border-bottom: 1px solid #000; width: 25%;">ENG</td></tr>
              <tr style="height: 18px; font-weight: bold;"><td style="border-right: 1px solid #000;"></td><td style="border-right: 1px solid #000;"></td><td style="border-right: 1px solid #000; overflow: hidden; white-space: nowrap;">${laporan.pic.nama.split(' ')[0]}</td><td></td></tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- SECTION 12 & 13: M/P COST & PEMAKAIAN SPARE PARTS -->
<table class="table-main" style="margin-bottom: 2px; width: 100%;">
  <tr>
    <td style="width: 45%; vertical-align: top; padding: 0;">
      <div style="background: #eee; font-weight: bold; padding: 2px 5px; border-bottom: 1px solid #000;">12. M/P COST</div>
      <table style="width: 100%; font-size: 8px; table-layout: fixed;">
        <tr style="border-bottom: 1px solid #000;">
          <td style="padding: 4px 5px; width: 65%;">
            <b>In House :</b><br>
            <span style="display: inline-block; margin-top: 2px;">( <b>${totDecimal}</b> H ) x ( <b>${jumlahOrang}</b> MP ) x Rp 89.595</span>
          </td>
          <td style="border-left: 1px solid #000; padding: 4px 5px; text-align: right; vertical-align: bottom; font-weight: bold; width: 35%;">
            Rp ${inHouseCost.toLocaleString('id-ID')}<br><span style="font-size: 7px; color: #555;">(A)</span>
          </td>
        </tr>
        <tr style="border-bottom: 1px solid #000;">
          <td style="padding: 4px 5px;">
            <b>Out House :</b><br>
            <div style="margin-top: 2px;">Proses : <b>${checklist.cm_outhouse_proses || '-'}</b></div>
            <div style="margin-top: 1px;">Supplier : <b>${checklist.cm_outhouse_supplier || '-'}</b></div>
          </td>
          <td style="border-left: 1px solid #000; padding: 4px 5px; text-align: right; vertical-align: bottom; font-weight: bold;">
            Rp ${outHouseCost.toLocaleString('id-ID')}<br><span style="font-size: 7px; color: #555;">(B)</span>
          </td>
        </tr>
        <tr style="background: #e8e8e8; font-size: 9px;">
          <td style="padding: 5px; font-weight: 900; text-align: center;">
            TOTAL COST [ (A) + (B) + (C) ]
          </td>
          <td style="border-left: 1px solid #000; padding: 5px; font-weight: 900; text-align: right; font-size: 10px;">
            Rp ${grandTotalCost.toLocaleString('id-ID')}
          </td>
        </tr>
      </table>
    </td>
    <td style="width: 55%; vertical-align: top; padding: 0;">
      <div style="background: #eee; font-weight: bold; padding: 2px 5px; border-bottom: 1px solid #000;">13. PEMAKAIAN SPARE PARTS</div>
      <table style="width: 100%; border-collapse: collapse; font-size: 7.5px; table-layout: fixed;">
        <tr style="background: #f5f5f5; text-align: center; font-weight: bold;">
          <td style="border: 1px solid #000; width: 8%; padding: 2px;">No</td>
          <td style="border: 1px solid #000; width: 43%; padding: 2px;">Parts Name</td>
          <td style="border: 1px solid #000; width: 15%; padding: 2px;">STD/SP</td>
          <td style="border: 1px solid #000; width: 10%; padding: 2px;">Qty</td>
          <td style="border: 1px solid #000; width: 24%; padding: 2px;">Cost</td>
        </tr>
        ${spRowsHtml}
        <tr style="font-weight: bold; background: #f8f8f8;">
          <td colspan="3" style="border: 1px solid #000; padding: 3px 5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">ORDER NO : ${checklist.cm_order_no || '-'}</td>
          <td colspan="2" style="border: 1px solid #000; text-align: right; padding: 3px 5px; font-size: 8px;">SUB TOTAL (C) = Rp ${_totalSparepart.toLocaleString('id-ID')}</td>
        </tr>
      </table>
      <div style="text-align: right; padding: 2px 5px; font-weight: bold; font-size: 8.5px; color: #333;">
        QF/MOLD-013
      </div>
    </td>
  </tr>
</table>

</body>
</html>`

    const win = window.open('', '_blank', 'width=1000,height=800')
    if (!win) {
      alert('Popup diblokir browser. Tolong izinkan popup untuk halaman ini.')
      return
    }
    win.document.write(html)
    win.document.close()
  }

  // Print function - opens a fresh standalone window with exactly matching form layout
  const handlePrint = () => {
    if (!laporan) return

    const _isOverhaul = laporan.jenis === 'OH MOLD' || laporan.jenis === 'OH_MOLD'
    if (!_isOverhaul) {
      handlePrintCmCard()
      return
    }

    const _totalSparepart = spareparts.reduce((s, sp) => s + (sp.qty * Number(sp.hargaSatuan)), 0)

    const calcMpCost = (k: string) => {
      const box = checklist[k] || {}
      const start = box.jamMulai || ''; const end = box.jamSelesai || ''
      const people = Number(box.orang) || 0
      if (!start || !end) return 0
      const [hS, mS] = start.split(':').map(Number)
      const [hE, mE] = end.split(':').map(Number)
      let diff = (hE * 60 + mE) - (hS * 60 + mS)
      if (diff < 0) diff += 24 * 60
      return Math.round((diff / 60) * 89595 * people)
    }

    const _totalMpCost = _isOverhaul
      ? (['b1','b2','b3','b4','b5'] as const).reduce((s, k) => s + calcMpCost(k), 0)
      : (() => {
          if (!jamMulai || !jamSelesai) return 0
          const [hS, mS] = jamMulai.split(':').map(Number)
          const [hE, mE] = jamSelesai.split(':').map(Number)
          let diff = (hE * 60 + mE) - (hS * 60 + mS)
          if (diff < 0) diff += 24 * 60
          return Math.round((diff / 60) * 89595 * jumlahOrang)
        })()
    const _totalCost = _totalMpCost + _totalSparepart

    const approvals = laporan.checksheet?.approvals || []
    const _picSign = approvals.find(a => a.role === 'PIC')
    const _tlSign  = approvals.find(a => a.role === 'TL')
    const _glSign  = approvals.find(a => a.role === 'GL')
    const _admSign = approvals.find(a => a.role === 'ADM')

    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const jv = (key: string) => checklist[key]?.judge   || ''
    const kv = (key: string) => checklist[key]?.komentar || ''
    const fmt = (n: number) => n > 0 ? `Rp ${n.toLocaleString('id-ID')}` : '-'

    const sigBoxHtml = (sign?: ApprovalEntry | null, role?: string) =>
      `<div style="font-size:7.5px;font-weight:bold;margin-bottom:2px">${role||''}</div>
       ${sign?.signedAt && sign.user?.signature ? `<div style="text-align:center;margin:2px 0"><img src="${sign.user.signature}" alt="TTD" style="max-height:35px;display:block;margin:0 auto;object-fit:contain;" /></div>` : ''}
       <div style="min-height:26px;border-bottom:1px solid #aaa;font-size:8px;display:flex;align-items:flex-end;padding-bottom:1px">
         ${sign?.signedAt ? sign.user?.nama||'Verified' : ''}
       </div>
       <div style="font-size:7px;color:#777">${sign?.signedAt ? new Date(sign.signedAt).toLocaleDateString('id-ID') : ''}</div>`

    const costBoxHtml = (key: string, label: string) => {
      const box = checklist[key] || {}
      const cost = calcMpCost(key)
      return `<table style="width:100%;border-collapse:collapse;font-size:7px;margin-top:1px">
        <tr>
          <td colspan="5" style="border:1px solid #333;background:#e8e8e8;font-weight:bold;padding:1px 3px">M/P Cost (${label})</td>
          <td rowspan="2" style="border:1px solid #333;width:28px;text-align:center;vertical-align:middle;font-size:6.5px">PIC</td>
        </tr>
        <tr>
          <td style="border:1px solid #333;padding:1px 2px;width:22%">${box.jamMulai||''}</td>
          <td style="border:1px solid #333;padding:1px 2px;width:5%">-</td>
          <td style="border:1px solid #333;padding:1px 2px;width:22%">${box.jamSelesai||''}</td>
          <td style="border:1px solid #333;padding:1px 2px;width:5%">X</td>
          <td style="border:1px solid #333;padding:1px 2px;width:14%">${box.orang||''}</td>
        </tr>
        <tr>
          <td style="border:1px solid #333;padding:1px 2px;font-size:6.5px">X 25,000</td>
          <td style="border:1px solid #333;padding:1px 2px">=</td>
          <td colspan="3" style="border:1px solid #333;padding:1px 2px;font-weight:bold">${cost > 0 ? `Rp ${cost.toLocaleString('id-ID')}` : ''}</td>
          <td style="border:1px solid #333;font-size:6.5px;padding:1px 2px">Tgl:</td>
        </tr>
      </table>`
    }

    const judgeBlock = (costKey: string) =>
      `<tr><td colspan="6" style="border:1px solid #333;padding:2px;background:#f5f5f0">
        <table style="width:100%;border-collapse:collapse">
          <tr>
            <td style="border:none;vertical-align:top;width:35%;padding-right:4px">
              <table style="border-collapse:collapse;font-size:6.5px;width:100%">
                <tr><td style="border:1px solid #333;padding:1px 4px;font-weight:bold">JUDGE</td><td style="border:1px solid #333;padding:1px 3px">Comment :</td></tr>
                <tr><td style="border:1px solid #333;padding:1px 4px;font-weight:bold;text-align:center">OK</td><td style="border:1px solid #333;padding:1px"></td></tr>
                <tr><td style="border:1px solid #333;padding:1px 4px;font-weight:bold;text-align:center">NG</td><td style="border:1px solid #333;padding:1px"></td></tr>
              </table>
            </td>
            <td style="border:none;vertical-align:top;width:65%">${costBoxHtml(costKey, costKey)}</td>
          </tr>
        </table>
      </td></tr>`

    // Build left-col section rows (A1-A7)
    const buildLeftRows = () => {
      let html = ''
      OH_SECTIONS_A.slice(0, 7).forEach(sec => {
        html += `<tr><td colspan="6" style="background:#ccc;font-weight:bold;font-size:7px;padding:1px 3px;border:1px solid #333">${sec.judul}</td></tr>`
        const np = sec.kode.replace(/[^0-9]/g,'')
        sec.items.forEach((item, i) => {
          const key = `${sec.kode}|${i}`
          const j = jv(key); const k = kv(key)
          html += `<tr style="font-size:6.8px;line-height:1.15;height:12px">
            <td style="border:1px solid #333;padding:1px 2px;text-align:center;width:22px">${np}.${i+1}</td>
            <td style="border:1px solid #333;padding:1px 2px">${item.label}</td>
            <td style="border:1px solid #333;padding:1px 2px;width:115px">${item.metode}</td>
            <td style="border:1px solid #333;padding:1px 2px;width:135px">${item.standar}</td>
            <td style="border:1px solid #333;padding:1px 2px;text-align:center;width:28px;font-weight:bold;color:${j==='NG'?'red':''}">${j}</td>
            <td style="border:1px solid #333;padding:1px 2px;width:60px">${k}</td>
          </tr>`
        })
      })
      return html
    }

    // Build right-col rows (A8-A11 + B)
    const buildRightRows = () => {
      let html = ''
      // A8-A11
      OH_SECTIONS_A.slice(7).forEach(sec => {
        html += `<tr><td colspan="6" style="background:#ccc;font-weight:bold;font-size:7px;padding:1px 3px;border:1px solid #333">${sec.judul}</td></tr>`
        const np = sec.kode.replace(/[^0-9]/g,'')
        sec.items.forEach((item, i) => {
          const key = `${sec.kode}|${i}`
          const j = jv(key); const k = kv(key)
          html += `<tr style="font-size:6.8px;line-height:1.15;height:12px">
            <td style="border:1px solid #333;padding:1px 2px;text-align:center;width:22px">${np}.${i+1}</td>
            <td style="border:1px solid #333;padding:1px 2px">${item.label}</td>
            <td style="border:1px solid #333;padding:1px 2px;width:115px">${item.metode}</td>
            <td style="border:1px solid #333;padding:1px 2px;width:135px">${item.standar}</td>
            <td style="border:1px solid #333;padding:1px 2px;text-align:center;width:28px;font-weight:bold;color:${j==='NG'?'red':''}">${j}</td>
            <td style="border:1px solid #333;padding:1px 2px;width:60px">${k}</td>
          </tr>`
        })
      })
      html += judgeBlock('b1')
      // B. Ejector Group
      html += `<tr><td colspan="6" style="background:#444;color:#fff;font-weight:bold;font-size:7px;padding:1px 3px;border:1px solid #333">B. EJECTOR GROUP</td></tr>`
      OH_SECTIONS_EG.forEach(sec => {
        html += `<tr><td colspan="6" style="background:#ccc;font-weight:bold;font-size:7px;padding:1px 3px;border:1px solid #333">${sec.judul}</td></tr>`
        const np = sec.kode.replace(/[^0-9]/g,'')
        sec.items.forEach((item, i) => {
          const key = `${sec.kode}|${i}`
          const j = jv(key); const k = kv(key)
          html += `<tr style="font-size:6.8px;line-height:1.15;height:12px">
            <td style="border:1px solid #333;padding:1px 2px;text-align:center;width:22px">${np}.${i+1}</td>
            <td style="border:1px solid #333;padding:1px 2px">${item.label}</td>
            <td style="border:1px solid #333;padding:1px 2px;width:115px">${item.metode}</td>
            <td style="border:1px solid #333;padding:1px 2px;width:135px">${item.standar}</td>
            <td style="border:1px solid #333;padding:1px 2px;text-align:center;width:28px;font-weight:bold;color:${j==='NG'?'red':''}">${j}</td>
            <td style="border:1px solid #333;padding:1px 2px;width:60px">${k}</td>
          </tr>`
        })
      })
      html += judgeBlock('b2')
      return html
    }

    // Build CDE section panel (page 2) with exact 2-column layout matching physical form screenshot
    const buildCDEPanel = (sec: typeof OH_SECTIONS_CDE[0]) => {
      const imgSrc = `${origin}${sec.img}`
      const leftItems = sec.items.slice(0, 5)
      const rightItems = sec.items.slice(5, 10)

      const renderItemRows = (itemsList: string[], startIdx: number) => {
        return itemsList.map((label, idx) => {
          const actualIdx = startIdx + idx
          const key = `${sec.kode}|${actualIdx}`
          const j = jv(key); const k = kv(key)
          return `<tr style="height:14px;font-size:7px">
            <td style="border:none;padding:1px 2px;width:115px">${actualIdx + 1}. ${label}</td>
            <td style="border:1px solid #333;width:28px;text-align:center;font-weight:bold;background:#fff;color:${j==='NG'?'red':'#000'}">${j || ''}</td>
            <td style="border-bottom:1px solid #bbb;padding:1px 3px;width:75px;color:#333">${k || ''}</td>
          </tr>`
        }).join('')
      }

      return `<div style="border:1px solid #333;margin-bottom:6px;background:#fff;display:flex;flex-direction:column">
        <div style="background:#333;color:#fff;font-weight:bold;font-size:8px;padding:2px 5px">${sec.judul}</div>
        
        <div style="display:flex;padding:4px;gap:6px;border-bottom:1px solid #eee;align-items:center">
          <div style="flex:1;display:flex;justify-content:center;align-items:center;min-height:85px">
            <img src="${imgSrc}" style="max-height:84px;max-width:280px;object-fit:contain;display:block" onerror="this.style.display='none'" />
          </div>
          <div style="width:170px;display:flex;flex-direction:column;gap:4px">
            <div style="border:1px solid #333;padding:3px;background:#fff">
              <div style="font-weight:bold;font-size:6.5px;color:#222;margin-bottom:1px">STD :</div>
              <div style="font-size:6.5px;line-height:1.2;color:#222">${sec.std}</div>
            </div>
            <div style="border:1px solid #333;padding:3px;background:#fff">
              <div style="font-weight:bold;font-size:6.5px;color:#222;margin-bottom:1px">METODE CHECK :</div>
              <div style="font-size:6.5px;color:#222">${sec.metodeCheck}</div>
            </div>
          </div>
        </div>

        <div style="padding:4px 6px;display:flex;justify-content:space-between;gap:14px">
          <table style="border-collapse:collapse;flex:1">
            <thead>
              <tr style="font-size:6.5px;color:#555">
                <th style="border:none;padding:1px;text-align:left"></th>
                <th style="border:1px solid #333;background:#eee;padding:1px;text-align:center">JUDGE</th>
                <th style="border:none;padding:1px 0 1px 4px;text-align:left">COMMENT</th>
              </tr>
            </thead>
            <tbody>${renderItemRows(leftItems, 0)}</tbody>
          </table>
          <table style="border-collapse:collapse;flex:1">
            <thead>
              <tr style="font-size:6.5px;color:#555">
                <th style="border:none;padding:1px;text-align:left"></th>
                <th style="border:1px solid #333;background:#eee;padding:1px;text-align:center">JUDGE</th>
                <th style="border:none;padding:1px 0 1px 4px;text-align:left">COMMENT</th>
              </tr>
            </thead>
            <tbody>${renderItemRows(rightItems, 5)}</tbody>
          </table>
        </div>

        <div style="display:flex;justify-content:space-between;align-items:flex-end;padding:4px 6px;background:#f9f9f9;border-top:1px solid #ccc">
          <table style="border-collapse:collapse;font-size:7px;background:#fff">
            <tr><td style="border:1px solid #333;padding:1px 5px;font-weight:bold;background:#eee">JUDGE</td><td style="border:1px solid #333;padding:1px 4px;background:#eee">Comment :</td></tr>
            <tr><td style="border:1px solid #333;padding:2px 6px;font-weight:bold;text-align:center">OK</td><td style="border:1px solid #333;padding:1px;width:80px"></td></tr>
            <tr><td style="border:1px solid #333;padding:2px 6px;font-weight:bold;text-align:center">NG</td><td style="border:1px solid #333;padding:1px"></td></tr>
          </table>
          <div style="width:240px">${costBoxHtml(sec.costLabel, sec.costLabel)}</div>
        </div>
      </div>`
    }

    // Sparepart rows for page 2
    let sp2Rows = ''
    for (let r = 0; r < 10; r++) {
      const sp = spareparts[r]
      sp2Rows += `<tr style="font-size:7.5px">
        <td style="border:1px solid #333;padding:1px 3px;text-align:center;height:14px">${sp ? r+1 : ''}</td>
        <td style="border:1px solid #333;padding:1px 3px">${sp ? sp.namaSparepart : ''}</td>
        <td style="border:1px solid #333;padding:1px 3px;text-align:center">${sp ? sp.qty : ''}</td>
        <td style="border:1px solid #333;padding:1px 3px;text-align:right">${sp ? `Rp ${(sp.qty*Number(sp.hargaSatuan)).toLocaleString('id-ID')}` : ''}</td>
      </tr>`
    }

    const tglKerja = new Date(laporan.tanggal)
    const planDate = tglKerja.toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' })

    const pageHdr = (hal: string) =>
      `<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:2px">
        <div style="font-size:7px"><b>PT.SUGITY CREATIVES</b><br>MOLD MAINTENANCE DIVISION<br>Hal : ${hal}</div>
        <div style="text-align:center;flex:1;padding:0 8px">
          <div style="font-size:13px;font-weight:bold;text-decoration:underline">DATA PEMERIKSAAN OVERHAUL MOLD ( HALAMAN ${hal.split('/')[0].trim()} )</div>
        </div>
        <div style="font-size:6.5px">
          <table style="border-collapse:collapse">
            <tr><td style="border:1px solid #333;padding:1px 3px">OK</td><td style="border:1px solid #333;width:25px"></td></tr>
            <tr><td style="border:1px solid #333;padding:1px 3px">Np</td><td style="border:1px solid #333"></td></tr>
            <tr><td style="border:1px solid #333;padding:1px 3px">T/P</td><td style="border:1px solid #333"></td></tr>
          </table>
        </div>
      </div>`

    const infoBarHtml =
      `<table style="width:100%;border-collapse:collapse;font-size:7px;margin-bottom:3px">
        <tr style="background:#ddd">
          <td style="border:1px solid #333;padding:1px 2px;text-align:center;font-weight:bold;width:48px">PLAN DATE</td>
          <td style="border:1px solid #333;padding:1px 2px;text-align:center;font-weight:bold">MOLD NAME</td>
          <td style="border:1px solid #333;padding:1px 2px;text-align:center;font-weight:bold">CUSTOMER</td>
          <td style="border:1px solid #333;padding:1px 2px;text-align:center;font-weight:bold">MODEL</td>
          <td style="border:1px solid #333;padding:1px 2px;text-align:center;font-weight:bold;width:28px">FACT</td>
          <td style="border:1px solid #333;padding:1px 2px;text-align:center;font-weight:bold;width:33px">SHIFT</td>
          <td style="border:1px solid #333;padding:1px 2px;text-align:center;font-weight:bold">PROD.SHOT</td>
          <td style="border:1px solid #333;padding:1px 2px;text-align:center;font-weight:bold">OH SHOT</td>
          <td style="border:1px solid #333;padding:1px 2px;text-align:center;font-weight:bold">SPARE PART</td>
          <td style="border:1px solid #333;padding:1px 2px;text-align:center;font-weight:bold">M/F COST</td>
          <td style="border:1px solid #333;padding:1px 2px;text-align:center;font-weight:bold">TOTAL COST</td>
          <td style="border:1px solid #333;padding:1px 2px;text-align:center;font-weight:bold;width:45px">MOLD NO</td>
          <td style="border:1px solid #333;padding:1px 2px;text-align:center;font-weight:bold">DATE</td>
          <td style="border:1px solid #333;padding:1px 2px;text-align:center;font-weight:bold">MONTH</td>
          <td style="border:1px solid #333;padding:1px 2px;text-align:center;font-weight:bold">YEAR</td>
        </tr>
        <tr style="font-size:7px">
          <td style="border:1px solid #333;padding:1px 2px">${planDate}</td>
          <td style="border:1px solid #333;padding:1px 2px">${laporan.noMold}</td>
          <td style="border:1px solid #333;padding:1px 2px">-</td>
          <td style="border:1px solid #333;padding:1px 2px">${laporan.part||'-'}</td>
          <td style="border:1px solid #333;padding:1px 2px;text-align:center">${laporan.factory}</td>
          <td style="border:1px solid #333;padding:1px 2px;text-align:center">${laporan.shift||'-'}</td>
          <td style="border:1px solid #333;padding:1px 2px;text-align:center">-</td>
          <td style="border:1px solid #333;padding:1px 2px;text-align:center">-</td>
          <td style="border:1px solid #333;padding:1px 2px;text-align:right">${fmt(_totalSparepart)}</td>
          <td style="border:1px solid #333;padding:1px 2px;text-align:right">${fmt(_totalMpCost)}</td>
          <td style="border:1px solid #333;padding:1px 2px;text-align:right;font-weight:bold">${fmt(_totalCost)}</td>
          <td style="border:1px solid #333;padding:1px 2px;text-align:center">${laporan.noMold}</td>
          <td style="border:1px solid #333;padding:1px 2px;text-align:center">${tglKerja.getDate()}</td>
          <td style="border:1px solid #333;padding:1px 2px;text-align:center">${tglKerja.toLocaleDateString('id-ID',{month:'long'})}</td>
          <td style="border:1px solid #333;padding:1px 2px;text-align:center">${tglKerja.getFullYear()}</td>
        </tr>
      </table>
      <table style="width:100%;border-collapse:collapse;font-size:7.5px;margin-bottom:3px;border:1px solid #333">
        <tr>
          <td style="width:50%;border-right:1px solid #333;padding:2px 4px;vertical-align:top;background:#f9f9f9">
            <span style="font-weight:bold;color:#444">INFORMASI / PROBLEM : </span>
            <span style="font-weight:bold;color:#000">${laporan.info || '-'}</span>
          </td>
          <td style="width:50%;padding:2px 4px;vertical-align:top;background:#f9f9f9">
            <span style="font-weight:bold;color:#444">COUNTERMEASURE / TINDAKAN : </span>
            <span style="font-weight:bold;color:#000">${laporan.countermeasure || '-'}</span>
          </td>
        </tr>
      </table>`

    const signRowHtml =
      `<table style="width:100%;border-collapse:collapse;font-size:7.5px;margin-top:4px">
        <tr>
          <td style="border:1px solid #333;padding:2px 5px;width:25%">${sigBoxHtml(_picSign,'PIC / Member')}</td>
          <td style="border:1px solid #333;padding:2px 5px;width:25%">${sigBoxHtml(_tlSign,'Team Leader')}</td>
          <td style="border:1px solid #333;padding:2px 5px;width:25%">${sigBoxHtml(_glSign,'Group Leader')}</td>
          <td style="border:1px solid #333;padding:2px 5px;width:25%">${sigBoxHtml(_admSign,'ADM')}</td>
        </tr>
      </table>`

    const hasCoolingOrHeater = Boolean(
      (laporan.coreActual && laporan.coreActual !== '') ||
      (laporan.cavActual && laporan.cavActual !== '') ||
      (laporan.heaterActual && (Array.isArray(laporan.heaterActual) ? (laporan.heaterActual as any[]).some(x => x && x !== '') : Boolean(laporan.heaterActual))) ||
      (laporan.moldData?.heaterStd && Array.isArray(laporan.moldData.heaterStd) && laporan.moldData.heaterStd.length > 0)
    )
    const totalPages = hasCoolingOrHeater ? 3 : 2

    const buildHeaterSection = () => {
      const stdHeaters = Array.isArray(laporan.moldData?.heaterStd) ? laporan.moldData.heaterStd : []
      const actHeaters = Array.isArray(laporan.heaterActual) ? laporan.heaterActual : (laporan.heaterActual ? [laporan.heaterActual] : [])
      const isAllOk = actHeaters.length === 1 && (actHeaters[0] === 'OK' || actHeaters[0] === 'ok' || actHeaters[0] === 'Ok')

      const count = Math.max(stdHeaters.length, isAllOk ? stdHeaters.length : actHeaters.length)
      if (count === 0) {
        return `<div style="border:1px solid #333;margin-top:6px">
          <div style="background:#444;color:#fff;font-weight:bold;font-size:8px;padding:2px 4px">H. DATA PEMERIKSAAN HEATER RESISTANCE (OHM)</div>
          <div style="padding:8px;text-align:center;color:#666;font-size:8px">Tidak menggunakan heater (No Heater) / Tidak ada data pengukuran heater.</div>
        </div>`
      }

      const buildTable = (startIdx: number, endIdx: number) => {
        let rows = ''
        for (let i = startIdx; i < endIdx; i++) {
          if (i >= count) break
          const stdVal = stdHeaters[i] !== undefined && stdHeaters[i] !== null ? `${stdHeaters[i]} Ω` : '-'
          let actVal = '-'
          let judge = '-'
          let color = '#000'

          if (isAllOk) {
            actVal = 'OK (Sesuai Standar)'
            judge = 'OK'
            color = 'green'
          } else if (actHeaters[i] !== undefined && actHeaters[i] !== null && actHeaters[i] !== '') {
            const v = String(actHeaters[i]).trim()
            actVal = isNaN(Number(v)) ? v : `${v} Ω`
            judge = v.toLowerCase() === 'ok' || (!isNaN(Number(v)) && Number(v) > 0) ? 'OK' : 'NG'
            color = judge === 'NG' ? 'red' : 'green'
          }

          rows += `<tr style="font-size:7px;line-height:1.2">
            <td style="border:1px solid #333;padding:1.5px 3px;text-align:center;font-weight:bold;width:25px">H${i + 1}</td>
            <td style="border:1px solid #333;padding:1.5px 3px;text-align:center">${stdVal}</td>
            <td style="border:1px solid #333;padding:1.5px 3px;text-align:center;font-weight:bold;color:${color}">${actVal}</td>
            <td style="border:1px solid #333;padding:1.5px 3px;text-align:center;font-weight:bold;color:${color};width:40px">${judge}</td>
          </tr>`
        }
        return `<table style="width:100%;border-collapse:collapse">
          <thead>
            <tr style="background:#ddd;font-size:7px">
              <th style="border:1px solid #333;padding:1.5px 3px;width:25px;text-align:center">NO</th>
              <th style="border:1px solid #333;padding:1.5px 3px">STANDAR RESISTANSI (Ω)</th>
              <th style="border:1px solid #333;padding:1.5px 3px">AKTUAL RESISTANSI (Ω)</th>
              <th style="border:1px solid #333;padding:1.5px 3px;width:40px;text-align:center">JUDGE</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>`
      }

      if (count <= 6) {
        return `<div style="border:1px solid #333;margin-top:6px">
          <div style="background:#444;color:#fff;font-weight:bold;font-size:8px;padding:2px 4px">H. DATA PEMERIKSAAN HEATER RESISTANCE (OHM)</div>
          ${buildTable(0, count)}
        </div>`
      } else {
        const half = Math.ceil(count / 2)
        return `<div style="margin-top:6px">
          <div style="border:1px solid #333;background:#444;color:#fff;font-weight:bold;font-size:8px;padding:2px 4px">H. DATA PEMERIKSAAN HEATER RESISTANCE (OHM)</div>
          <div class="cols" style="margin-top:2px">
            <div class="cl" style="border:1px solid #333">${buildTable(0, half)}</div>
            <div class="cr" style="border:1px solid #333">${buildTable(half, count)}</div>
          </div>
        </div>`
      }
    }

    const htmlContent = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8"/>
  <title>DATA PEMERIKSAAN OVERHAUL MOLD - ${laporan.noMold}</title>
  <style>
    * { box-sizing:border-box; margin:0; padding:0; }
    body { font-family:Arial,sans-serif; font-size:7px; color:#000; background:#fff; line-height:1.15; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    @page { size:A4 landscape; margin:4mm 5mm; }
    @media print { 
      body { margin:0; }
      .pg { width:100%; max-height:200mm; page-break-after:always; overflow:visible; display:flex; flex-direction:column; justify-content:flex-start; gap:3px; } 
      .pg:last-child { page-break-after:auto; } 
    }
    .pg { width:297mm; min-height:200mm; padding:4mm 5mm; margin:0 auto; background:#fff; display:flex; flex-direction:column; justify-content:flex-start; gap:3px; }
    .cols { display:flex; gap:6px; align-items:flex-start; width:100%; }
    .cl, .cr { flex:1; width:50%; min-width:0; }
    table { width:100%; table-layout:fixed; border-collapse:collapse; }
    table td, table th { padding:1px 2px; word-wrap:break-word; overflow-wrap:break-word; }
    img { display:block; }
  </style>
</head>
<body>

<div class="pg">
  ${pageHdr(`1 / ${totalPages}`)}
  ${infoBarHtml}
  <div class="cols">
    <div class="cl">
      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr><td colspan="6" style="border:1px solid #333;background:#555;color:#fff;font-weight:bold;font-size:8px;padding:1px 4px">A. MAIN CHECK</td></tr>
          <tr style="background:#ddd;font-size:7px">
            <th style="border:1px solid #333;padding:1px;width:22px;text-align:center">No</th>
            <th style="border:1px solid #333;padding:1px">ITEM</th>
            <th style="border:1px solid #333;padding:1px;width:115px">METODE</th>
            <th style="border:1px solid #333;padding:1px;width:135px">STANDARD</th>
            <th style="border:1px solid #333;padding:1px;width:28px;text-align:center">JUDGE</th>
            <th style="border:1px solid #333;padding:1px;width:60px">COMMENT</th>
          </tr>
        </thead>
        <tbody>${buildLeftRows()}</tbody>
      </table>
    </div>
    <div class="cr">
      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="background:#ddd;font-size:7px">
            <th style="border:1px solid #333;padding:1px;width:22px;text-align:center">No</th>
            <th style="border:1px solid #333;padding:1px">ITEM</th>
            <th style="border:1px solid #333;padding:1px;width:115px">METODE</th>
            <th style="border:1px solid #333;padding:1px;width:135px">STANDARD</th>
            <th style="border:1px solid #333;padding:1px;width:28px;text-align:center">JUDGE</th>
            <th style="border:1px solid #333;padding:1px;width:60px">COMMENT</th>
          </tr>
        </thead>
        <tbody>${buildRightRows()}</tbody>
      </table>
    </div>
  </div>
  <div style="display:flex;justify-content:space-between;font-size:6.5px;border-top:1px solid #bbb;margin-top:2px;padding-top:2px">
    <span>&#9633; PIC &nbsp; &#9633; BL/FRM &nbsp; &#9633; ADM (Spare part cost)</span>
    <span>&#9633; Original &nbsp; &#9633; Copy &nbsp; &#9633; History &nbsp; &#9633; Staff</span>
    <span>Audrey 28/02/18 &nbsp; QF/MOLD-009/01</span>
  </div>
</div>

<div class="pg" style="page-break-before:always">
  ${pageHdr(`2 / ${totalPages}`)}
  <div class="cols">
    <div class="cl">
      ${buildCDEPanel(OH_SECTIONS_CDE[0])}
      ${buildCDEPanel(OH_SECTIONS_CDE[2])}
      <div style="border:1px solid #333; margin-top: 3px;">
        <div style="background:#444; color:#fff; font-weight:bold; font-size:8px; padding:2px 4px; border-bottom:1px solid #333;">
          H. FOTO / DOKUMENTASI PEMERIKSAAN OVERHAUL
        </div>
        <div style="padding:4px; min-height:75px; display:flex; gap:6px; justify-content:center; align-items:center; flex-wrap:wrap; background:#fafafa;">
          ${foto && foto.length > 0 ? 
            foto.map((f: string) => {
              const src = (f.startsWith('data:') || f.startsWith('http') || f.startsWith('blob:')) ? f : (f.startsWith('/') ? origin + f : origin + '/' + f)
              return `<div style="border:1px solid #aaa; padding:2px; background:#fff; display:flex; align-items:center; justify-content:center;"><img src="${src}" style="max-height:95px; max-width:140px; object-fit:contain; display:block;" /></div>`
            }).join('') 
            : '<span style="color:#777; font-style:italic; font-size:8px;">( Tidak ada foto terlampir / dokumentasi )</span>'}
        </div>
      </div>
    </div>
    <div class="cr">
      ${buildCDEPanel(OH_SECTIONS_CDE[1])}
      <div style="border:1px solid #333">
        <div style="background:#444;color:#fff;font-weight:bold;font-size:8px;padding:2px 4px">F. PEMAKAIAN / ORDER SPARE PART</div>
        <table style="width:100%;border-collapse:collapse">
          <tr style="background:#ddd;font-size:7px">
            <th style="border:1px solid #333;padding:1px 3px;width:22px">NO</th>
            <th style="border:1px solid #333;padding:1px 3px">NAME / DRAWING</th>
            <th style="border:1px solid #333;padding:1px 3px;width:28px">QTY</th>
            <th style="border:1px solid #333;padding:1px 3px;width:65px">COST (Rp)</th>
          </tr>
          ${sp2Rows}
        </table>
        <div style="display:flex">
          <div style="flex:1;border:1px solid #ccc;padding:3px">
            <div style="font-size:7px;font-weight:bold">Comment :</div>
            <div style="font-size:7.5px;min-height:24px;margin-top:2px">${catatan||''}</div>
          </div>
          <div style="width:140px;border:1px solid #ccc;padding:3px">
            <div style="font-size:7px;font-weight:bold">SPARE PART COST ( a )</div>
            <div style="font-size:8px;font-weight:bold;margin-top:3px">Rp: ${_totalSparepart > 0 ? _totalSparepart.toLocaleString('id-ID') : ''}</div>
            <div style="font-size:6.5px;margin-top:8px">PIC &nbsp;&nbsp; Tgl :</div>
          </div>
        </div>
      </div>
    </div>
  </div>
  ${signRowHtml}
  <div style="display:flex;justify-content:space-between;font-size:6.5px;border-top:1px solid #bbb;margin-top:2px;padding-top:2px">
    <span>PIC Pembuat : ${laporan.pic.nama}</span>
    <span>Audrey 28/02/18 &nbsp; QF/MOLD-009/01</span>
  </div>
</div>

${hasCoolingOrHeater ? `
<div class="pg" style="page-break-before:always">
  ${pageHdr(`3 / ${totalPages}`)}
  ${infoBarHtml}
  <div style="border:1px solid #333;margin-top:4px">
    <div style="background:#555;color:#fff;font-weight:bold;font-size:8px;padding:2px 4px">G. DATA PEMERIKSAAN COOLING (CORE & CAVITY)</div>
    <table style="width:100%;border-collapse:collapse">
      <thead>
        <tr style="background:#ddd;font-size:7px">
          <th style="border:1px solid #333;padding:2px 4px;width:30%">AREA COOLING</th>
          <th style="border:1px solid #333;padding:2px 4px;width:35%">STANDAR DEBIT (L / MNT)</th>
          <th style="border:1px solid #333;padding:2px 4px;width:35%">AKTUAL PENGECEKAN (L / MNT)</th>
        </tr>
      </thead>
      <tbody>
        <tr style="font-size:7.5px">
          <td style="border:1px solid #333;padding:3px 6px;font-weight:bold">COOLING CORE</td>
          <td style="border:1px solid #333;padding:3px 6px;text-align:center">${laporan.moldData?.coreStd ? `${laporan.moldData.coreStd} L / mnt` : '25 L / mnt (Std)'}</td>
          <td style="border:1px solid #333;padding:3px 6px;text-align:center;font-weight:bold;color:${laporan.coreActual ? 'green' : '#333'}">${laporan.coreActual ? `${laporan.coreActual} L / mnt` : '-'}</td>
        </tr>
        <tr style="font-size:7.5px">
          <td style="border:1px solid #333;padding:3px 6px;font-weight:bold">COOLING CAVITY</td>
          <td style="border:1px solid #333;padding:3px 6px;text-align:center">${laporan.moldData?.cavStd ? `${laporan.moldData.cavStd} L / mnt` : '24,2 L / mnt (Std)'}</td>
          <td style="border:1px solid #333;padding:3px 6px;text-align:center;font-weight:bold;color:${laporan.cavActual ? 'green' : '#333'}">${laporan.cavActual ? `${laporan.cavActual} L / mnt` : '-'}</td>
        </tr>
      </tbody>
    </table>
  </div>
  ${buildHeaterSection()}
  <div style="flex:1"></div>
  ${signRowHtml}
  <div style="display:flex;justify-content:space-between;font-size:6.5px;border-top:1px solid #bbb;margin-top:2px;padding-top:2px">
    <span>PIC Pembuat : ${laporan.pic.nama}</span>
    <span>Audrey 28/02/18 &nbsp; QF/MOLD-009/01</span>
  </div>
</div>
` : ''}

</body>
</html>`

    const win = window.open('', '_blank', 'width=1200,height=800')
    if (!win) {
      alert('Popup diblokir browser. Tolong izinkan popup untuk halaman ini.')
      return
    }
    win.document.write(htmlContent)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print() }, 800)
  }

  if (loading) {
    return <div className="kosong">Memuat data checksheet...</div>
  }

  if (!laporan) {
    return <div className="kosong">Laporan tidak ditemukan.</div>
  }

  const isOverhaul = laporan.jenis === 'OH MOLD' || laporan.jenis === 'OH_MOLD'
  const totalSparepart = getTotalSparepartCost()
  const totalMpCost = isOverhaul ? getOverhaulTotalMpCost() : Math.round(getDurasiJam() * 89595 * jumlahOrang)
  const totalCostCombined = totalMpCost + totalSparepart

  const hasCoolingOrHeater = Boolean(
    (laporan.coreActual && laporan.coreActual !== '') ||
    (laporan.cavActual && laporan.cavActual !== '') ||
    (laporan.heaterActual && (Array.isArray(laporan.heaterActual) ? (laporan.heaterActual as any[]).some(x => x && x !== '') : Boolean(laporan.heaterActual))) ||
    (laporan.moldData?.heaterStd && Array.isArray(laporan.moldData.heaterStd) && laporan.moldData.heaterStd.length > 0)
  )
  const stdHeaters = Array.isArray(laporan.moldData?.heaterStd) ? laporan.moldData.heaterStd : []
  const actHeaters = Array.isArray(laporan.heaterActual) ? laporan.heaterActual : (laporan.heaterActual ? [laporan.heaterActual] : [])
  const isAllHeatersOk = actHeaters.length === 1 && (actHeaters[0] === 'OK' || actHeaters[0] === 'ok' || actHeaters[0] === 'Ok')
  const heaterCount = Math.max(stdHeaters.length, isAllHeatersOk ? stdHeaters.length : actHeaters.length)

  // Urutan approvals logic
  const approvals = laporan.checksheet?.approvals || []
  const picSign = approvals.find((a) => a.role === 'PIC')
  const tlSign = approvals.find((a) => a.role === 'TL')
  const glSign = approvals.find((a) => a.role === 'GL')
  const admSign = approvals.find((a) => a.role === 'ADM')

  // Lock logic
  const isLocked = picSign?.signedAt != null && revisiStatus !== 'DISETUJUI'

  const userRole = session?.user?.role

  const getTtdBox = (role: string, label: string, mySign?: ApprovalEntry, prevSign?: ApprovalEntry) => {
    const sudahGiliran = !prevSign || prevSign.signedAt !== null
    const bisaTtd = userRole === role && sudahGiliran && !mySign?.signedAt
    let statusText = ''
    if (!mySign?.signedAt) {
      if (!sudahGiliran) {
        statusText = `Menunggu TTD ${PERAN_LABEL[prevSign?.role || '']}`
      } else if (userRole !== role) {
        statusText = `Hanya untuk ${label}`
      }
    }

    return (
      <div className={`cs-ttd-box ${mySign?.signedAt ? 'sudah' : ''}`}>
        <div className="cs-ttd-label">{label}</div>
        {mySign?.signedAt && mySign.user?.signature && (
          <div style={{ margin: '6px 0', textAlign: 'center' }}>
            <img src={mySign.user.signature} alt="TTD" style={{ maxHeight: '50px', objectFit: 'contain', margin: '0 auto', display: 'block' }} />
          </div>
        )}
        <div className="cs-ttd-nama">{mySign?.signedAt ? mySign.user?.nama || 'Verified' : '\u00A0'}</div>
        <div className="cs-ttd-tgl">{mySign?.signedAt ? new Date(mySign.signedAt).toLocaleDateString('id-ID') : ''}</div>
        <button
          type="button"
          onClick={() => handleSign(role)}
          disabled={!bisaTtd}
          style={{ width: '100%', marginTop: '10px' }}
        >
          {mySign?.signedAt ? '✓ Ditandatangani' : 'Tanda Tangan'}
        </button>
        {statusText && <div className="cs-lock-note">{statusText}</div>}
      </div>
    )
  }

  // Cost Box helper
  const renderCostBoxEditor = (costKey: string) => {
    const box = checklist[costKey] || {}
    const subMpCost = getMpCostFromBox(costKey)

    return (
      <div className="cb-wrap" style={{ marginTop: '10px', padding: '12px', border: '1px solid var(--garis)', borderRadius: '8px', background: '#fafaf9' }}>
        <div style={{ fontWeight: 'bold', fontSize: '12px', color: 'var(--hijau-tua)', marginBottom: '8px' }}>M/P Cost Input ({costKey})</div>
        <div className="baris3">
          <div>
            <label className="kecil">Jam Mulai</label>
            <input
              type="time"
              value={box.jamMulai || ''}
              onChange={(e) => handleCostBoxChange(costKey, 'jamMulai', e.target.value)}
            />
          </div>
          <div>
            <label className="kecil">Jam Selesai</label>
            <input
              type="time"
              value={box.jamSelesai || ''}
              onChange={(e) => handleCostBoxChange(costKey, 'jamSelesai', e.target.value)}
            />
          </div>
          <div>
            <label className="kecil">Jml Orang</label>
            <input
              type="number"
              min="0"
              placeholder="0"
              value={box.orang || ''}
              onChange={(e) => handleCostBoxChange(costKey, 'orang', parseInt(e.target.value, 10) || 0)}
            />
          </div>
        </div>
        <div className="baris2" style={{ marginTop: '8px' }}>
          <div>
            <label className="kecil">Nama PIC</label>
            <input
              type="text"
              placeholder="PIC bertugas"
              value={box.pic || ''}
              onChange={(e) => handleCostBoxChange(costKey, 'pic', e.target.value)}
            />
          </div>
          <div>
            <label className="kecil">Tanggal</label>
            <input
              type="date"
              value={box.tgl || ''}
              onChange={(e) => handleCostBoxChange(costKey, 'tgl', e.target.value)}
            />
          </div>
        </div>
        <div style={{ marginTop: '8px', fontWeight: 800, color: 'var(--hijau-tua)' }}>
          Subtotal Cost: Rp {subMpCost.toLocaleString('id-ID')}
        </div>
      </div>
    )
  }

  // Checklist table component
  const renderChecklistTable = (secItems: any[], secKode: string, secJudul: string) => {
    const masterVal = checklist[`master_${secKode}`]
    return (
      <div style={{
        marginTop: '10px',
        width: '100%',
        overflowX: 'auto',
        overflowY: 'visible',
        WebkitOverflowScrolling: 'touch' as any,
        position: 'relative',
        paddingBottom: '10px',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
      }}>
        <table style={{
          width: 'max-content',
          minWidth: '640px',
          borderCollapse: 'collapse',
          fontSize: '12.5px',
          background: '#fff',
          tableLayout: 'auto',
        }}>
          <thead>
            <tr>
              <th style={{ width: '36px', padding: '8px 10px', border: '1px solid #999', background: '#f3f0e4', fontSize: '11.5px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>No</th>
              <th style={{ minWidth: '160px', maxWidth: '220px', padding: '8px 10px', border: '1px solid #999', background: '#f3f0e4', fontSize: '11.5px', fontWeight: 'bold' }}>Item</th>
              <th style={{ width: '100px', padding: '8px 10px', border: '1px solid #999', background: '#f3f0e4', fontSize: '11.5px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>Metode</th>
              <th style={{ width: '120px', padding: '8px 10px', border: '1px solid #999', background: '#f3f0e4', fontSize: '11.5px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>Standard</th>
              <th style={{ width: '80px', padding: '8px 10px', border: '1px solid #999', background: '#f3f0e4', fontSize: '11.5px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>Judge</th>
              <th style={{ width: '140px', padding: '8px 10px', border: '1px solid #999', background: '#f3f0e4', fontSize: '11.5px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>Comment</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ background: '#e0e0e0', fontWeight: 'bold' }}>
              <td colSpan={4} style={{ padding: '8px 10px', border: '1px solid #999' }}>{secJudul}</td>
              <td style={{ textAlign: 'center', padding: '8px 10px', border: '1px solid #999' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                    <input type="radio" checked={masterVal === 'OK'} onChange={() => handleMasterChecklistChange(secKode, secItems.length, 'OK')} /> OK ALL
                  </label>
                  <label style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                    <input type="radio" checked={masterVal === 'NG'} onChange={() => handleMasterChecklistChange(secKode, secItems.length, 'NG')} /> NG / Cek Manual
                  </label>
                </div>
              </td>
              <td style={{ padding: '8px 10px', border: '1px solid #999' }}></td>
            </tr>
            {masterVal !== 'OK' && secItems.map((item, idx) => {
              const key = `${secKode}|${idx}`
              const val = checklist[key]?.judge || ''
              const komentar = checklist[key]?.komentar || ''

              return (
                <tr key={idx}>
                  <td style={{ textAlign: 'center', padding: '8px 10px', border: '1px solid #999', whiteSpace: 'nowrap' }}>{idx + 1}</td>
                  <td style={{ padding: '8px 10px', border: '1px solid #999', minWidth: '160px', maxWidth: '220px', wordBreak: 'break-word' }}>{item.label}</td>
                  <td style={{ color: 'var(--teks-redup)', padding: '8px 10px', border: '1px solid #999', whiteSpace: 'nowrap' }}>{item.metode || '-'}</td>
                  <td style={{ color: 'var(--teks-redup)', padding: '8px 10px', border: '1px solid #999', whiteSpace: 'nowrap' }}>{item.standar || '-'}</td>
                  <td style={{ padding: '8px 10px', border: '1px solid #999' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name={`judge_${secKode}_${idx}`}
                          value="OK"
                          checked={val === 'OK'}
                          onChange={() => handleChecklistChange(key, 'judge', 'OK')}
                        /> OK
                      </label>
                      <label style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name={`judge_${secKode}_${idx}`}
                          value="NG"
                          checked={val === 'NG'}
                          onChange={() => handleChecklistChange(key, 'judge', 'NG')}
                        /> NG
                      </label>
                    </div>
                  </td>
                  <td style={{ padding: '8px 10px', border: '1px solid #999' }}>
                    <input
                      type="text"
                      placeholder="Catatan..."
                      value={komentar}
                      onChange={(e) => handleChecklistChange(key, 'komentar', e.target.value)}
                      style={{ width: '130px', fontSize: '12px', padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <>
      {/* ===== TAB SCREEN / EDITOR ===== */}
      <section className="no-print">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
          <button className="tombol-sekunder" style={{ margin: 0, width: 'auto', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }} onClick={() => router.push('/riwayat')}>
            <ArrowLeft size={18} /> Kembali
          </button>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            {revisiStatus === 'MENUNGGU' && (
              <span style={{ fontSize: '12px', background: '#fefcbf', color: '#b7791f', padding: '6px 12px', borderRadius: '4px', fontWeight: 'bold' }}>
                ⏳ Menunggu Approval Revisi
              </span>
            )}
            
            {isLocked && session?.user?.role === 'PIC' && revisiStatus !== 'MENUNGGU' && (
              <button 
                title="Ajukan Revisi"
                onClick={handleAjukanRevisi}
                style={{
                  margin: 0, width: 'auto', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px',
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: '#fff', border: 'none', 
                  borderRadius: '30px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                  fontWeight: 600, fontSize: '14px', transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <RefreshCcw size={18} /> Ajukan Revisi
              </button>
            )}

            <button 
              title="Cetak / Simpan PDF"
              onClick={handlePrint}
              style={{
                margin: 0, width: 'auto', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px',
                background: 'linear-gradient(135deg, var(--oranye) 0%, #d97706 100%)', color: '#fff', border: 'none', 
                borderRadius: '30px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(234, 88, 12, 0.3)',
                fontWeight: 600, fontSize: '14px', transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <Printer size={18} /> Cetak / PDF
            </button>
            
            {!isLocked && (
              <button 
                title="Simpan Perubahan"
                onClick={() => handleSave(true)}
                style={{
                  margin: 0, width: 'auto', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px',
                  background: 'linear-gradient(135deg, var(--hijau) 0%, var(--hijau-tua) 100%)', color: '#fff', border: 'none', 
                  borderRadius: '30px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)',
                  fontWeight: 600, fontSize: '14px', transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <Save size={18} /> Simpan
              </button>
            )}
          </div>
        </div>

        {isLocked && (
          <div style={{ padding: '12px', background: '#fed7d7', color: '#c53030', borderRadius: '6px', marginBottom: '16px', fontSize: '13px', fontWeight: 600 }}>
            🔒 Checksheet ini telah dikunci karena sudah disubmit (PIC telah tanda tangan). Ajukan revisi jika ada perubahan.
          </div>
        )}

        <fieldset disabled={isLocked} style={{ border: 'none', padding: 0, margin: 0, overflow: 'visible', minWidth: 0 }}>


        {/* HEADER INFORMATION CARD */}
        <div className="kartu">
          <p className="label-besar">Detail Laporan</p>
          <div className="info-mold-grid">
            <div className="info-mold-item"><span>Nomor Mold</span><b>{laporan.noMold}</b></div>
            <div className="info-mold-item"><span>Jenis Pekerjaan</span><b>{laporan.jenis}</b></div>
            <div className="info-mold-item"><span>Factory</span><b>{laporan.factory}</b></div>
            <div className="info-mold-item"><span>Shift</span><b>{laporan.shift || '-'}</b></div>
            <div className="info-mold-item" style={{ gridColumn: 'span 2' }}><span>Nama Part</span><b>{laporan.part || '-'}</b></div>
            <div className="info-mold-item"><span>Tanggal Kerja</span><b>{new Date(laporan.tanggal).toLocaleDateString('id-ID')}</b></div>
            <div className="info-mold-item"><span>PIC Pembuat</span><b>{laporan.pic.nama}</b></div>
          </div>
        </div>

        {isOverhaul ? (
          /* ====================================
             OVERHAUL CHECKSHEET TEMPLATE EDITOR
             ==================================== */
          <>
            {(laporan.info || laporan.countermeasure) && (
              <div className="kartu" style={{ borderLeft: '5px solid #0284c7', background: '#f0f9ff', padding: '16px 20px', marginBottom: '20px' }}>
                <p style={{ fontWeight: 800, fontSize: '15px', color: '#0369a1', marginBottom: '12px', marginTop: 0 }}>📌 Informasi Problem & Countermeasure (Dari Laporan Awal):</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                  <div style={{ background: '#fff', padding: '12px 14px', borderRadius: '10px', border: '1px solid #bae6fd' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Informasi / Problem:</span>
                    <div style={{ fontSize: '14.5px', fontWeight: 700, color: '#0f172a', whiteSpace: 'pre-wrap' }}>{laporan.info || '-'}</div>
                  </div>
                  <div style={{ background: '#fff', padding: '12px 14px', borderRadius: '10px', border: '1px solid #bae6fd' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Countermeasure / Tindakan:</span>
                    <div style={{ fontSize: '14.5px', fontWeight: 700, color: '#0f172a', whiteSpace: 'pre-wrap' }}>{laporan.countermeasure || '-'}</div>
                  </div>
                </div>
              </div>
            )}
            {OH_SECTIONS_A.map((sec) => (
              <div className="kartu" key={sec.kode}>
                {renderChecklistTable(sec.items, sec.kode, sec.judul)}
              </div>
            ))}

            {/* M/P Cost Section A */}
            <div className="kartu">
              <p className="label-besar" style={{ fontSize: '14px', color: 'var(--hijau-tua)' }}>M/P Cost Section A (Main Check, item 1-11)</p>
              {renderCostBoxEditor('b1')}
            </div>

            {OH_SECTIONS_EG.map((sec) => (
              <div className="kartu" key={sec.kode}>
                {renderChecklistTable(sec.items, sec.kode, `B. EJECTOR GROUP — ${sec.judul}`)}
              </div>
            ))}

            {/* M/P Cost Section B */}
            <div className="kartu">
              <p className="label-besar" style={{ fontSize: '14px', color: 'var(--hijau-tua)' }}>M/P Cost Section B (Ejector Group)</p>
              {renderCostBoxEditor('b2')}
            </div>

            {OH_SECTIONS_CDE.map((sec) => {
              const PilihanCde = sec.jenisPilihan
              const dipilih = checklist['jenis_' + sec.kode]?.judge || ''

              return (
                <div className="kartu" key={sec.kode}>
                  <div style={{ display: 'flex', gap: '20px' }}>
                    <div style={{ flex: 1 }}>
                      {PilihanCde && (
                        <div style={{ display: 'flex', gap: '14px', marginBottom: '8px', flexWrap: 'wrap' }}>
                          {PilihanCde.map((j) => (
                            <label key={j} style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <input
                                type="radio"
                                name={`jenis_${sec.kode}`}
                                checked={dipilih === j}
                                onChange={() => handleChecklistChange('jenis_' + sec.kode, 'judge', j)}
                              /> {j}
                            </label>
                          ))}
                        </div>
                      )}

                      <div style={{ fontSize: '12px', margin: '4px 0', color: 'var(--teks-redup)' }}><b>STD:</b> {sec.std}</div>
                      <div style={{ fontSize: '12px', margin: '4px 0', color: 'var(--teks-redup)' }}><b>Metode Check:</b> {sec.metodeCheck}</div>
                    </div>

                    {sec.img && (
                      <div style={{ flexShrink: 0, width: '300px', textAlign: 'right' }}>
                        <img src={sec.img} alt={sec.judul} style={{ maxWidth: '100%', height: '120px', objectFit: 'contain', borderRadius: '4px', border: '1px solid #eee' }} />
                      </div>
                    )}
                  </div>

                  {renderChecklistTable(sec.items.map((label) => ({ label, metode: '-', standar: '-' })), sec.kode, sec.judul)}
                  {renderCostBoxEditor(sec.costLabel)}
                </div>
              )
            })}
          </>
        ) : (
          /* ====================================
             CM CARD (QF/MOLD-013) TEMPLATE EDITOR - PM, BM, IM MOLD PROBLEM
             ==================================== */
          <div className="kartu" style={{ borderTop: '4px solid var(--biru)', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid var(--garis)', paddingBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 900, color: 'var(--biru)' }}>
                  📋 CM CARD [Corrective Maintenance] &mdash; {laporan.jenis}
                </h2>
                <span style={{ fontSize: '13px', color: 'var(--teks-redup)', fontWeight: 600 }}>
                  Form spesifikasi Mold Problem untuk Breakdown (BM), Preventive (PM), & Information (IM)
                </span>
              </div>
              <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '6px 14px', borderRadius: '20px', fontWeight: 800, fontSize: '13px', border: '1px solid #7dd3fc' }}>
                Form QF/MOLD-013
              </span>
            </div>

            {/* JENIS KARTU & INFO LOKASI */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', background: '#f8fafc', padding: '18px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
              <div>
                <label style={{ fontWeight: 800, fontSize: '14px', color: '#0f172a', display: 'block', marginBottom: '8px' }}>
                  Card Type (Jenis Kartu):
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {['BM', 'PM', 'IM'].map(ct => {
                    const active = (checklist.cm_card_type || (laporan.jenis?.toUpperCase().includes('PM') ? 'PM' : laporan.jenis?.toUpperCase().includes('IM') ? 'IM' : 'BM')) === ct
                    return (
                      <button
                        key={ct}
                        type="button"
                        onClick={() => setChecklist({ ...checklist, cm_card_type: ct })}
                        style={{
                          flex: 1, padding: '10px', borderRadius: '10px', fontWeight: 800, fontSize: '14px', cursor: 'pointer',
                          background: active ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : '#fff',
                          color: active ? '#fff' : '#64748b',
                          border: active ? 'none' : '1px solid #cbd5e1',
                          boxShadow: active ? '0 4px 10px rgba(2, 132, 199, 0.25)' : 'none',
                          transition: 'all 0.15s'
                        }}
                      >
                        {ct} CARD
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label style={{ fontWeight: 800, fontSize: '14px', color: '#0f172a', display: 'block', marginBottom: '8px' }}>
                  Detail Lokasi & Data Mold:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                  <div>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Lokasi / Factory:</span>
                    <input
                      type="text"
                      placeholder="Lokasi mold..."
                      value={checklist.cm_lokasi !== undefined ? checklist.cm_lokasi : (laporan.moldData?.lokasiMold || laporan.moldData?.factory || laporan.factory || '')}
                      onChange={(e) => setChecklist({ ...checklist, cm_lokasi: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', marginTop: '4px' }}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Mold Name:</span>
                    <input
                      type="text"
                      placeholder="Nama / No Mold..."
                      value={checklist.cm_mold_name !== undefined ? checklist.cm_mold_name : (laporan.moldData?.noMold || laporan.noMold || '')}
                      onChange={(e) => setChecklist({ ...checklist, cm_mold_name: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', marginTop: '4px' }}
                    />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Model Mold:</span>
                    <input
                      type="text"
                      placeholder="Model / Part..."
                      value={checklist.cm_model !== undefined ? checklist.cm_model : (laporan.moldData?.model || laporan.moldData?.part || laporan.part || '')}
                      onChange={(e) => setChecklist({ ...checklist, cm_model: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', marginTop: '4px' }}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Customer:</span>
                    <input
                      type="text"
                      placeholder="Customer..."
                      value={checklist.cm_customer !== undefined ? checklist.cm_customer : (laporan.moldData?.customer || '')}
                      onChange={(e) => setChecklist({ ...checklist, cm_customer: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', marginTop: '4px' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* KEJADIAN & KATEGORI PROBLEM */}
            <div style={{ marginBottom: '22px' }}>
              <label style={{ fontWeight: 800, fontSize: '14.5px', color: '#0f172a', display: 'block', marginBottom: '8px' }}>
                Kejadian / Deskripsi Problem yang Ditemukan:
              </label>
              <textarea
                rows={3}
                placeholder="Tuliskan gejala kerusakan atau perawatan yang dilakukan secara detail..."
                value={checklist.cm_problem !== undefined ? checklist.cm_problem : (laporan.info || '')}
                onChange={(e) => setChecklist({ ...checklist, cm_problem: e.target.value })}
                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '2px solid #cbd5e1', fontSize: '14.5px', background: '#fff', marginBottom: '14px', outline: 'none' }}
              />

              <label style={{ fontWeight: 800, fontSize: '13.5px', color: '#334155', display: 'block', marginBottom: '8px' }}>
                Pilih Kategori Komponen yang Bermasalah / Dirawat:
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {['Ejector', 'Core', 'Cav', 'Cooling', 'H-Runner', 'Slider', 'Auto Connect', 'Interlock', 'Chuck', 'V-Gate', 'Hyd', 'Electric', 'Q-Part', 'Others'].map(cat => {
                  const selected = checklist.cm_category === cat || (cat === 'V-Gate' && checklist.cm_category === 'V-Galp')
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setChecklist({ ...checklist, cm_category: cat })}
                      style={{
                        padding: '7px 14px', borderRadius: '20px', fontWeight: 700, fontSize: '13px', cursor: 'pointer',
                        background: selected ? '#0f172a' : '#f1f5f9',
                        color: selected ? '#ffffff' : '#475569',
                        border: selected ? '2px solid #0f172a' : '1px solid #cbd5e1',
                        transition: 'all 0.15s'
                      }}
                    >
                      {selected && '✓ '} {cat}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* RANK PROBLEM & TARGET PRODUKSI */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', background: '#fff7ed', padding: '18px', borderRadius: '16px', border: '1px solid #fed7aa', marginBottom: '22px' }}>
              <div>
                <label style={{ fontWeight: 800, fontSize: '14px', color: '#9a3412', display: 'block', marginBottom: '10px' }}>
                  Rank Problem & Tingkat Keparahan:
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { r: 'A', desc: 'Rank A : Line stop customer' },
                    { r: 'B', desc: 'Rank B : Feedback to engineering/maker' },
                    { r: 'C', desc: 'Rank C : Problem ringan' }
                  ].map(item => {
                    const active = (checklist.cm_rank || 'C') === item.r
                    return (
                      <label key={item.r} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '10px', background: active ? '#ffedd5' : '#ffffff', borderRadius: '10px', border: active ? '2px solid #f97316' : '1px solid #fed7aa', fontWeight: active ? 800 : 600, fontSize: '13.5px', color: '#7c2d12' }}>
                        <input
                          type="radio"
                          name="cm_rank"
                          checked={active}
                          onChange={() => setChecklist({ ...checklist, cm_rank: item.r })}
                          style={{ accentColor: '#f97316', width: '18px', height: '18px' }}
                        />
                        {item.desc}
                      </label>
                    )
                  })}
                </div>
              </div>

              <div>
                <label style={{ fontWeight: 800, fontSize: '14px', color: '#9a3412', display: 'block', marginBottom: '10px' }}>
                  Target Produksi & Alokasi Mistake (%):
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                  <div>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#7c2d12' }}>Target Tgl:</span>
                    <input
                      type="date"
                      value={checklist.cm_target_tgl || ''}
                      onChange={(e) => setChecklist({ ...checklist, cm_target_tgl: e.target.value })}
                      style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #fed7aa', fontSize: '13px', marginTop: '4px' }}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#7c2d12' }}>Target Jam:</span>
                    <input
                      type="time"
                      value={checklist.cm_target_jam || ''}
                      onChange={(e) => setChecklist({ ...checklist, cm_target_jam: e.target.value })}
                      style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #fed7aa', fontSize: '13px', marginTop: '4px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  <div>
                    <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#7c2d12' }}>Prod (%):</span>
                    <input type="number" placeholder="0" value={checklist.cm_mistake_prod !== undefined ? checklist.cm_mistake_prod : ''} onChange={(e) => setChecklist({ ...checklist, cm_mistake_prod: e.target.value })} style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #fed7aa' }} />
                  </div>
                  <div>
                    <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#7c2d12' }}>Mold (%):</span>
                    <input type="number" placeholder="100" value={checklist.cm_mistake_mold !== undefined ? checklist.cm_mistake_mold : '100'} onChange={(e) => setChecklist({ ...checklist, cm_mistake_mold: e.target.value })} style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #fed7aa' }} />
                  </div>
                  <div>
                    <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#7c2d12' }}>Others (%):</span>
                    <input type="number" placeholder="0" value={checklist.cm_mistake_others !== undefined ? checklist.cm_mistake_others : ''} onChange={(e) => setChecklist({ ...checklist, cm_mistake_others: e.target.value })} style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #fed7aa' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* ANALISA PENYEBAB (5 WHY ROOT CAUSE) & PERBAIKAN KAIZEN */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px', marginBottom: '22px' }}>
              <div style={{ background: '#f8fafc', padding: '18px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <label style={{ fontWeight: 800, fontSize: '15px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <span>Analisa Penyebab Terjadinya Masalah (5-Why):</span>
                </label>
                <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#6366f1', marginBottom: '14px' }}>Isi per kolom (Why 1 s/d Root Cause) agar tampil sekolom saat dicetak:</div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '5px' }}>Why 1 (Mengapa masalah terjadi?):</span>
                    <input
                      type="text"
                      placeholder="Contoh: Mold lecet saat pembukaan..."
                      value={checklist.cm_why1 !== undefined ? checklist.cm_why1 : (checklist.cm_why || '')}
                      onChange={(e) => setChecklist({ ...checklist, cm_why1: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13.5px', background: '#fff', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '5px' }}>Why 2 (Mengapa kejadian pada Why 1 terjadi?):</span>
                    <input
                      type="text"
                      placeholder="Contoh: Pin ejector tersendat / macet..."
                      value={checklist.cm_why2 || ''}
                      onChange={(e) => setChecklist({ ...checklist, cm_why2: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13.5px', background: '#fff', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '5px' }}>Why 3 (Mengapa kejadian pada Why 2 terjadi?):</span>
                    <input
                      type="text"
                      placeholder="Contoh: Pelumasan (grease) mengering dan terhambat kotoran..."
                      value={checklist.cm_why3 || ''}
                      onChange={(e) => setChecklist({ ...checklist, cm_why3: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13.5px', background: '#fff', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '5px' }}>Why 4 (Mengapa kejadian pada Why 3 terjadi?):</span>
                    <input
                      type="text"
                      placeholder="Contoh: Jadwal pembersihan & greasing rutin terlewat..."
                      value={checklist.cm_why4 || ''}
                      onChange={(e) => setChecklist({ ...checklist, cm_why4: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13.5px', background: '#fff', outline: 'none' }}
                    />
                  </div>
                  <div style={{ background: '#fef2f2', padding: '12px', borderRadius: '12px', border: '1px solid #fca5a5', marginTop: '4px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 900, color: '#b91c1c', display: 'block', marginBottom: '6px' }}>🎯 Why 5 / Root Cause (Penyebab Akar Masalah):</span>
                    <input
                      type="text"
                      placeholder="Contoh: SOP interval greasing tidak memiliki alarm otomatis di sistem"
                      value={checklist.cm_why5 !== undefined ? checklist.cm_why5 : (laporan.countermeasure || '')}
                      onChange={(e) => setChecklist({ ...checklist, cm_why5: e.target.value })}
                      style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '2px solid #f87171', fontSize: '14px', background: '#fff', fontWeight: 700, color: '#0f172a', outline: 'none' }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label style={{ fontWeight: 800, fontSize: '15px', color: '#0f172a', display: 'block', marginBottom: '8px' }}>
                  Item Perbaikan / Kaizen yang Dilakukan:
                </label>
                <textarea
                  rows={6}
                  placeholder="Tuliskan tindakan perbaikan fisik, penggantian komponen, atau modifikasi yang sudah diselesaikan..."
                  value={checklist.cm_perbaikan_item !== undefined ? checklist.cm_perbaikan_item : (laporan.countermeasure || '')}
                  onChange={(e) => setChecklist({ ...checklist, cm_perbaikan_item: e.target.value })}
                  style={{ width: '100%', padding: '14px 16px', borderRadius: '14px', border: '2px solid #cbd5e1', fontSize: '14.5px', background: '#fff', marginBottom: '14px', outline: 'none', lineHeight: 1.6 }}
                />
                
                {(checklist.cm_rank === 'B') && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '14px', borderRadius: '14px' }}>
                    <label style={{ fontWeight: 800, fontSize: '13.5px', color: '#b91c1c', display: 'block', marginBottom: '6px' }}>
                      Feedback to engineering/maker (Wajib Rank B):
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Tulis pesan feedback resmi ke pembuat mold atau customer..."
                      value={checklist.cm_feedback || ''}
                      onChange={(e) => setChecklist({ ...checklist, cm_feedback: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #fca5a5', fontSize: '14px', outline: 'none' }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* WAKTU KERJA & JUDGEMENT & OUT HOUSE COST */}
            <div style={{ background: '#f1f5f9', padding: '20px', borderRadius: '16px', border: '1px solid #cbd5e1' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '18px', borderBottom: '1px dashed #cbd5e1', paddingBottom: '18px' }}>
                <div>
                  <label style={{ fontWeight: 800, fontSize: '14px', color: '#0f172a', display: 'block', marginBottom: '10px' }}>
                    Waktu Kerja & Manpower:
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                    <div>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Perbaikan M/C (Jam):</span>
                      <input type="number" min="0" placeholder="0" value={checklist.cm_waktu_mc_h !== undefined ? checklist.cm_waktu_mc_h : '0'} onChange={(e) => setChecklist({ ...checklist, cm_waktu_mc_h: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                    </div>
                    <div>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Perbaikan M/C (Menit):</span>
                      <input type="number" min="0" max="59" placeholder="0" value={checklist.cm_waktu_mc_m !== undefined ? checklist.cm_waktu_mc_m : '0'} onChange={(e) => setChecklist({ ...checklist, cm_waktu_mc_m: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                    <div>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Jam Mulai Maint:</span>
                      <input type="time" value={jamMulai} onChange={(e) => setJamMulai(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                    </div>
                    <div>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Jam Selesai Maint:</span>
                      <input type="time" value={jamSelesai} onChange={(e) => setJamSelesai(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                    </div>
                    <div>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Jml Orang:</span>
                      <input type="number" min="1" value={jumlahOrang} onChange={(e) => setJumlahOrang(parseInt(e.target.value, 10) || 1)} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                    </div>
                  </div>
                </div>

                <div>
                  <label style={{ fontWeight: 800, fontSize: '14px', color: '#0f172a', display: 'block', marginBottom: '10px' }}>
                    Judgement (Hasil Verifikasi Akhir):
                  </label>
                  <div style={{ display: 'flex', gap: '16px', marginBottom: '14px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
                      <input type="radio" name="cm_judge_type" checked={(checklist.cm_judge_type || 'Permanent') === 'Permanent'} onChange={() => setChecklist({ ...checklist, cm_judge_type: 'Permanent' })} style={{ width: '18px', height: '18px', accentColor: '#10b981' }} />
                      Permanent (Permanen)
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
                      <input type="radio" name="cm_judge_type" checked={checklist.cm_judge_type === 'Temporary'} onChange={() => setChecklist({ ...checklist, cm_judge_type: 'Temporary' })} style={{ width: '18px', height: '18px', accentColor: '#f59e0b' }} />
                      Temporary (Sementara)
                    </label>
                  </div>
                  <div style={{ display: 'flex', gap: '20px' }}>
                    <button
                      type="button"
                      onClick={() => setChecklist({ ...checklist, cm_judge_result: 'OK', cm_judge: 'OK' })}
                      style={{ flex: 1, padding: '12px', borderRadius: '12px', fontWeight: 800, fontSize: '15px', background: (checklist.cm_judge_result || checklist.cm_judge || 'OK') === 'OK' ? '#10b981' : '#fff', color: (checklist.cm_judge_result || checklist.cm_judge || 'OK') === 'OK' ? '#fff' : '#64748b', border: '1px solid #cbd5e1', cursor: 'pointer', transition: 'all 0.15s' }}
                    >
                      🟢 JUDGE: OK
                    </button>
                    <button
                      type="button"
                      onClick={() => setChecklist({ ...checklist, cm_judge_result: 'NG', cm_judge: 'NG' })}
                      style={{ flex: 1, padding: '12px', borderRadius: '12px', fontWeight: 800, fontSize: '15px', background: (checklist.cm_judge_result || checklist.cm_judge) === 'NG' ? '#ef4444' : '#fff', color: (checklist.cm_judge_result || checklist.cm_judge) === 'NG' ? '#fff' : '#64748b', border: '1px solid #cbd5e1', cursor: 'pointer', transition: 'all 0.15s' }}
                    >
                      🔴 JUDGE: NG
                    </button>
                  </div>
                </div>
              </div>

              {/* OUTHOUSE COST & ORDER NO */}
              <div>
                <label style={{ fontWeight: 800, fontSize: '13.5px', color: '#0f172a', display: 'block', marginBottom: '8px' }}>
                  Out House Service & Sparepart Order Info (Bila Menggunakan Bengkel Luar / Supplier):
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  <div>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Proses Out House:</span>
                    <input type="text" placeholder="Contoh: Hard Chrome / Welding" value={checklist.cm_outhouse_proses || ''} onChange={(e) => setChecklist({ ...checklist, cm_outhouse_proses: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px' }} />
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Supplier / Bengkel Luar:</span>
                    <input type="text" placeholder="Nama Supplier" value={checklist.cm_outhouse_supplier || ''} onChange={(e) => setChecklist({ ...checklist, cm_outhouse_supplier: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px' }} />
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Biaya Out House (Rp):</span>
                    <input type="number" min="0" placeholder="0" value={checklist.cm_outhouse_cost !== undefined ? checklist.cm_outhouse_cost : ''} onChange={(e) => setChecklist({ ...checklist, cm_outhouse_cost: e.target.value ? Number(e.target.value) : 0 })} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px', fontWeight: 'bold' }} />
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>No. Order Sparepart (PO/PR):</span>
                    <input type="text" placeholder="Nomor PO / PR" value={checklist.cm_order_no || ''} onChange={(e) => setChecklist({ ...checklist, cm_order_no: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px', fontWeight: 'bold', color: '#0369a1' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SPAREPARTS SECTION WITH INTERACTIVE CATALOG AUTOCOMPLETE */}
        <div className="kartu">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--hijau-tua)', paddingBottom: '8px', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <p className="label-besar" style={{ margin: 0, borderBottom: 'none', padding: 0 }}>F. PEMAKAIAN / ORDER SPARE PART</p>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#065f46', background: '#dcfce7', padding: '4px 12px', borderRadius: '16px', border: '1px solid #86efac', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              💡 Ketik huruf awal & auto pilih dari katalog
            </span>
          </div>

          <div style={{ overflow: 'visible' }}>
            <table className="cs-check-tbl" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left' }}>Nama / Drawing Sparepart</th>
                  <th style={{ width: '100px', textAlign: 'center' }}>Qty</th>
                  <th style={{ width: '170px', textAlign: 'right' }}>Harga Satuan (Rp)</th>
                  <th style={{ width: '170px', textAlign: 'right', paddingRight: '12px' }}>Total Cost (Rp)</th>
                  <th style={{ width: '90px', textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {spareparts.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '18px', color: '#64748b', fontStyle: 'italic', fontSize: '13.5px' }}>
                      Belum ada pemakaian sparepart yang dimasukkan. Klik tombol &quot;➕ Tambah Sparepart&quot; di bawah.
                    </td>
                  </tr>
                ) : (
                  spareparts.map((item, idx) => {
                    const query = item.namaSparepart.trim().toLowerCase()
                    const filtered = katalogList.filter((k) => k.nama.toLowerCase().includes(query))
                    const exactMatch = katalogList.some((k) => k.nama.toLowerCase() === query)

                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ position: 'relative', padding: '8px 10px' }}>
                          <input
                            type="text"
                            placeholder="Ketik huruf depan (auto-muncul dari katalog)..."
                            value={item.namaSparepart}
                            onFocus={() => setActiveSpDropdown(idx)}
                            onChange={(e) => {
                              handleUpdateSparepart(idx, 'namaSparepart', e.target.value)
                              setActiveSpDropdown(idx)
                            }}
                            style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontWeight: 600, fontSize: '13.5px', outline: 'none' }}
                          />

                          {/* SLEEK FLOATING AUTOCOMPLETE DROPDOWN */}
                          {activeSpDropdown === idx && (
                            <div style={{
                              position: 'absolute',
                              top: '100%',
                              left: 10,
                              right: 10,
                              zIndex: 9999,
                              background: '#ffffff',
                              border: '2px solid #10b981',
                              borderRadius: '8px',
                              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.15)',
                              maxHeight: '260px',
                              overflowY: 'auto',
                              marginTop: '4px',
                              minWidth: '300px'
                            }}>
                              <div style={{ background: '#f8fafc', padding: '8px 14px', fontSize: '11.5px', fontWeight: 800, color: '#475569', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 2 }}>
                                <span>✨ DAFTAR KATALOG (Klik untuk pilih)</span>
                                <button type="button" onClick={() => setActiveSpDropdown(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b', fontSize: '15px', fontWeight: 'bold' }}>✕</button>
                              </div>

                              {filtered.length > 0 ? (
                                filtered.map((k) => (
                                  <div
                                    key={k.id}
                                    onClick={() => handleSelectKatalog(idx, k)}
                                    style={{
                                      padding: '10px 14px',
                                      cursor: 'pointer',
                                      borderBottom: '1px solid #f1f5f9',
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      background: item.namaSparepart.toLowerCase() === k.nama.toLowerCase() ? '#f0fdf4' : '#ffffff',
                                      transition: 'all 0.15s ease'
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f0fdf4')}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = item.namaSparepart.toLowerCase() === k.nama.toLowerCase() ? '#f0fdf4' : '#ffffff')}
                                  >
                                    <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '13.5px' }}>📦 {k.nama}</span>
                                    <span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 10px', borderRadius: '14px', fontWeight: 800, fontSize: '12px', border: '1px solid #86efac' }}>
                                      Rp {Number(k.hargaSatuan).toLocaleString('id-ID')}
                                    </span>
                                  </div>
                                ))
                              ) : (
                                <div style={{ padding: '14px 12px', textAlign: 'center', color: '#64748b', fontSize: '12.5px', fontStyle: 'italic', background: '#fef2f2' }}>
                                  ❌ Belum ada sparepart dengan nama &quot;{item.namaSparepart}&quot; di database katalog.
                                </div>
                              )}

                              {/* TOMBOL SIMPAN KE KATALOG JIKA BELUM ADA */}
                              {item.namaSparepart.trim() !== '' && !exactMatch && (
                                <div style={{ padding: '10px', background: '#f0fdf4', borderTop: '2px solid #86efac', position: 'sticky', bottom: 0, zIndex: 2 }}>
                                  <button
                                    type="button"
                                    onClick={() => handleSaveToKatalog(idx)}
                                    disabled={savingNewKatalogIdx === idx}
                                    style={{
                                      width: '100%',
                                      padding: '9px 12px',
                                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                      color: '#ffffff',
                                      border: 'none',
                                      borderRadius: '6px',
                                      fontWeight: 800,
                                      fontSize: '13px',
                                      cursor: 'pointer',
                                      boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      gap: '6px'
                                    }}
                                  >
                                    {savingNewKatalogIdx === idx ? '⏳ Menyimpan ke Master...' : `✨ Simpan "${item.namaSparepart}" ke Master Katalog`}
                                  </button>
                                  <p style={{ margin: '5px 0 0 0', fontSize: '11px', color: '#047857', textAlign: 'center', fontWeight: 600 }}>
                                    💡 *Ketik harga di kolom kanan lalu klik ini agar besok cukup ketik huruf depannya saja!
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td style={{ width: '100px', padding: '8px 6px' }}>
                          <input
                            type="number"
                            min="1"
                            placeholder="1"
                            value={item.qty || 1}
                            onChange={(e) => handleUpdateSparepart(idx, 'qty', Math.max(1, parseInt(e.target.value, 10) || 1))}
                            style={{ width: '100%', padding: '9px 6px', textAlign: 'center', border: '1px solid #cbd5e1', borderRadius: '6px', fontWeight: 700, fontSize: '13.5px' }}
                          />
                        </td>
                        <td style={{ width: '170px', padding: '8px 6px' }}>
                          <input
                            type="number"
                            placeholder="0"
                            value={item.hargaSatuan || ''}
                            onChange={(e) => handleUpdateSparepart(idx, 'hargaSatuan', parseInt(e.target.value, 10) || 0)}
                            style={{ width: '100%', padding: '9px 10px', textAlign: 'right', border: '1px solid #cbd5e1', borderRadius: '6px', fontWeight: 600, fontSize: '13.5px' }}
                          />
                        </td>
                        <td style={{ width: '170px', textAlign: 'right', paddingRight: '14px', fontWeight: 800, color: '#047857', fontSize: '14px', whiteSpace: 'nowrap' }}>
                          Rp {((item.qty || 1) * Number(item.hargaSatuan || 0)).toLocaleString('id-ID')}
                        </td>
                        <td style={{ textAlign: 'center', width: '90px', padding: '8px 6px' }}>
                          <button
                            type="button"
                            className="pilih-btn"
                            onClick={() => handleRemoveSparepart(idx)}
                            style={{ border: '1px solid #ef4444', color: '#dc2626', background: '#fef2f2', padding: '7px 12px', borderRadius: '6px', fontWeight: 'bold', fontSize: '12.5px', transition: 'all 0.15s' }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#dc2626'; e.currentTarget.style.color = '#ffffff'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#dc2626'; }}
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '14px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleAddSparepart}
              style={{ flex: 1, minWidth: '220px', padding: '12px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 800, fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(16, 185, 129, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              ➕ Tambah Baris Sparepart
            </button>
            
            <button
              type="button"
              onClick={() => setIsKatalogModalOpen(true)}
              style={{ flex: 1, minWidth: '220px', padding: '12px', background: '#ffffff', color: 'var(--hijau-tua)', border: '2px solid var(--hijau-tua)', borderRadius: '8px', fontWeight: 800, fontSize: '14px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.15s' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#f0fdf4'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; }}
            >
              📦 Kelola & Lihat Katalog Master Sparepart
            </button>
          </div>

          {/* TOTAL COST DISPLAY SUMMARY */}
          <div style={{ marginTop: '20px', background: '#fcfaf4', borderRadius: '8px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', padding: '4px 0', color: '#555' }}>
              <span>Man Power Cost</span>
              <b style={{ color: '#222' }}>Rp {totalMpCost.toLocaleString('id-ID')}</b>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', padding: '4px 0', color: '#555' }}>
              <span>Sparepart Cost</span>
              <b style={{ color: '#222' }}>Rp {totalSparepart.toLocaleString('id-ID')}</b>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 900, color: 'var(--hijau-tua)', borderTop: '1px dashed #ccc', marginTop: '10px', paddingTop: '10px', textTransform: 'uppercase' }}>
              <span>TOTAL COST</span>
              <span>Rp {totalCostCombined.toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>

        {/* COOLING & HEATER INSPECTION SECTION ON SCREEN */}
        {hasCoolingOrHeater && (
          <div className="kartu" style={{ marginTop: '20px' }}>
            <p className="label-besar" style={{ borderBottom: '2px solid var(--hijau-tua)', paddingBottom: '8px', marginBottom: '14px' }}>
              ❄️ &amp; ⚡ Data Pemeriksaan Cooling &amp; Heater (Ohm)
            </p>

            {/* Cooling Core & Cavity */}
            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontWeight: 700, fontSize: '14px', marginBottom: '8px', color: '#333' }}>1. Pemeriksaan Cooling (Debit Air)</p>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid var(--garis)', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: '#f5f5f4', textAlign: 'left' }}>
                    <th style={{ padding: '10px 12px', border: '1px solid var(--garis)' }}>Area Cooling</th>
                    <th style={{ padding: '10px 12px', border: '1px solid var(--garis)', textAlign: 'center' }}>Standar Debit (L / Mnt)</th>
                    <th style={{ padding: '10px 12px', border: '1px solid var(--garis)', textAlign: 'center' }}>Aktual Pengukuran (L / Mnt)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '10px 12px', border: '1px solid var(--garis)', fontWeight: 600 }}>Cooling Core</td>
                    <td style={{ padding: '10px 12px', border: '1px solid var(--garis)', textAlign: 'center' }}>{laporan.moldData?.coreStd ? `${laporan.moldData.coreStd} L / mnt` : '25 L / mnt (Std)'}</td>
                    <td style={{ padding: '10px 12px', border: '1px solid var(--garis)', textAlign: 'center', fontWeight: 'bold', color: laporan.coreActual ? 'var(--hijau-tua)' : 'var(--teks-redup)' }}>
                      {laporan.coreActual ? `${laporan.coreActual} L / mnt` : '-'}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '10px 12px', border: '1px solid var(--garis)', fontWeight: 600 }}>Cooling Cavity</td>
                    <td style={{ padding: '10px 12px', border: '1px solid var(--garis)', textAlign: 'center' }}>{laporan.moldData?.cavStd ? `${laporan.moldData.cavStd} L / mnt` : '24,2 L / mnt (Std)'}</td>
                    <td style={{ padding: '10px 12px', border: '1px solid var(--garis)', textAlign: 'center', fontWeight: 'bold', color: laporan.cavActual ? 'var(--hijau-tua)' : 'var(--teks-redup)' }}>
                      {laporan.cavActual ? `${laporan.cavActual} L / mnt` : '-'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Heater Resistance (Ohm) */}
            <div>
              <p style={{ fontWeight: 700, fontSize: '14px', marginBottom: '8px', color: '#333' }}>2. Pemeriksaan Heater Resistance (Ω / Ohm)</p>
              {heaterCount === 0 ? (
                <div style={{ padding: '14px', background: '#f5f5f4', borderRadius: '8px', textAlign: 'center', color: 'var(--teks-redup)' }}>
                  Mold tidak memakai heater (No Heater) atau data pengukuran heater tidak diisi.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid var(--garis)', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: '#f5f5f4' }}>
                        <th style={{ padding: '8px 10px', border: '1px solid var(--garis)', width: '60px', textAlign: 'center' }}>Zone</th>
                        <th style={{ padding: '8px 10px', border: '1px solid var(--garis)', textAlign: 'center' }}>Standar (Ω)</th>
                        <th style={{ padding: '8px 10px', border: '1px solid var(--garis)', textAlign: 'center' }}>Aktual (Ω)</th>
                        <th style={{ padding: '8px 10px', border: '1px solid var(--garis)', textAlign: 'center', width: '90px' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: heaterCount }).map((_, i) => {
                        const stdVal = stdHeaters[i] !== undefined && stdHeaters[i] !== null ? `${stdHeaters[i]} Ω` : '-'
                        let actVal = '-'
                        let judge = '-'
                        let color = '#333'
                        let bg = 'transparent'

                        if (isAllHeatersOk) {
                          actVal = 'OK (Sesuai Standar)'
                          judge = 'OK'
                          color = '#15803d'
                        } else if (actHeaters[i] !== undefined && actHeaters[i] !== null && actHeaters[i] !== '') {
                          const v = String(actHeaters[i]).trim()
                          actVal = isNaN(Number(v)) ? v : `${v} Ω`
                          judge = v.toLowerCase() === 'ok' || (!isNaN(Number(v)) && Number(v) > 0) ? 'OK' : 'NG'
                          color = judge === 'NG' ? '#dc2626' : '#15803d'
                          bg = judge === 'NG' ? '#fef2f2' : 'transparent'
                        }

                        return (
                          <tr key={i} style={{ background: bg }}>
                            <td style={{ padding: '8px 10px', border: '1px solid var(--garis)', textAlign: 'center', fontWeight: 'bold', background: '#f8f8f7' }}>H{i + 1}</td>
                            <td style={{ padding: '8px 10px', border: '1px solid var(--garis)', textAlign: 'center' }}>{stdVal}</td>
                            <td style={{ padding: '8px 10px', border: '1px solid var(--garis)', textAlign: 'center', fontWeight: 600, color }}>{actVal}</td>
                            <td style={{ padding: '8px 10px', border: '1px solid var(--garis)', textAlign: 'center', fontWeight: 'bold', color }}>{judge}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* FOTO UPLOAD SECTION */}
        <div className="kartu">
          <p className="label-besar">Upload Foto Temuan / Hasil Kerja</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
            {foto.map((src, i) => (
              <div key={i} style={{ position: 'relative', display: 'inline-block' }}>
                <img src={src} style={{ width: '90px', height: '90px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--garis)' }} />
                <button
                  type="button"
                  onClick={() => handleRemoveFoto(i)}
                  style={{ position: 'absolute', top: '-6px', right: '-6px', width: '22px', height: '22px', borderRadius: '50%', background: 'var(--merah)', color: '#fff', border: 'none', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <label className="tombol-sekunder" style={{ display: 'inline-block', cursor: 'pointer', margin: 0, padding: '10px' }}>
            📷 Pilih File Foto
            <input type="file" accept="image/*" multiple onChange={handleImageUpload} style={{ display: 'none' }} />
          </label>
        </div>

        {/* CATATAN TAMBAHAN (Catatan Overhaul / CM Card) */}
        <div className="kartu">
          <p className="label-besar">Catatan Tambahan</p>
          <textarea
            placeholder="Catatan penemuan atau hasil pemeriksaan..."
            rows={3}
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
          />
        </div>
        </fieldset>

        {/* SIGNATURE APPROVAL CARD */}
        <div className="kartu" style={{ marginTop: '30px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '15px', marginBottom: '15px' }}>
            <p className="label-besar" style={{ margin: 0 }}>Approval Status & Tanda Tangan</p>
            
            {/* APPROVE ALL BUTTON */}
            {['TL', 'GL', 'ADM', 'SUPER_ADMIN'].includes(userRole || '') && (
              <button 
                onClick={handleSignAll}
                className="group relative flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold text-sm rounded-lg shadow-md hover:shadow-lg hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 transform hover:-translate-y-0.5"
                style={{ border: 'none', cursor: 'pointer' }}
                title="Approve All Remaining (TL, GL, ADM)"
              >
                <span style={{ marginRight: '5px' }}>⚡</span>
                <span className="tracking-wide">Approve All</span>
              </button>
            )}
          </div>

          <div className="cs-ttd-wrap">
            {getTtdBox('PIC', 'Member (PIC)', picSign, undefined)}
            {getTtdBox('TL', 'Team Leader', tlSign, picSign)}
            {getTtdBox('GL', 'Group Leader', glSign, tlSign)}
            {getTtdBox('ADM', 'ADM', admSign, glSign)}
          </div>
        </div>
        {/* SUBMIT BUTTON AT BOTTOM */}
        {!isLocked && (
          <button className="tombol-utama" type="button" onClick={() => handleSave(true)}>
            💾 SIMPAN DATA CHECKSHEET
          </button>
        )}
      </section>

      {/* ========================================================
         ===== TAB PRINT - PRINT ONLY CONTAINER FOR PAPER =====
         ======================================================== */}
      <div className="cs-print-only" style={{ background: '#fff', color: '#000', fontFamily: 'Arial, sans-serif' }}>
        <h2 style={{ textAlign: 'center', margin: '0 0 16px 0', textTransform: 'uppercase', textDecoration: 'underline' }}>
          {isOverhaul ? 'DATA PEMERIKSAAN OVERHAUL MOLD' : `CM CARD (${laporan.jenis})`}
        </h2>

        {/* Header table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '14px', fontSize: '12px' }} border={1}>
          <tbody>
            <tr>
              <td style={{ padding: '6px', width: '25%', fontWeight: 'bold' }}>Nomor Mold</td>
              <td style={{ padding: '6px', width: '25%' }}>{laporan.noMold}</td>
              <td style={{ padding: '6px', width: '25%', fontWeight: 'bold' }}>Tanggal Kerja</td>
              <td style={{ padding: '6px', width: '25%' }}>{new Date(laporan.tanggal).toLocaleDateString('id-ID')}</td>
            </tr>
            <tr>
              <td style={{ padding: '6px', fontWeight: 'bold' }}>Nama Part</td>
              <td style={{ padding: '6px' }}>{laporan.part || '-'}</td>
              <td style={{ padding: '6px', fontWeight: 'bold' }}>Shift / Factory</td>
              <td style={{ padding: '6px' }}>{laporan.shift || 'Nonshift'} / {laporan.factory}</td>
            </tr>
            <tr>
              <td style={{ padding: '6px', fontWeight: 'bold' }}>Jenis Laporan</td>
              <td style={{ padding: '6px' }}>{laporan.jenis}</td>
              <td style={{ padding: '6px', fontWeight: 'bold' }}>PIC Pembuat</td>
              <td style={{ padding: '6px' }}>{laporan.pic.nama}</td>
            </tr>
          </tbody>
        </table>

        {/* Printable overhaul items */}
        {isOverhaul ? (
          <>
            <h3 style={{ fontSize: '13px', margin: '12px 0 6px 0' }}>A. PEMERIKSAAN UTAMA (Main Check)</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10.5px' }} border={1}>
              <thead>
                <tr style={{ background: '#eee' }}>
                  <th style={{ width: '35px', padding: '4px' }}>No</th>
                  <th style={{ padding: '4px' }}>Item Pemeriksaan</th>
                  <th style={{ width: '90px', padding: '4px' }}>Metode</th>
                  <th style={{ width: '120px', padding: '4px' }}>Standar</th>
                  <th style={{ width: '60px', padding: '4px' }}>Judge</th>
                  <th style={{ width: '130px', padding: '4px' }}>Comment</th>
                </tr>
              </thead>
              <tbody>
                {OH_SECTIONS_A.map((sec) => {
                  return sec.items.map((item, i) => {
                    const key = `${sec.kode}|${i}`
                    const val = checklist[key]?.judge || '-'
                    const komentar = checklist[key]?.komentar || '-'
                    return (
                      <tr key={key}>
                        <td style={{ textAlign: 'center', padding: '3px' }}>{sec.kode}.{i + 1}</td>
                        <td style={{ padding: '3px' }}>{item.label}</td>
                        <td style={{ padding: '3px' }}>{item.metode}</td>
                        <td style={{ padding: '3px' }}>{item.standar}</td>
                        <td style={{ textAlign: 'center', padding: '3px', fontWeight: 'bold', color: val === 'NG' ? 'red' : 'black' }}>{val}</td>
                        <td style={{ padding: '3px' }}>{komentar}</td>
                      </tr>
                    )
                  })
                })}
              </tbody>
            </table>

            <h3 style={{ fontSize: '13px', margin: '14px 0 6px 0' }}>B. EJECTOR GROUP & C/D/E SECTIONS</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10.5px' }} border={1}>
              <thead>
                <tr style={{ background: '#eee' }}>
                  <th style={{ width: '35px', padding: '4px' }}>No</th>
                  <th style={{ padding: '4px' }}>Item Pemeriksaan</th>
                  <th style={{ width: '90px', padding: '4px' }}>Metode</th>
                  <th style={{ width: '120px', padding: '4px' }}>Standar</th>
                  <th style={{ width: '60px', padding: '4px' }}>Judge</th>
                  <th style={{ width: '130px', padding: '4px' }}>Comment</th>
                </tr>
              </thead>
              <tbody>
                {OH_SECTIONS_EG.map((sec) => {
                  return sec.items.map((item, i) => {
                    const key = `${sec.kode}|${i}`
                    const val = checklist[key]?.judge || '-'
                    const komentar = checklist[key]?.komentar || '-'
                    return (
                      <tr key={key}>
                        <td style={{ textAlign: 'center', padding: '3px' }}>{sec.kode}.{i + 1}</td>
                        <td style={{ padding: '3px' }}>{item.label}</td>
                        <td style={{ padding: '3px' }}>{item.metode}</td>
                        <td style={{ padding: '3px' }}>{item.standar}</td>
                        <td style={{ textAlign: 'center', padding: '3px', fontWeight: 'bold', color: val === 'NG' ? 'red' : 'black' }}>{val}</td>
                        <td style={{ padding: '3px' }}>{komentar}</td>
                      </tr>
                    )
                  })
                })}

                {OH_SECTIONS_CDE.map((sec) => {
                  const itemsObj = sec.items.map((label) => ({ label, metode: '-', standar: '-' }))
                  return itemsObj.map((item, i) => {
                    const key = `${sec.kode}|${i}`
                    const val = checklist[key]?.judge || '-'
                    const komentar = checklist[key]?.komentar || '-'
                    return (
                      <tr key={key}>
                        <td style={{ textAlign: 'center', padding: '3px' }}>{sec.kode}.{i + 1}</td>
                        <td style={{ padding: '3px' }}>{item.label}</td>
                        <td style={{ padding: '3px' }}>{sec.metodeCheck}</td>
                        <td style={{ padding: '3px' }}>{sec.std}</td>
                        <td style={{ textAlign: 'center', padding: '3px', fontWeight: 'bold', color: val === 'NG' ? 'red' : 'black' }}>{val}</td>
                        <td style={{ padding: '3px' }}>{komentar}</td>
                      </tr>
                    )
                  })
                })}
              </tbody>
            </table>
          </>
        ) : (
          <>
            <h3 style={{ fontSize: '13px', margin: '14px 0 6px 0' }}>INFORMASI PERBAIKAN CM CARD</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', marginBottom: '14px' }} border={1}>
              <tbody>
                {CM_CARD_FIELDS.map((label, idx) => {
                  const key = `cm_${idx}`
                  const val = checklist[key] !== undefined ? checklist[key] : (idx === 0 ? (laporan.info || '') : (idx === 2 ? (laporan.countermeasure || '') : ''))
                  return (
                    <tr key={idx}>
                      <td style={{ padding: '6px', fontWeight: 'bold', width: '35%' }}>{label}</td>
                      <td style={{ padding: '6px', whiteSpace: 'pre-wrap' }}>{val || '-'}</td>
                    </tr>
                  )
                })}
                <tr>
                  <td style={{ padding: '6px', fontWeight: 'bold' }}>Hasil Verifikasi Akhir</td>
                  <td style={{ padding: '6px', fontWeight: 'bold' }}>{checklist['cm_judge'] || '-'}</td>
                </tr>
              </tbody>
            </table>
          </>
        )}

        {/* Printable spareparts list */}
        <h3 style={{ fontSize: '13px', margin: '14px 0 6px 0' }}>PEMAKAIAN SPAREPART</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', marginBottom: '14px' }} border={1}>
          <thead>
            <tr style={{ background: '#eee' }}>
              <th style={{ padding: '4px' }}>Nama Sparepart</th>
              <th style={{ width: '100px', padding: '4px' }}>Qty</th>
              <th style={{ width: '150px', padding: '4px' }}>Harga Satuan</th>
              <th style={{ width: '150px', padding: '4px' }}>Total Biaya</th>
            </tr>
          </thead>
          <tbody>
            {spareparts.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: '6px', textAlign: 'center', color: '#666' }}>Tidak ada pemakaian sparepart.</td>
              </tr>
            ) : (
              spareparts.map((sp, idx) => (
                <tr key={idx}>
                  <td style={{ padding: '4px' }}>{sp.namaSparepart}</td>
                  <td style={{ padding: '4px', textAlign: 'center' }}>{sp.qty}</td>
                  <td style={{ padding: '4px', textAlign: 'right' }}>Rp {Number(sp.hargaSatuan).toLocaleString('id-ID')}</td>
                  <td style={{ padding: '4px', textAlign: 'right' }}>Rp {(sp.qty * Number(sp.hargaSatuan)).toLocaleString('id-ID')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Printable M/P Cost list */}
        <h3 style={{ fontSize: '13px', margin: '14px 0 6px 0' }}>ESTIMASI MAN POWER COST</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', marginBottom: '14px', textAlign: 'center' }} border={1}>
          <thead>
            <tr style={{ background: '#eee' }}>
              <th style={{ padding: '4px' }}>Nama PIC</th>
              <th style={{ padding: '4px' }}>Shift</th>
              <th style={{ padding: '4px' }}>Tanggal</th>
              <th style={{ padding: '4px' }}>Jam Mulai</th>
              <th style={{ padding: '4px' }}>Jam Selesai</th>
              <th style={{ padding: '4px' }}>Total Orang</th>
              <th style={{ padding: '4px', textAlign: 'right' }}>Total Cost</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '4px' }}>{laporan.pic.nama}</td>
              <td style={{ padding: '4px' }}>{laporan.shift || '-'}</td>
              <td style={{ padding: '4px' }}>{new Date(laporan.tanggal).toLocaleDateString('id-ID')}</td>
              <td style={{ padding: '4px' }}>{jamMulai || '-'}</td>
              <td style={{ padding: '4px' }}>{jamSelesai || '-'}</td>
              <td style={{ padding: '4px' }}>{jumlahOrang}</td>
              <td style={{ padding: '4px', textAlign: 'right' }}>Rp {totalMpCost.toLocaleString('id-ID')}</td>
            </tr>
          </tbody>
        </table>

        {/* Total Biaya Pemeliharaan */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', marginBottom: '14px' }} border={1}>
          <tbody>
            <tr style={{ background: '#fafafa', fontWeight: 'bold' }}>
              <td style={{ padding: '6px', textAlign: 'right', width: '70%' }}>Total Sparepart Cost</td>
              <td style={{ padding: '6px', textAlign: 'right' }}>Rp {totalSparepart.toLocaleString('id-ID')}</td>
            </tr>
            <tr style={{ background: '#fafafa', fontWeight: 'bold' }}>
              <td style={{ padding: '6px', textAlign: 'right' }}>Total Man Power Cost</td>
              <td style={{ padding: '6px', textAlign: 'right' }}>Rp {totalMpCost.toLocaleString('id-ID')}</td>
            </tr>
            <tr style={{ background: '#eee', fontWeight: 'bold', fontSize: '12px' }}>
              <td style={{ padding: '6px', textAlign: 'right' }}>TOTAL BIAYA PEMELIHARAAN</td>
              <td style={{ padding: '6px', textAlign: 'right' }}>Rp {totalCostCombined.toLocaleString('id-ID')}</td>
            </tr>
          </tbody>
        </table>

        {hasCoolingOrHeater && (
          <>
            <h3 style={{ fontSize: '13px', margin: '14px 0 6px 0' }}>G. DATA PEMERIKSAAN COOLING (CORE &amp; CAVITY)</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', marginBottom: '14px', textAlign: 'center' }} border={1}>
              <thead>
                <tr style={{ background: '#eee' }}>
                  <th style={{ padding: '4px', width: '30%', textAlign: 'left' }}>AREA COOLING</th>
                  <th style={{ padding: '4px', width: '35%' }}>STANDAR DEBIT (L / MNT)</th>
                  <th style={{ padding: '4px', width: '35%' }}>AKTUAL PENGECEKAN (L / MNT)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '4px', textAlign: 'left', fontWeight: 'bold' }}>COOLING CORE</td>
                  <td style={{ padding: '4px' }}>{laporan.moldData?.coreStd ? `${laporan.moldData.coreStd} L / mnt` : '25 L / mnt (Std)'}</td>
                  <td style={{ padding: '4px', fontWeight: 'bold', color: laporan.coreActual ? 'green' : '#333' }}>{laporan.coreActual ? `${laporan.coreActual} L / mnt` : '-'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '4px', textAlign: 'left', fontWeight: 'bold' }}>COOLING CAVITY</td>
                  <td style={{ padding: '4px' }}>{laporan.moldData?.cavStd ? `${laporan.moldData.cavStd} L / mnt` : '24,2 L / mnt (Std)'}</td>
                  <td style={{ padding: '4px', fontWeight: 'bold', color: laporan.cavActual ? 'green' : '#333' }}>{laporan.cavActual ? `${laporan.cavActual} L / mnt` : '-'}</td>
                </tr>
              </tbody>
            </table>

            <h3 style={{ fontSize: '13px', margin: '14px 0 6px 0' }}>H. DATA PEMERIKSAAN HEATER RESISTANCE (OHM)</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', marginBottom: '14px', textAlign: 'center' }} border={1}>
              <thead>
                <tr style={{ background: '#eee' }}>
                  <th style={{ padding: '4px', width: '60px' }}>ZONE / NO</th>
                  <th style={{ padding: '4px' }}>STANDAR RESISTANSI (Ω)</th>
                  <th style={{ padding: '4px' }}>AKTUAL RESISTANSI (Ω)</th>
                  <th style={{ padding: '4px', width: '100px' }}>JUDGE / STATUS</th>
                </tr>
              </thead>
              <tbody>
                {heaterCount === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '6px', textAlign: 'center', color: '#666' }}>Tidak menggunakan heater (No Heater) atau data pengukuran heater tidak diisi.</td>
                  </tr>
                ) : (
                  Array.from({ length: heaterCount }).map((_, i) => {
                    const stdVal = stdHeaters[i] !== undefined && stdHeaters[i] !== null ? `${stdHeaters[i]} Ω` : '-'
                    let actVal = '-'
                    let judge = '-'
                    let color = '#333'

                    if (isAllHeatersOk) {
                      actVal = 'OK (Sesuai Standar)'
                      judge = 'OK'
                      color = '#15803d'
                    } else if (actHeaters[i] !== undefined && actHeaters[i] !== null && actHeaters[i] !== '') {
                      const v = String(actHeaters[i]).trim()
                      actVal = isNaN(Number(v)) ? v : `${v} Ω`
                      judge = v.toLowerCase() === 'ok' || (!isNaN(Number(v)) && Number(v) > 0) ? 'OK' : 'NG'
                      color = judge === 'NG' ? '#dc2626' : '#15803d'
                    }

                    return (
                      <tr key={i}>
                        <td style={{ padding: '4px', fontWeight: 'bold', background: '#f8f8f7' }}>H{i + 1}</td>
                        <td style={{ padding: '4px' }}>{stdVal}</td>
                        <td style={{ padding: '4px', fontWeight: 'bold', color }}>{actVal}</td>
                        <td style={{ padding: '4px', fontWeight: 'bold', color }}>{judge}</td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </>
        )}

        {/* Catatan hasil */}
        <div style={{ border: '1px solid #000', padding: '8px', fontSize: '11px', marginTop: '10px', minHeight: '60px' }}>
          <b>Catatan Tambahan:</b>
          <div style={{ marginTop: '4px', whiteSpace: 'pre-wrap' }}>{catatan || '(Tidak ada catatan)'}</div>
        </div>

        {/* Printable signature approval row */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '22px', fontSize: '11px', textAlign: 'center' }} border={1}>
          <thead>
            <tr style={{ background: '#eee' }}>
              <th style={{ width: '25%', padding: '6px' }}>Disiapkan Oleh (Member PIC)</th>
              <th style={{ width: '25%', padding: '6px' }}>Diperiksa Oleh (Team Leader)</th>
              <th style={{ width: '25%', padding: '6px' }}>Disetujui Oleh (Group Leader)</th>
              <th style={{ width: '25%', padding: '6px' }}>Diterima Oleh (ADM)</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ height: '80px' }}>
              <td style={{ padding: '6px', verticalAlign: 'bottom' }}>
                {picSign?.signedAt && picSign.user?.signature && (
                  <div style={{ textAlign: 'center', marginBottom: '4px' }}>
                    <img src={picSign.user.signature} alt="TTD" style={{ maxHeight: '45px', objectFit: 'contain', margin: '0 auto', display: 'block' }} />
                  </div>
                )}
                <div><b>{picSign?.signedAt ? picSign.user?.nama || 'Verified' : ''}</b></div>
                <div style={{ fontSize: '10px', color: '#666' }}>{picSign?.signedAt ? new Date(picSign.signedAt).toLocaleDateString('id-ID') : 'Belum TTD'}</div>
              </td>
              <td style={{ padding: '6px', verticalAlign: 'bottom' }}>
                {tlSign?.signedAt && tlSign.user?.signature && (
                  <div style={{ textAlign: 'center', marginBottom: '4px' }}>
                    <img src={tlSign.user.signature} alt="TTD" style={{ maxHeight: '45px', objectFit: 'contain', margin: '0 auto', display: 'block' }} />
                  </div>
                )}
                <div><b>{tlSign?.signedAt ? tlSign.user?.nama || 'Verified' : ''}</b></div>
                <div style={{ fontSize: '10px', color: '#666' }}>{tlSign?.signedAt ? new Date(tlSign.signedAt).toLocaleDateString('id-ID') : 'Belum TTD'}</div>
              </td>
              <td style={{ padding: '6px', verticalAlign: 'bottom' }}>
                {glSign?.signedAt && glSign.user?.signature && (
                  <div style={{ textAlign: 'center', marginBottom: '4px' }}>
                    <img src={glSign.user.signature} alt="TTD" style={{ maxHeight: '45px', objectFit: 'contain', margin: '0 auto', display: 'block' }} />
                  </div>
                )}
                <div><b>{glSign?.signedAt ? glSign.user?.nama || 'Verified' : ''}</b></div>
                <div style={{ fontSize: '10px', color: '#666' }}>{glSign?.signedAt ? new Date(glSign.signedAt).toLocaleDateString('id-ID') : 'Belum TTD'}</div>
              </td>
              <td style={{ padding: '6px', verticalAlign: 'bottom' }}>
                {admSign?.signedAt && admSign.user?.signature && (
                  <div style={{ textAlign: 'center', marginBottom: '4px' }}>
                    <img src={admSign.user.signature} alt="TTD" style={{ maxHeight: '45px', objectFit: 'contain', margin: '0 auto', display: 'block' }} />
                  </div>
                )}
                <div><b>{admSign?.signedAt ? admSign.user?.nama || 'Verified' : ''}</b></div>
                <div style={{ fontSize: '10px', color: '#666' }}>{admSign?.signedAt ? new Date(admSign.signedAt).toLocaleDateString('id-ID') : 'Belum TTD'}</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {isKatalogModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
            <h3 style={{ textAlign: 'center', marginBottom: '8px', color: 'var(--hijau-tua)' }}>📦 Kelola Katalog Sparepart</h3>
            <p style={{ textAlign: 'center', fontSize: '13px', color: '#666', marginBottom: '20px' }}>Nama & harga yang ditambahkan bisa langsung dicari saat isi checksheet</p>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '6px' }}>Nama Sparepart *</label>
              <input
                type="text"
                placeholder="Contoh: Tabung V/G PWPA 80"
                value={newKatalogNama}
                onChange={e => setNewKatalogNama(e.target.value)}
                style={{ width: '100%', padding: '10px', border: '1px solid var(--garis)', borderRadius: '6px' }}
              />
            </div>
            
            <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '6px' }}>Harga (Rp) *</label>
                <input
                  type="number"
                  placeholder="cth: 23000"
                  value={newKatalogHarga}
                  onChange={e => setNewKatalogHarga(e.target.value)}
                  style={{ width: '100%', padding: '10px', border: '1px solid var(--garis)', borderRadius: '6px' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button
                  type="button"
                  onClick={handleAddKatalog}
                  disabled={isSubmittingKatalog}
                  style={{ padding: '10px 20px', background: '#d96c2c', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', height: '42px' }}
                >
                  {isSubmittingKatalog ? '...' : '+ Tambah'}
                </button>
              </div>
            </div>

            <div style={{ borderTop: '1px dashed #ccc', margin: '20px 0', padding: '0' }} />

            <h4 style={{ color: 'var(--hijau-tua)', marginBottom: '12px', fontSize: '14px' }}>Katalog Saat Ini</h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
              {katalogList.length === 0 ? (
                <div style={{ fontSize: '13px', color: '#888', textAlign: 'center', padding: '10px' }}>Katalog masih kosong</div>
              ) : (
                katalogList.map(k => (
                  <div key={k.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f9f9f9', padding: '8px 12px', borderRadius: '6px', fontSize: '13px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 'bold' }}>{k.nama}</span>
                      <span style={{ color: '#666' }}>Rp {Number(k.hargaSatuan).toLocaleString('id-ID')}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteKatalog(k.id)}
                      style={{ background: '#ffebeb', color: 'var(--merah)', border: 'none', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                    >
                      Hapus
                    </button>
                  </div>
                ))
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsKatalogModalOpen(false)}
              style={{ width: '100%', padding: '12px', background: '#e8e8e8', color: '#333', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginTop: '20px' }}
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </>
  )
}
