'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { showToast } from '@/components/ui/Toast'

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
  pic: {
    nama: string
  }
  moldData?: {
    mc: string | null
    tonase: string | null
    customer: string | null
    model: string | null
    part?: string | null
    coreStd: string | null
    cavStd: string | null
    heaterStd?: any
    shotCycle: string | null
    shotMonth: string | null
  } | null
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

const BM_CHUCK_ITEMS = [
  { label: 'Frame', standard: 'Tidak Bengkok' },
  { label: 'Cilyder', standard: 'Tidak Bocor' },
  { label: 'Vacum', standard: 'Tidak Cacat' },
  { label: 'Lengan Chuck', standard: 'Tidak Cacat' },
  { label: 'Guiden / Lock', standard: 'Tidak Cacat' },
  { label: 'L/S', standard: 'Interlock OK' },
  { label: 'Metacon', standard: 'Tidak Cacat' },
  { label: 'Hose / Joint', standard: 'Tidak Bocor' },
  { label: 'Handle', standard: 'Tidak Cacat' },
  { label: 'Baut Ikat', standard: 'Tidak Kendor' }
]

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
    items: ['Nozzle Bush', 'Baut Ikat', 'Casting / Pin Heater', 'Band Heater', 'Thermocouple', 'Dowel Pin', 'Washer', 'Plug', 'Touching Area']
  },
  {
    kode: 'D', judul: 'D. VALVE GATE & L/S', costLabel: 'b4',
    std: "Tidak ada bocor mat'l, Tabung tidak ngempos, Sensor normal, Angin tidak bocor",
    metodeCheck: 'Bongkar Valve Gate',
    jenisPilihan: ['Sekisui', 'Kata Sistem', 'Oil Sistem'],
    items: ['Stick L/S', 'L/S', 'Tabung', 'O-Ring', 'Bushing', 'V/G Pin', 'Hose / Joint', 'Nepple', 'Baut Ikat', "Mat'l Bocor"]
  },
  {
    kode: 'E', judul: 'E. HYDRUOLIC CHECK', costLabel: 'b5',
    std: 'Tidak ada bagian yang crack, Interlock berfungsi, Sliding smooth, Hyd tidak bocor',
    metodeCheck: 'Bongkar Hyd Unit',
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
  ADM: 'ADM',
}

interface ChecksheetModalProps {
  laporanId: number
  onClose: () => void
  onSaved: () => void
}

export default function ChecksheetModal({ laporanId, onClose, onSaved }: ChecksheetModalProps) {
  const { data: session } = useSession()

  const [laporan, setLaporan] = useState<LaporanData | null>(null)
  const [loading, setLoading] = useState(true)

  // Checksheet data states
  const [checklist, setChecklist] = useState<Record<string, any>>({})
  const [costBox, setCostBox] = useState<Record<string, any>>({})
  const [jamMulai, setJamMulai] = useState('')
  const [jamSelesai, setJamSelesai] = useState('')
  const [jumlahOrang, setJumlahOrang] = useState(1)
  const [catatan, setCatatan] = useState('')

  // Spareparts
  const [spareparts, setSpareparts] = useState<SparepartEntry[]>([])
  const [katalogList, setKatalogList] = useState<{ id: number; nama: string; hargaSatuan: number }[]>([])
  const [activeSpDropdown, setActiveSpDropdown] = useState<number | null>(null)
  const [savingNewKatalogIdx, setSavingNewKatalogIdx] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/sparepart')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setKatalogList(data)
      })
      .catch((err) => console.error(err))
  }, [])

  // Fotos
  const [foto, setFoto] = useState<string[]>([])

  useEffect(() => {
    fetch(`/api/laporan/${laporanId}/checksheet`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          showToast(data.error, 'error')
        } else {
          setLaporan(data)
          if (data.checksheet) {
            const rawChecklist = data.checksheet.checklist || {}
            setChecklist(rawChecklist.items || rawChecklist.checklist || {})

            const masterJamMulai = data.checksheet.jamMulai || ''
            const masterJamSelesai = data.checksheet.jamSelesai || ''
            const masterJumlahOrang = data.checksheet.jumlahOrang || 1

            const loadedCostBox = rawChecklist.costBox || {}
            ;['b1', 'b2', 'b3', 'b4', 'b5'].forEach((key) => {
              if (!loadedCostBox[key]) {
                loadedCostBox[key] = { jamMulai: masterJamMulai, jamSelesai: masterJamSelesai, orang: masterJumlahOrang }
              } else {
                if (!loadedCostBox[key].jamMulai) loadedCostBox[key].jamMulai = masterJamMulai
                if (!loadedCostBox[key].jamSelesai) loadedCostBox[key].jamSelesai = masterJamSelesai
                if (!loadedCostBox[key].orang) loadedCostBox[key].orang = masterJumlahOrang
              }
            })
            setCostBox(loadedCostBox)

            setJamMulai(masterJamMulai)
            setJamSelesai(masterJamSelesai)
            setJumlahOrang(masterJumlahOrang)
            setCatatan(rawChecklist.catatan || '')
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

  const getMpCostFromBox = (boxKey: string) => {
    const box = costBox[boxKey] || {}
    const start = box.jamMulai || ''
    const end = box.jamSelesai || ''
    const people = Number(box.orang) || 0
    const hours = getDurasiJam(start, end)
    return Math.round(hours * 89595 * people)
  }

  const handleCostBoxChange = (boxKey: string, field: string, val: string | number) => {
    const box = costBox[boxKey] || {}
    const nextBox = { ...box, [field]: val }
    setCostBox({ ...costBox, [boxKey]: nextBox })
  }

  const getOverhaulTotalMpCost = () => {
    return ['b1', 'b2', 'b3', 'b4', 'b5'].reduce((s, k) => s + getMpCostFromBox(k), 0)
  }

  const getTotalSparepartCost = () => {
    return spareparts.reduce((s, sp) => s + (sp.qty * sp.hargaSatuan), 0)
  }

  const handleChecklistChange = (key: string, type: 'judge' | 'komentar', val: string) => {
    const entry = checklist[key] || { judge: '', komentar: '' }
    let nextVal = val
    if (type === 'judge' && entry.judge === val) {
      nextVal = ''
    }
    const nextEntry = { ...entry, [type]: nextVal }
    setChecklist({ ...checklist, [key]: nextEntry })
  }

  const handleAddSparepart = () => {
    const newIdx = spareparts.length
    setSpareparts([...spareparts, { namaSparepart: '', qty: 1, hargaSatuan: 0 }])
    setActiveSpDropdown(newIdx)
  }

  const handleUpdateSparepart = (idx: number, field: keyof SparepartEntry, val: string | number) => {
    const next = [...spareparts]
    next[idx] = { ...next[idx], [field]: val } as any
    
    // Auto-fill harga jika nama cocok dengan katalog
    if (field === 'namaSparepart') {
      const match = katalogList.find((k) => k.nama.toLowerCase() === String(val).trim().toLowerCase())
      if (match && next[idx].hargaSatuan === 0) {
        next[idx].hargaSatuan = Number(match.hargaSatuan)
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
        showToast(`✨ "${item.namaSparepart}" berhasil tersimpan di Katalog! Besok cukup ketik huruf depannya saja!`, 'sukses')
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

  const handleSave = async (showNotification = true) => {
    if (!laporan) return false

    const payload = {
      checklist: {
        items: checklist,
        costBox,
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
      onSaved()
      return true
    } catch {
      showToast('Kesalahan jaringan saat menyimpan', 'error')
      return false
    }
  }

  const handleSign = async (role: string) => {
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
        onSaved()
      }
    } catch {
      showToast('Kesalahan jaringan', 'error')
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const MAX_SIZE = 5 * 1024 * 1024 // 5 MB

    Array.from(files).forEach((file) => {
      if (file.size > MAX_SIZE) {
        showToast(`Foto Checksheet "${file.name}" ditolak! Ukuran maksimal foto adalah 5 MB (Ukuran saat ini: ${(file.size / (1024 * 1024)).toFixed(2)} MB).`, 'error')
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setFoto((prev) => [...prev, reader.result as string])
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const handleRemoveFoto = (idx: number) => {
    setFoto(foto.filter((_, i) => i !== idx))
  }

  const handlePrintBMChuck = () => {
    if (!laporan) return
    const _totalSparepart = spareparts.reduce((s, sp) => s + (sp.qty * Number(sp.hargaSatuan)), 0)
    const _totalMpCost = (() => {
      if (!jamMulai || !jamSelesai) return 0
      const [hS, mS] = jamMulai.split(':').map(Number)
      const [hE, mE] = jamSelesai.split(':').map(Number)
      let diff = (hE * 60 + mE) - (hS * 60 + mS)
      if (diff < 0) diff += 24 * 60
      return Math.round((diff / 60) * 89595 * jumlahOrang)
    })()
    const _totalCostCombined = _totalMpCost + _totalSparepart
    const _approvals = laporan.checksheet?.approvals || []
    const _picSign = _approvals.find((a) => a.role === 'PIC')
    const _tlSign = _approvals.find((a) => a.role === 'TL')
    const _glSign = _approvals.find((a) => a.role === 'GL')
    const _admSign = _approvals.find((a) => a.role === 'ADM')

    const allItems = getAllBMChuckItems()
    const hasNG = allItems.some((item) => item.judge === 'X')
    const hasAny = allItems.some((item) => !!item.judge)
    const judgeVal = hasAny ? (hasNG ? 'NG' : 'OK') : ''

    const sigBoxHtml = (sign?: ApprovalEntry | null) =>
      sign?.signedAt
        ? `${sign.user?.signature ? `<div style="text-align:center;margin-bottom:4px"><img src="${sign.user.signature}" alt="TTD" style="max-height:45px;display:block;margin:0 auto;object-fit:contain;" /></div>` : ''}<b>${sign.user?.nama || 'Verified'}</b><br><span style="font-size:9px;color:#666">${new Date(sign.signedAt).toLocaleDateString('id-ID')}</span>`
        : `<span style="font-size:9px;color:#999">Belum TTD</span>`

    const itemRowsHtml = allItems.map(item => `
      <tr>
        <td style="border:1px solid #000;padding:2px 4px;text-align:center">${item.no}.</td>
        <td style="border:1px solid #000;padding:2px 4px">${item.label}</td>
        <td style="border:1px solid #000;padding:2px 4px">${item.standard}</td>
      </tr>
    `).join('')

    const itemHeaderColsHtml = allItems.map(item => `<th style="border:1px solid #000;padding:2px 1px">${item.no}</th>`).join('')

    const itemDataColsHtml = allItems.map(item => `
      <td style="border:1px solid #000;padding:2px;font-weight:bold;color:${item.judge === 'X' ? '#c00' : item.judge === 'O' ? '#006600' : '#000'}">
        ${item.judge}
      </td>
    `).join('')

    const itemEmptyColsHtml = allItems.map(() => `<td style="border:1px solid #000;padding:2px"></td>`).join('')

    let emptyRowsHtml = ''
    for (let r = 2; r <= 28; r++) {
      emptyRowsHtml += `<tr style="height:18px">
        <td style="border:1px solid #000;padding:2px">${r}</td>
        <td style="border:1px solid #000;padding:2px"></td>
        ${itemEmptyColsHtml}
        <td style="border:1px solid #000;padding:2px"></td>
        <td style="border:1px solid #000;padding:2px"></td>
        <td style="border:1px solid #000;padding:2px"></td>
      </tr>`
    }

    const sparepartRowsHtml = spareparts.length === 0
      ? `<tr><td colspan="5" style="text-align:center;color:#666;padding:8px">Tidak ada pemakaian sparepart.</td></tr>`
      : spareparts.map((sp, idx) => `
        <tr>
          <td style="border:1px solid #000;text-align:center;padding:4px">${idx + 1}</td>
          <td style="border:1px solid #000;padding:4px;font-weight:bold">${sp.namaSparepart}</td>
          <td style="border:1px solid #000;text-align:center;padding:4px">${sp.qty}</td>
          <td style="border:1px solid #000;text-align:right;padding:4px">Rp ${Number(sp.hargaSatuan).toLocaleString('id-ID')}</td>
          <td style="border:1px solid #000;text-align:right;padding:4px;font-weight:bold">Rp ${(sp.qty * Number(sp.hargaSatuan)).toLocaleString('id-ID')}</td>
        </tr>
      `).join('')

    const htmlContent = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8"/>
  <title>CHECK SHEET PEMERIKSAAN CHUCK - ${laporan.noMold}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 10px; color: #000; background: #fff; line-height: 1.2; }
    @page { size: A4 portrait; margin: 6mm 8mm; }
    .page { width: 100%; padding: 0; margin: 0; page-break-after: always; }
    .page:last-child { page-break-after: auto; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #000; padding: 3px 4px; }
    .lbl { font-weight: bold; background: #f0f0f0; }
  </style>
</head>
<body onload="window.print()">

  <!-- HALAMAN 1: CHECKSHEET CHUCK -->
  <div class="page">
    <table style="margin-bottom:4px">
      <tbody>
        <tr>
          <td style="width:22%;font-size:9px;font-weight:bold;vertical-align:top;padding:4px 6px">
            PT.SUGITY CREATIVES<br/>
            MOLD MAINTENANCE DEPT.
          </td>
          <td style="text-align:center;font-size:18px;font-weight:bold;letter-spacing:1px;padding:6px">
            CHECK SHEET PEMERIKSAAN CHUCK
          </td>
        </tr>
      </tbody>
    </table>

    <table style="margin-bottom:6px;font-size:10px">
      <thead>
        <tr style="font-weight:bold;background:#f0f0f0">
          <th style="width:15%;text-align:center">MOLD NO</th>
          <th style="width:35%;text-align:center">MOLD NAME</th>
          <th style="width:18%;text-align:center">MODEL</th>
          <th style="width:18%;text-align:center">CUSTOMER</th>
          <th style="width:14%;text-align:center">TON</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="text-align:center;font-weight:bold">${laporan.noMold}</td>
          <td style="text-align:center">${laporan.moldData?.part || laporan.part || '-'}</td>
          <td style="text-align:center">${laporan.moldData?.model || '-'}</td>
          <td style="text-align:center">${laporan.moldData?.customer || '-'}</td>
          <td style="text-align:center">${laporan.moldData?.tonase || '-'}</td>
        </tr>
      </tbody>
    </table>

    <table style="margin-bottom:6px">
      <tbody>
        <tr>
          <td style="width:42%;vertical-align:top;padding:4px">
            <img src="/images/chuck-diagram.png" alt="Chuck Diagram" style="width:100%;height:auto;display:block;margin-bottom:6px" />
            <div style="font-size:9px">
              <div style="font-weight:bold;margin-bottom:2px">NOTE :</div>
              <table style="font-size:9px">
                <tbody>
                  <tr>
                    <td style="font-weight:bold;width:15%">G</td>
                    <td style="width:35%">: Ganti</td>
                    <td style="font-weight:bold;width:15%">X</td>
                    <td style="width:35%">: NG</td>
                  </tr>
                  <tr>
                    <td style="font-weight:bold">R</td>
                    <td>: Repair</td>
                    <td style="font-weight:bold">O</td>
                    <td>: OK</td>
                  </tr>
                  <tr>
                    <td style="font-weight:bold">T/A</td>
                    <td colSpan="3">: Tdk Pakai</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </td>

          <td style="width:58%;vertical-align:top;padding:0">
            <table style="font-size:9.5px">
              <thead>
                <tr style="background:#f5f5f5">
                  <th style="width:10%;text-align:center">NO</th>
                  <th style="width:42%">ITEM</th>
                  <th style="width:48%">STANDART</th>
                </tr>
              </thead>
              <tbody>
                ${itemRowsHtml}
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>

    <table style="font-size:9px;text-align:center">
      <thead>
        <tr>
          <th rowSpan="2" style="width:28px">OH<br/>NO</th>
          <th rowSpan="2" style="width:58px">TANGGAL</th>
          <th colSpan="${allItems.length}">ITEM CHECK</th>
          <th rowSpan="2" style="width:40px">JUDGE</th>
          <th rowSpan="2">REMARK</th>
          <th rowSpan="2" style="width:48px">PIC</th>
        </tr>
        <tr>
          ${itemHeaderColsHtml}
        </tr>
      </thead>
      <tbody>
        <tr style="height:22px">
          <td>1</td>
          <td style="font-size:8.5px">${new Date(laporan.tanggal).toLocaleDateString('id-ID')}</td>
          ${itemDataColsHtml}
          <td style="font-weight:bold;color:${judgeVal === 'NG' ? '#c00' : '#006600'}">${judgeVal}</td>
          <td style="text-align:left">${catatan || ''}</td>
          <td>${laporan.pic.nama.split(' ')[0]}</td>
        </tr>
        ${emptyRowsHtml}
      </tbody>
    </table>
  </div>

  <!-- HALAMAN 2: SPAREPART, MAN POWER & APPROVAL -->
  <div class="page" style="padding-top:10px">
    <table style="margin-bottom:8px">
      <tbody>
        <tr>
          <td style="width:22%;font-size:9px;font-weight:bold;vertical-align:top;padding:4px 6px">
            PT.SUGITY CREATIVES<br/>
            MOLD MAINTENANCE DEPT.
          </td>
          <td style="text-align:center;padding:6px">
            <div style="font-size:16px;font-weight:bold">RINCIAN BIAYA & APPROVAL PEMERIKSAAN CHUCK</div>
            <div style="font-size:10px;color:#444;margin-top:2px">
              MOLD NO: <b>${laporan.noMold}</b> &nbsp;|&nbsp; PART: <b>${laporan.moldData?.part || laporan.part || '-'}</b> &nbsp;|&nbsp; TANGGAL: <b>${new Date(laporan.tanggal).toLocaleDateString('id-ID')}</b>
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <h3 style="font-size:11px;margin:12px 0 6px 0;color:#1e1b4b">F. PEMAKAIAN SPAREPART / ORDER SPARE PART</h3>
    <table style="font-size:10px;margin-bottom:14px">
      <thead>
        <tr style="background:#f0f0f0">
          <th style="width:36px;text-align:center">NO</th>
          <th>NAMA SPAREPART</th>
          <th style="width:70px;text-align:center">QTY</th>
          <th style="width:130px;text-align:right">HARGA SATUAN</th>
          <th style="width:140px;text-align:right">TOTAL BIAYA</th>
        </tr>
      </thead>
      <tbody>
        ${sparepartRowsHtml}
      </tbody>
    </table>

    <h3 style="font-size:11px;margin:12px 0 6px 0;color:#1e1b4b">RINGKASAN BIAYA PEMELIHARAAN (COST SUMMARY)</h3>
    <table style="font-size:10px;margin-bottom:14px">
      <tbody>
        <tr>
          <td class="lbl" style="width:70%">Biaya Man Power (M/P Cost)</td>
          <td style="text-align:right;font-weight:bold">Rp ${_totalMpCost.toLocaleString('id-ID')}</td>
        </tr>
        <tr>
          <td class="lbl">Biaya Pemakaian Sparepart</td>
          <td style="text-align:right;font-weight:bold">Rp ${_totalSparepart.toLocaleString('id-ID')}</td>
        </tr>
        <tr style="background:#e8e8e8;font-size:11px">
          <td class="lbl" style="font-size:11px">TOTAL BIAYA PEMELIHARAAN (TOTAL COST)</td>
          <td style="text-align:right;font-weight:bold;font-size:12px;color:#15803d">Rp ${_totalCostCombined.toLocaleString('id-ID')}</td>
        </tr>
      </tbody>
    </table>

    <div style="border:1px solid #000;padding:8px;min-height:50px;margin-bottom:20px;font-size:10px">
      <b>CATATAN TAMBAHAN / REMARK:</b>
      <div style="margin-top:4px;white-space:pre-wrap;color:#333">${catatan || '(Tidak ada catatan)'}</div>
    </div>

    <h3 style="font-size:11px;margin:12px 0 6px 0;color:#1e1b4b">LEMBAR APPROVAL & TANDA TANGAN</h3>
    <table style="font-size:10px">
      <thead>
        <tr style="background:#f0f0f0">
          <th style="width:25%">Disiapkan Oleh (Member PIC)</th>
          <th style="width:25%">Diperiksa Oleh (Team Leader)</th>
          <th style="width:25%">Disetujui Oleh (Group Leader)</th>
          <th style="width:25%">Diterima Oleh (ADM)</th>
        </tr>
      </thead>
      <tbody>
        <tr style="height:70px">
          <td style="vertical-align:bottom;text-align:center;padding:6px">${sigBoxHtml(_picSign)}</td>
          <td style="vertical-align:bottom;text-align:center;padding:6px">${sigBoxHtml(_tlSign)}</td>
          <td style="vertical-align:bottom;text-align:center;padding:6px">${sigBoxHtml(_glSign)}</td>
          <td style="vertical-align:bottom;text-align:center;padding:6px">${sigBoxHtml(_admSign)}</td>
        </tr>
      </tbody>
    </table>
  </div>

</body>
</html>`

    const win = window.open('', '_blank', 'width=1000,height=800')
    if (!win) {
      alert('Popup diblokir browser. Tolong izinkan popup untuk halaman ini.')
      return
    }
    win.document.write(htmlContent)
    win.document.close()
    win.focus()
  }

  const handlePrint = () => {
    if (!laporan) return

    if (isBMChuck) {
      handlePrintBMChuck()
      return
    }

    const _isOverhaul = laporan.jenis === 'OH_MOLD' || laporan.jenis === 'OH MOLD' || laporan.jenis?.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() === 'OHMOLD'
    const _totalSparepart = spareparts.reduce((s, sp) => s + (sp.qty * Number(sp.hargaSatuan)), 0)
    const _totalMpCost = _isOverhaul
      ? (['b1', 'b2', 'b3', 'b4', 'b5'] as const).reduce((s, k) => {
          const box = checklist[k] || {}
          const start = box.jamMulai || ''; const end = box.jamSelesai || ''
          const people = Number(box.orang) || 0
          if (!start || !end) return s
          const [hS, mS] = start.split(':').map(Number)
          const [hE, mE] = end.split(':').map(Number)
          let diff = (hE * 60 + mE) - (hS * 60 + mS)
          if (diff < 0) diff += 24 * 60
          return s + Math.round((diff / 60) * 89595 * people)
        }, 0)
      : (() => {
          if (!jamMulai || !jamSelesai) return 0
          const [hS, mS] = jamMulai.split(':').map(Number)
          const [hE, mE] = jamSelesai.split(':').map(Number)
          let diff = (hE * 60 + mE) - (hS * 60 + mS)
          if (diff < 0) diff += 24 * 60
          return Math.round((diff / 60) * 89595 * jumlahOrang)
        })()
    const _totalCostCombined = _totalMpCost + _totalSparepart

    const _approvals = laporan.checksheet?.approvals || []
    const _picSign = _approvals.find((a) => a.role === 'PIC')
    const _tlSign = _approvals.find((a) => a.role === 'TL')
    const _glSign = _approvals.find((a) => a.role === 'GL')
    const _admSign = _approvals.find((a) => a.role === 'ADM')

    let ohSectionARows = ''
    OH_SECTIONS_A.forEach((sec) => {
      sec.items.forEach((item, i) => {
        const key = `${sec.kode}|${i}`
        const val = checklist[key]?.judge || '-'
        const kom = checklist[key]?.komentar || '-'
        ohSectionARows += `<tr>
          <td style="text-align:center">${sec.kode}.${i+1}</td>
          <td>${item.label}</td><td>${item.metode}</td><td>${item.standar}</td>
          <td style="text-align:center;font-weight:bold;color:${val==='NG'?'red':'black'}">${val}</td>
          <td>${kom}</td>
        </tr>`
      })
    })

    let ohSectionEGRows = ''
    OH_SECTIONS_EG.forEach((sec) => {
      sec.items.forEach((item, i) => {
        const key = `${sec.kode}|${i}`
        const val = checklist[key]?.judge || '-'
        const kom = checklist[key]?.komentar || '-'
        ohSectionEGRows += `<tr>
          <td style="text-align:center">${sec.kode}.${i+1}</td>
          <td>${item.label}</td><td>${item.metode}</td><td>${item.standar}</td>
          <td style="text-align:center;font-weight:bold;color:${val==='NG'?'red':'black'}">${val}</td>
          <td>${kom}</td>
        </tr>`
      })
    })
    OH_SECTIONS_CDE.forEach((sec) => {
      sec.items.forEach((label, i) => {
        const key = `${sec.kode}|${i}`
        const val = checklist[key]?.judge || '-'
        const kom = checklist[key]?.komentar || '-'
        ohSectionEGRows += `<tr>
          <td style="text-align:center">${sec.kode}.${i+1}</td>
          <td>${label}</td><td>${sec.metodeCheck}</td><td>${sec.std}</td>
          <td style="text-align:center;font-weight:bold;color:${val==='NG'?'red':'black'}">${val}</td>
          <td>${kom}</td>
        </tr>`
      })
    })

    let cmRows = ''
    CM_CARD_FIELDS.forEach((label, idx) => {
      const key = `cm_${idx}`
      const val = checklist[key] !== undefined ? checklist[key] : (idx === 0 ? (laporan.info || '') : (idx === 2 ? (laporan.countermeasure || '') : ''))
      cmRows += `<tr><td class="lbl" style="width:35%">${label}</td><td style="white-space:pre-wrap">${val || '-'}</td></tr>`
    })
    cmRows += `<tr><td class="lbl">Hasil Verifikasi Akhir</td><td style="font-weight:bold">${checklist['cm_judge'] || '-'}</td></tr>`

    let spRows = spareparts.length === 0
      ? `<tr><td colspan="4" style="text-align:center;color:#666">Tidak ada pemakaian sparepart.</td></tr>`
      : spareparts.map(sp => `<tr>
          <td>${sp.namaSparepart}</td>
          <td style="text-align:center">${sp.qty}</td>
          <td style="text-align:right">Rp ${Number(sp.hargaSatuan).toLocaleString('id-ID')}</td>
          <td style="text-align:right">Rp ${(sp.qty * Number(sp.hargaSatuan)).toLocaleString('id-ID')}</td>
        </tr>`).join('')

    const sigBox = (sign?: ApprovalEntry | null) =>
      sign?.signedAt
        ? `${sign.user?.signature ? `<div style="text-align:center;margin-bottom:4px"><img src="${sign.user.signature}" alt="TTD" style="max-height:45px;display:block;margin:0 auto;object-fit:contain;" /></div>` : ''}<b>${sign.user?.nama || 'Verified'}</b><br><span style="font-size:10px;color:#666">${new Date(sign.signedAt).toLocaleDateString('id-ID')}</span>`
        : `<span style="font-size:10px;color:#999">Belum TTD</span>`

    const probText = checklist.cm_problem || laporan.info || ''
    const coreMatch = probText.match(/(?:before\s+core|core\s+before)\s*([\d.,]+\s*(?:l\/m(?:nt)?)?)/i) ||
                      probText.match(/core\s*[:=]?\s*([\d.,]+\s*(?:l\/m(?:nt)?)?)/i)
    const cavMatch = probText.match(/(?:before\s+cav(?:ity)?|cav(?:ity)?\s+before)\s*([\d.,]+\s*(?:l\/m(?:nt)?)?)/i) ||
                     probText.match(/cav(?:ity)?\s*[:=]?\s*([\d.,]+\s*(?:l\/m(?:nt)?)?)/i)

    const fmtVal = (v?: string | null) => {
      if (!v || v === '-' || v.trim() === '') return '-'
      const clean = v.trim()
      if (clean.toLowerCase().includes('l')) return clean
      return `${clean} L/mnt`
    }

    const scalingCoreBefore = coreMatch ? fmtVal(coreMatch[1]) : fmtVal(laporan.coreActual)
    const scalingCavBefore = cavMatch ? fmtVal(cavMatch[1]) : fmtVal(laporan.cavActual)

    const html = `<!DOCTYPE html>
<html lang="id"><head><meta charset="UTF-8"/>
<title>${_isOverhaul ? 'CHECKSHEET OVERHAUL MOLD' : 'CM CARD'} - ${laporan.noMold}</title>
<style>
  * { box-sizing:border-box; margin:0; padding:0; }
  body { font-family:Arial,sans-serif; font-size:11px; color:#000; background:#fff; padding:12mm 10mm; }
  h2 { text-align:center; font-size:14px; text-transform:uppercase; text-decoration:underline; margin-bottom:14px; }
  h3 { font-size:12px; margin:12px 0 5px 0; }
  table { width:100%; border-collapse:collapse; margin-bottom:12px; font-size:10.5px; }
  td,th { border:1px solid #333; padding:4px 6px; vertical-align:top; }
  th { background:#e8e8e8; font-weight:bold; text-align:center; }
  .lbl { font-weight:bold; background:#f5f5f5; }
  .summary-lbl { text-align:right; font-weight:bold; background:#f5f5f5; }
  @page { margin:14mm 10mm; }
</style>
</head><body>
<h2>${_isOverhaul ? 'DATA PEMERIKSAAN OVERHAUL MOLD' : `CM CARD (${laporan.jenis})`}</h2>
<table><tbody>
  <tr><td class="lbl">Nomor Mold</td><td>${laporan.noMold}</td><td class="lbl">Tanggal Kerja</td><td>${new Date(laporan.tanggal).toLocaleDateString('id-ID')}</td></tr>
  <tr><td class="lbl">Nama Part</td><td>${laporan.part || '-'}</td><td class="lbl">Shift / Factory</td><td>${laporan.shift || 'Nonshift'} / ${laporan.factory}</td></tr>
  <tr><td class="lbl">Jenis Laporan</td><td>${laporan.jenis}</td><td class="lbl">PIC Pembuat</td><td>${laporan.pic.nama}</td></tr>
</tbody></table>

${_isOverhaul ? `
<h3>A. PEMERIKSAAN UTAMA (Main Check)</h3>
<table>
  <thead><tr><th style="width:35px">No</th><th>Item Pemeriksaan</th><th style="width:90px">Metode</th><th style="width:110px">Standar</th><th style="width:50px">Judge</th><th style="width:120px">Comment</th></tr></thead>
  <tbody>${ohSectionARows}</tbody>
</table>
<h3>B. EJECTOR GROUP &amp; C/D/E SECTIONS</h3>
<table>
  <thead><tr><th style="width:35px">No</th><th>Item Pemeriksaan</th><th style="width:90px">Metode</th><th style="width:110px">Standar</th><th style="width:50px">Judge</th><th style="width:120px">Comment</th></tr></thead>
  <tbody>${ohSectionEGRows}</tbody>
</table>

<h3>C. HASIL VERIFIKASI COOLING CORE & CAVITY</h3>
<table>
  <thead>
    <tr style="background:#e8e8e8;font-weight:bold;text-align:center">
      <td>POSISI COOLING</td>
      <td>STANDAR DEBIT (L/MNT)</td>
      <td>BEFORE (L/MNT)</td>
      <td>AFTER / FINISHING (L/MNT)</td>
    </tr>
  </thead>
  <tbody>
    <tr style="text-align:center">
      <td style="font-weight:bold;text-align:left">Cooling Core</td>
      <td>${laporan.moldData?.coreStd ? `${laporan.moldData.coreStd} L/mnt` : '25 L/mnt'}</td>
      <td style="font-weight:bold;color:#006600">${scalingCoreBefore}</td>
      <td style="font-weight:bold;color:#006600">${checklist.core_after ? fmtVal(checklist.core_after) : scalingCoreBefore}</td>
    </tr>
    <tr style="text-align:center">
      <td style="font-weight:bold;text-align:left">Cooling Cavity</td>
      <td>${laporan.moldData?.cavStd ? `${laporan.moldData.cavStd} L/mnt` : '24.2 L/mnt'}</td>
      <td style="font-weight:bold;color:#006600">${scalingCavBefore}</td>
      <td style="font-weight:bold;color:#006600">${checklist.cav_after ? fmtVal(checklist.cav_after) : scalingCavBefore}</td>
    </tr>
  </tbody>
</table>

<h3>D. HASIL VERIFIKASI HEATER MOLD (OHM / Ω)</h3>
<table>
  <thead>
    <tr style="background:#e8e8e8;font-weight:bold;text-align:center">
      <td style="width:15%">NO HEATER</td>
      <td style="width:30%">STANDAR RESISTANSI (Ω)</td>
      <td style="width:27.5%">BEFORE (Ω)</td>
      <td style="width:27.5%">AFTER / FINISHING (Ω)</td>
    </tr>
  </thead>
  <tbody>
    ${(() => {
      const stdHeaters = Array.isArray(laporan.moldData?.heaterStd) ? laporan.moldData.heaterStd : []
      const actHeaters = Array.isArray(laporan.heaterActual) ? laporan.heaterActual : (laporan.heaterActual ? [laporan.heaterActual] : [])
      const afterHeaters = Array.isArray(checklist.heater_after) ? checklist.heater_after : []
      const count = Math.max(stdHeaters.length, actHeaters.length, 4)
      let rows = ''
      for (let i = 0; i < count; i++) {
        const stdVal = stdHeaters[i] !== undefined && stdHeaters[i] !== null ? `${stdHeaters[i]} Ω` : '-'
        const actVal = actHeaters[i] !== undefined && actHeaters[i] !== null && actHeaters[i] !== '' ? `${actHeaters[i]} Ω` : '-'
        const afterVal = afterHeaters[i] !== undefined && afterHeaters[i] !== null && afterHeaters[i] !== '' ? `${afterHeaters[i]} Ω` : actVal
        rows += `<tr style="text-align:center">
          <td style="font-weight:bold">H${i + 1}</td>
          <td>${stdVal}</td>
          <td style="font-weight:bold;color:${actVal !== '-' ? '#006600' : '#000'}">${actVal}</td>
          <td style="font-weight:bold;color:${afterVal !== '-' ? '#006600' : '#000'}">${afterVal}</td>
        </tr>`
      }
      return rows
    })()}
  </tbody>
</table>
` : `
<h3>INFORMASI PERBAIKAN CM CARD</h3>
<table><tbody>${cmRows}</tbody></table>

<h3>HASIL VERIFIKASI COOLING CORE & CAVITY</h3>
<table>
  <thead>
    <tr style="background:#e8e8e8;font-weight:bold;text-align:center">
      <td>POSISI COOLING</td>
      <td>STANDAR DEBIT (L/MNT)</td>
      <td>BEFORE SCALING (L/MNT)</td>
      <td>AFTER SCALING / FINISH (L/MNT)</td>
    </tr>
  </thead>
  <tbody>
    <tr style="text-align:center">
      <td style="font-weight:bold;text-align:left">Cooling Core</td>
      <td>${laporan.moldData?.coreStd ? `${laporan.moldData.coreStd} L/mnt` : '25 L/mnt'}</td>
      <td style="font-weight:bold;color:#006600">${scalingCoreBefore}</td>
      <td style="font-weight:bold;color:#006600">${checklist.core_after ? fmtVal(checklist.core_after) : scalingCoreBefore}</td>
    </tr>
    <tr style="text-align:center">
      <td style="font-weight:bold;text-align:left">Cooling Cavity</td>
      <td>${laporan.moldData?.cavStd ? `${laporan.moldData.cavStd} L/mnt` : '24.2 L/mnt'}</td>
      <td style="font-weight:bold;color:#006600">${scalingCavBefore}</td>
      <td style="font-weight:bold;color:#006600">${checklist.cav_after ? fmtVal(checklist.cav_after) : scalingCavBefore}</td>
    </tr>
  </tbody>
</table>

<h3>HASIL VERIFIKASI HEATER MOLD (OHM / Ω)</h3>
<table>
  <thead>
    <tr style="background:#e8e8e8;font-weight:bold;text-align:center">
      <td style="width:15%">NO HEATER</td>
      <td style="width:30%">STANDAR RESISTANSI (Ω)</td>
      <td style="width:27.5%">BEFORE MAINTENANCE (Ω)</td>
      <td style="width:27.5%">AFTER MAINTENANCE (Ω)</td>
    </tr>
  </thead>
  <tbody>
    ${(() => {
      const stdHeaters = Array.isArray(laporan.moldData?.heaterStd) ? laporan.moldData.heaterStd : []
      const actHeaters = Array.isArray(laporan.heaterActual) ? laporan.heaterActual : (laporan.heaterActual ? [laporan.heaterActual] : [])
      const afterHeaters = Array.isArray(checklist.heater_after) ? checklist.heater_after : []
      const count = Math.max(stdHeaters.length, actHeaters.length, 4)
      let rows = ''
      for (let i = 0; i < count; i++) {
        const stdVal = stdHeaters[i] !== undefined && stdHeaters[i] !== null ? `${stdHeaters[i]} Ω` : '-'
        const actVal = actHeaters[i] !== undefined && actHeaters[i] !== null && actHeaters[i] !== '' ? `${actHeaters[i]} Ω` : '-'
        const afterVal = afterHeaters[i] !== undefined && afterHeaters[i] !== null && afterHeaters[i] !== '' ? `${afterHeaters[i]} Ω` : actVal
        rows += `<tr style="text-align:center">
          <td style="font-weight:bold">H${i + 1}</td>
          <td>${stdVal}</td>
          <td style="font-weight:bold;color:${actVal !== '-' ? '#006600' : '#000'}">${actVal}</td>
          <td style="font-weight:bold;color:${afterVal !== '-' ? '#006600' : '#000'}">${afterVal}</td>
        </tr>`
      }
      return rows
    })()}
  </tbody>
</table>
`}

<div style="${laporan.jenis?.toUpperCase().includes('PM') ? 'page-break-before:always;padding-top:12px' : ''}">
  <h3>F. PEMAKAIAN SPAREPART / ORDER SPARE PART</h3>
  <table>
    <thead><tr><th>Nama Sparepart</th><th style="width:60px">Qty</th><th style="width:140px">Harga Satuan</th><th style="width:140px">Total Biaya</th></tr></thead>
    <tbody>${spRows}</tbody>
  </table>

  <h3>RINGKASAN BIAYA PEMELIHARAAN (COST SUMMARY)</h3>
  <table>
    <thead><tr><th>Nama PIC</th><th>Shift</th><th>Tanggal</th><th>Jam Mulai</th><th>Jam Selesai</th><th>Total Orang</th><th style="text-align:right">Total Cost</th></tr></thead>
    <tbody><tr>
      <td>${laporan.pic.nama}</td>
      <td style="text-align:center">${laporan.shift || '-'}</td>
      <td style="text-align:center">${new Date(laporan.tanggal).toLocaleDateString('id-ID')}</td>
      <td style="text-align:center">${jamMulai || '-'}</td>
      <td style="text-align:center">${jamSelesai || '-'}</td>
      <td style="text-align:center">${jumlahOrang}</td>
      <td style="text-align:right">Rp ${_totalMpCost.toLocaleString('id-ID')}</td>
    </tr></tbody>
  </table>

  <table><tbody>
    <tr><td class="summary-lbl" style="width:75%">Total Sparepart Cost</td><td style="text-align:right">Rp ${_totalSparepart.toLocaleString('id-ID')}</td></tr>
    <tr><td class="summary-lbl">Total Man Power Cost</td><td style="text-align:right">Rp ${_totalMpCost.toLocaleString('id-ID')}</td></tr>
    <tr style="background:#e8e8e8"><td class="summary-lbl" style="font-size:12px">TOTAL BIAYA PEMELIHARAAN</td><td style="text-align:right;font-weight:bold;font-size:12px">Rp ${_totalCostCombined.toLocaleString('id-ID')}</td></tr>
  </tbody></table>

  <div style="border:1px solid #333;padding:8px;min-height:55px;margin-bottom:14px">
    <b>Catatan Tambahan / Remark:</b>
    <div style="margin-top:4px;white-space:pre-wrap">${catatan || '(Tidak ada catatan)'}</div>
  </div>

  <h3>LEMBAR APPROVAL & TANDA TANGAN</h3>
  <table>
    <thead><tr>
      <th style="width:25%">Disiapkan Oleh (Member PIC)</th>
      <th style="width:25%">Diperiksa Oleh (Team Leader)</th>
      <th style="width:25%">Disetujui Oleh (Group Leader)</th>
      <th style="width:25%">Diterima Oleh (ADM)</th>
    </tr></thead>
    <tbody><tr style="height:60px">
      <td style="vertical-align:bottom">${sigBox(_picSign)}</td>
      <td style="vertical-align:bottom">${sigBox(_tlSign)}</td>
      <td style="vertical-align:bottom">${sigBox(_glSign)}</td>
      <td style="vertical-align:bottom">${sigBox(_admSign)}</td>
    </tr></tbody>
  </table>
</div>
</body></html>`

    const win = window.open('', '_blank', 'width=900,height=700')
    if (!win) { alert('Popup diblokir browser. Izinkan popup untuk halaman ini.'); return }
    win.document.write(html)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print(); win.close() }, 400)
  }

  if (loading) {
    return (
      <div className="cs-overlay no-print">
        <div className="cs-box" style={{ padding: '24px', textAlign: 'center' }}>
          Memuat data checksheet...
        </div>
      </div>
    )
  }

  if (!laporan) {
    return (
      <div className="cs-overlay no-print">
        <div className="cs-box" style={{ padding: '24px', textAlign: 'center' }}>
          Laporan tidak ditemukan.
          <button onClick={onClose} style={{ marginTop: '12px' }}>Tutup</button>
        </div>
      </div>
    )
  }

  const isOverhaul = laporan.jenis === 'OH_MOLD' || laporan.jenis === 'OH MOLD' || laporan.jenis?.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() === 'OHMOLD'
  const isBMChuck = laporan.jenis === 'BM CHUCK' || laporan.jenis === 'BM_CHUCK'
  const totalSparepart = getTotalSparepartCost()
  const totalMpCost = isOverhaul ? getOverhaulTotalMpCost() : Math.round(getDurasiJam() * 89595 * jumlahOrang)
  const totalCostCombined = totalMpCost + totalSparepart

  const getAllBMChuckItems = () => {
    const custom = Array.isArray(checklist.bm_chuck_custom) ? checklist.bm_chuck_custom : []
    const std = BM_CHUCK_ITEMS.map((item, i) => ({
      no: i + 1,
      label: item.label,
      standard: item.standard,
      judge: checklist[`bm_chuck|${i}`]?.judge || '',
      isCustom: false,
      customIndex: -1,
    }))
    const cust = custom.map((item: any, i: number) => ({
      no: BM_CHUCK_ITEMS.length + i + 1,
      label: item.label || '',
      standard: item.standard || '',
      judge: item.judge || '',
      isCustom: true,
      customIndex: i,
    }))
    return [...std, ...cust]
  }

  const handleAddCustomChuckItem = () => {
    const currentCustom = Array.isArray(checklist.bm_chuck_custom) ? [...checklist.bm_chuck_custom] : []
    setChecklist({
      ...checklist,
      bm_chuck_custom: [...currentCustom, { label: '', standard: '', judge: '' }]
    })
  }

  const handleUpdateCustomChuckItem = (index: number, field: string, value: string) => {
    const currentCustom = Array.isArray(checklist.bm_chuck_custom) ? [...checklist.bm_chuck_custom] : []
    currentCustom[index] = { ...currentCustom[index], [field]: value }
    setChecklist({
      ...checklist,
      bm_chuck_custom: currentCustom
    })
  }

  const handleRemoveCustomChuckItem = (index: number) => {
    const currentCustom = Array.isArray(checklist.bm_chuck_custom) ? [...checklist.bm_chuck_custom] : []
    currentCustom.splice(index, 1)
    setChecklist({
      ...checklist,
      bm_chuck_custom: currentCustom
    })
  }

  const approvals = laporan.checksheet?.approvals || []
  const picSign = approvals.find((a) => a.role === 'PIC')
  const tlSign = approvals.find((a) => a.role === 'TL')
  const glSign = approvals.find((a) => a.role === 'GL')
  const admSign = approvals.find((a) => a.role === 'ADM')

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

  // Cost Box renderer - exact replication of cb-wrap and cb-jam-grid
  const renderCostBoxEditor = (costKey: string) => {
    const box = checklist[costKey] || {}
    const subMpCost = getMpCostFromBox(costKey)

    return (
      <div className="cb-wrap">
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--teks-redup)', marginBottom: '4px' }}>
            M/P Cost ({costKey})
          </div>
          <div className="cb-jam-grid">
            <div>
              <label className="kecil" style={{ margin: '0 0 3px', fontSize: '10.5px' }}>Jam Mulai</label>
              <input
                type="time"
                value={box.jamMulai || ''}
                onChange={(e) => handleCostBoxChange(costKey, 'jamMulai', e.target.value)}
                style={{ padding: '6px' }}
              />
            </div>
            <div>
              <label className="kecil" style={{ margin: '0 0 3px', fontSize: '10.5px' }}>Jam Selesai</label>
              <input
                type="time"
                value={box.jamSelesai || ''}
                onChange={(e) => handleCostBoxChange(costKey, 'jamSelesai', e.target.value)}
                style={{ padding: '6px' }}
              />
            </div>
            <div>
              <label className="kecil" style={{ margin: '0 0 3px', fontSize: '10.5px' }}>Jml Orang</label>
              <input
                type="number"
                min="0"
                value={box.orang || ''}
                onChange={(e) => handleCostBoxChange(costKey, 'orang', parseInt(e.target.value, 10) || 0)}
                style={{ padding: '6px' }}
              />
            </div>
          </div>
          <div style={{ marginTop: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--hijau-tua)' }}>
            = Rp <span>{subMpCost.toLocaleString('id-ID')}</span>
          </div>
        </div>
        <div>
          <label className="kecil" style={{ margin: '0 0 3px', fontSize: '10.5px' }}>PIC</label>
          <input
            type="text"
            placeholder="Nama PIC"
            value={box.pic || ''}
            onChange={(e) => handleCostBoxChange(costKey, 'pic', e.target.value)}
            style={{ padding: '6px', marginBottom: '6px' }}
          />
          <label className="kecil" style={{ margin: '0 0 3px', fontSize: '10.5px' }}>Tgl</label>
          <input
            type="date"
            value={box.tgl || ''}
            onChange={(e) => handleCostBoxChange(costKey, 'tgl', e.target.value)}
            style={{ padding: '6px' }}
          />
        </div>
      </div>
    )
  }

  const renderChecklistTable = (secItems: any[], secKode: string) => {
    return (
      <div className="cs-table-scroll">
        <table className="cs-check-tbl">
          <thead>
            <tr>
              <th className="no">No</th>
              <th className="item">Item</th>
              <th style={{ width: '110px' }}>Metode</th>
              <th style={{ width: '130px' }}>Standard</th>
              <th style={{ width: '90px' }}>Judge</th>
              <th style={{ width: '120px' }}>Comment</th>
            </tr>
          </thead>
          <tbody>
            {secItems.map((item, idx) => {
              const key = `${secKode}|${idx}`
              const val = checklist[key]?.judge || ''
              const komentar = checklist[key]?.komentar || ''

              return (
                <tr key={idx}>
                  <td className="no">{idx + 1}</td>
                  <td className="item">{item.label}</td>
                  <td style={{ fontSize: '11.5px', color: 'var(--teks-redup)' }}>{item.metode || '-'}</td>
                  <td style={{ fontSize: '11.5px', color: 'var(--teks-redup)' }}>{item.standar || '-'}</td>
                  <td>
                    <div className="cs-okng" style={{ flexDirection: 'column', gap: '2px', alignItems: 'flex-start' }}>
                      <label
                        style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                        onClick={(e) => {
                          if (val === 'OK') {
                            e.preventDefault()
                            handleChecklistChange(key, 'judge', '')
                          }
                        }}
                      >
                        <input
                          type="radio"
                          name={`judge_${secKode}_${idx}`}
                          value="OK"
                          checked={val === 'OK'}
                          onClick={(e) => {
                            if (val === 'OK') {
                              e.preventDefault()
                              e.stopPropagation()
                              handleChecklistChange(key, 'judge', '')
                            }
                          }}
                          onChange={() => handleChecklistChange(key, 'judge', 'OK')}
                        /> OK
                      </label>
                      <label
                        style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                        onClick={(e) => {
                          if (val === 'NG') {
                            e.preventDefault()
                            handleChecklistChange(key, 'judge', '')
                          }
                        }}
                      >
                        <input
                          type="radio"
                          name={`judge_${secKode}_${idx}`}
                          value="NG"
                          checked={val === 'NG'}
                          onClick={(e) => {
                            if (val === 'NG') {
                              e.preventDefault()
                              e.stopPropagation()
                              handleChecklistChange(key, 'judge', '')
                            }
                          }}
                          onChange={() => handleChecklistChange(key, 'judge', 'NG')}
                        /> NG
                      </label>
                    </div>
                  </td>
                  <td>
                    <input
                      type="text"
                      className="cs-komentar-item"
                      placeholder="-"
                      value={komentar}
                      onChange={(e) => handleChecklistChange(key, 'komentar', e.target.value)}
                      style={{ width: '100%', fontSize: '12px', padding: '5px' }}
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

  // Header helpers corresponding to renderHeaderOverhaul and renderHeaderInfo
  const renderHeaderOverhaulReact = () => {
    const md = laporan.moldData || {
      mc: null,
      tonase: null,
      customer: null,
      model: null,
      coreStd: null,
      cavStd: null,
      shotCycle: null,
      shotMonth: null,
    }
    const tglObj = laporan.tanggal ? new Date(laporan.tanggal) : new Date()

    return (
      <table className="cs-header-tbl">
        <tbody>
          <tr>
            <td className="k">Plan Date</td>
            <td>{laporan.tanggal || '-'}</td>
            <td className="k">Mold Name</td>
            <td colSpan={3}>{laporan.part || '-'}</td>
          </tr>
          <tr>
            <td className="k">Customer</td>
            <td>{md.customer || '-'}</td>
            <td className="k">Model</td>
            <td>{md.model || '-'}</td>
            <td className="k">Fact / Shift</td>
            <td>{laporan.factory || '-'} / {laporan.shift || '-'}</td>
          </tr>
          <tr>
            <td className="k">Prod. Shot</td>
            <td>{md.shotMonth || '-'}</td>
            <td className="k">OH Shot</td>
            <td>{md.shotCycle || '-'}</td>
            <td className="k">Mold No / Tonase</td>
            <td>{laporan.noMold || '-'} / {md.tonase || '-'}</td>
          </tr>
          <tr>
            <td className="k">Tanggal / Bulan / Tahun</td>
            <td colSpan={5}>
              {tglObj.getDate()} / {tglObj.getMonth() + 1} / {tglObj.getFullYear()}
            </td>
          </tr>
          <tr style={{ background: '#f7f4ea' }}>
            <td className="k">Spare Part Cost (a)</td>
            <td><b>Rp {totalSparepart.toLocaleString('id-ID')}</b></td>
            <td className="k">M/P Cost (b)</td>
            <td><b>Rp {totalMpCost.toLocaleString('id-ID')}</b></td>
            <td className="k">Total Cost (c = a+b)</td>
            <td><b>Rp {totalCostCombined.toLocaleString('id-ID')}</b></td>
          </tr>
        </tbody>
      </table>
    )
  }

  const renderHeaderInfoReact = () => {
    const md = laporan.moldData || {
      mc: null,
      tonase: null,
      customer: null,
      model: null,
      coreStd: null,
      cavStd: null,
      shotCycle: null,
      shotMonth: null,
    }

    return (
      <table className="cs-header-tbl">
        <tbody>
          <tr>
            <td className="k">Mold No.</td>
            <td>{laporan.noMold || '-'}</td>
            <td className="k">Model</td>
            <td>{md.model || '-'}</td>
          </tr>
          <tr>
            <td className="k">Nama Part</td>
            <td colSpan={3}>{laporan.part || '-'}</td>
          </tr>
          <tr>
            <td className="k">Customer</td>
            <td>{md.customer || '-'}</td>
            <td className="k">Tonase</td>
            <td>{md.tonase || '-'}</td>
          </tr>
          <tr>
            <td className="k">Factory</td>
            <td>{laporan.factory || '-'}</td>
            <td className="k">Shift</td>
            <td>{laporan.shift || '-'}</td>
          </tr>
          <tr>
            <td className="k">Tanggal Laporan</td>
            <td>{laporan.tanggal || '-'}</td>
            <td className="k">PIC Laporan</td>
            <td>{laporan.pic.nama || '-'}</td>
          </tr>
        </tbody>
      </table>
    )
  }

  return (
    <>
      {/* ===== TAB SCREEN / EDITOR IN MODAL OVERLAY ===== */}
      <div className="cs-overlay no-print" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
        <div className="cs-box">
          <div className="cs-topbar">
            <b>{isOverhaul ? 'Data Pemeriksaan Overhaul Mold' : isBMChuck ? 'Check Sheet Pemeriksaan Chuck' : `CM Card (${laporan.jenis})`}</b>
            <div className="cs-aksi">
              <button type="button" className="cs-btn-print" onClick={handlePrint}>🖨️ Cetak</button>
              <button type="button" style={{ background: 'var(--hijau-bg)', color: 'var(--hijau-tua)' }} onClick={() => handleSave(true)}>💾 Simpan</button>
              <button type="button" className="cs-btn-tutup" onClick={onClose}>✕ Tutup</button>
            </div>
          </div>

          <div className="cs-body" style={{ maxHeight: 'calc(100vh - 120px)', overflowY: 'auto' }}>
            <div className="cs-title-utama">
              PT. SUGITY CREATIVES &mdash; {isOverhaul ? 'DATA PEMERIKSAAN OVERHAUL MOLD' : isBMChuck ? 'CHECK SHEET PEMERIKSAAN CHUCK' : `CM CARD (${laporan.jenis})`}
            </div>
            {/* EXACT HEADER TABLE REPLICATION */}
            {isOverhaul ? renderHeaderOverhaulReact() : renderHeaderInfoReact()}

            {isOverhaul ? (
              /* =======================================
                 OVERHAUL CHECKSHEET WORKPLACE TEMPLATE
                 ======================================= */
              <>
                {OH_SECTIONS_A.map((sec) => (
                  <div key={sec.kode} style={{ marginTop: '16px' }}>
                    <div className="cs-section-title">{sec.judul}</div>
                    {renderChecklistTable(sec.items, sec.kode)}
                  </div>
                ))}

                <div className="cs-section-title" style={{ marginTop: '20px' }}>M/P Cost &mdash; Section A (Main Check)</div>
                {renderCostBoxEditor('b1')}

                {OH_SECTIONS_EG.map((sec) => (
                  <div key={sec.kode} style={{ marginTop: '16px' }}>
                    <div className="cs-section-title">B. EJECTOR GROUP &mdash; {sec.judul}</div>
                    {renderChecklistTable(sec.items, sec.kode)}
                  </div>
                ))}

                <div className="cs-section-title" style={{ marginTop: '20px' }}>M/P Cost &mdash; Section B (Ejector Group)</div>
                {renderCostBoxEditor('b2')}

                {OH_SECTIONS_CDE.map((sec) => {
                  const PilihanCde = sec.jenisPilihan
                  const dipilih = checklist['jenis_' + sec.kode]?.judge || ''

                  return (
                    <div key={sec.kode} style={{ marginTop: '16px' }}>
                      <div className="cs-section-title">{sec.judul}</div>
                      
                      {PilihanCde && (
                        <div style={{ display: 'flex', gap: '14px', marginBottom: '8px', flexWrap: 'wrap' }}>
                          {PilihanCde.map((j) => (
                            <label key={j} style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <input
                                type="checkbox"
                                checked={dipilih === j}
                                onChange={() => handleChecklistChange('jenis_' + sec.kode, 'judge', j)}
                              /> {j}
                            </label>
                          ))}
                        </div>
                      )}

                      <div className="cs-info-row"><b>STD:</b>&nbsp;{sec.std}</div>
                      <div className="cs-info-row"><b>Metode Check:</b>&nbsp;{sec.metodeCheck}</div>
{renderChecklistTable(sec.items.map((label) => ({ label, metode: '-', standar: '-' })), sec.kode)}
                      {renderCostBoxEditor(sec.costLabel)}
                    </div>
                  )
                })}
              </>
            ) : isBMChuck ? (
              /* =======================================
                 BM CHUCK CHECKSHEET EDITOR
                 ======================================= */
              (() => {
                const allItems = getAllBMChuckItems()
                const hasNG = allItems.some((item) => item.judge === 'X')
                const hasAny = allItems.some((item) => !!item.judge)

                return (
                  <div style={{ marginTop: '16px' }}>
                    {/* 1. Info Spesifikasi Mold */}
                    <div style={{ background: '#f5f3ff', border: '2px solid #ddd6fe', borderRadius: '10px', padding: '14px 16px', marginBottom: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
                      <div style={{ fontWeight: 800, fontSize: '14px', color: '#6d28d9', marginBottom: '12px' }}>⚙️ CHECK SHEET PEMERIKSAAN CHUCK</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', fontSize: '12px' }}>
                        {[
                          { label: 'MOLD NO', val: laporan.noMold },
                          { label: 'MOLD NAME', val: laporan.moldData?.part || laporan.part || '-' },
                          { label: 'MODEL', val: laporan.moldData?.model || '-' },
                          { label: 'CUSTOMER', val: laporan.moldData?.customer || '-' },
                          { label: 'TON', val: laporan.moldData?.tonase || '-' },
                        ].map(({ label, val }) => (
                          <div key={label} style={{ background: '#fff', borderRadius: '6px', padding: '8px 10px', border: '1px solid #ddd6fe' }}>
                            <div style={{ fontSize: '10px', color: '#7c3aed', fontWeight: 700, marginBottom: '2px' }}>{label}</div>
                            <div style={{ fontWeight: 600, color: '#1e1b4b', wordBreak: 'break-word' }}>{val}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 2. Diagram Chuck & NOTE Legend (DI ATAS FORM PENGISIAN) */}
                    <div style={{ background: '#fff', border: '2px solid #ddd6fe', borderRadius: '10px', padding: '14px 16px', marginBottom: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
                      <div style={{ fontWeight: 700, fontSize: '13px', color: '#4c1d95', marginBottom: '10px' }}>🖼️ Diagram Chuck & Legend Status</div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {/* Diagram Image */}
                        <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                          <img
                            src="/images/chuck-diagram.png"
                            alt="Chuck Diagram"
                            style={{ width: '100%', maxWidth: '600px', height: 'auto', display: 'inline-block', borderRadius: '6px' }}
                          />
                        </div>

                        {/* Legend Status NOTE */}
                        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 12px' }}>
                          <div style={{ fontWeight: 700, fontSize: '11px', color: '#475569', marginBottom: '6px' }}>NOTE / KETERANGAN SIMBOL:</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '12px' }}>
                            <span style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0', padding: '4px 10px', borderRadius: '6px', fontWeight: 700 }}>O : OK</span>
                            <span style={{ background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca', padding: '4px 10px', borderRadius: '6px', fontWeight: 700 }}>X : NG</span>
                            <span style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', padding: '4px 10px', borderRadius: '6px', fontWeight: 700 }}>G : Ganti</span>
                            <span style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', padding: '4px 10px', borderRadius: '6px', fontWeight: 700 }}>R : Repair</span>
                            <span style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '4px 10px', borderRadius: '6px', fontWeight: 700 }}>T/A : Tdk Pakai</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 3. Form Pengisian: Komponen + Status + Dynamic Custom Items */}
                    <div style={{ background: '#fff', border: '2px solid #ddd6fe', borderRadius: '10px', padding: '14px 16px', marginBottom: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ fontWeight: 700, fontSize: '13px', color: '#4c1d95' }}>📋 Status Pemeriksaan Komponen (Total: {allItems.length} Item)</div>
                        <button
                          type="button"
                          onClick={handleAddCustomChuckItem}
                          style={{
                            background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)', color: '#fff', border: 'none',
                            padding: '6px 12px', borderRadius: '6px', fontWeight: 700, fontSize: '12px', cursor: 'pointer',
                            boxShadow: '0 2px 6px rgba(109,40,217,0.25)', display: 'flex', alignItems: 'center', gap: '4px'
                          }}
                        >
                          ➕ Tambah Komponen Custom (Item {allItems.length + 1})
                        </button>
                      </div>
                      
                      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                        <table style={{ width: '100%', minWidth: '340px', borderCollapse: 'collapse', fontSize: '13px' }}>
                          <thead>
                            <tr style={{ background: '#ede9fe' }}>
                              <th style={{ border: '1px solid #c4b5fd', padding: '8px 6px', textAlign: 'center', width: '36px', color: '#4c1d95' }}>NO</th>
                              <th style={{ border: '1px solid #c4b5fd', padding: '8px', textAlign: 'left', color: '#4c1d95' }}>ITEM</th>
                              <th style={{ border: '1px solid #c4b5fd', padding: '8px', textAlign: 'left', color: '#4c1d95' }}>STANDAR</th>
                              <th style={{ border: '1px solid #c4b5fd', padding: '8px', textAlign: 'center', width: '110px', color: '#4c1d95' }}>STATUS</th>
                              <th style={{ border: '1px solid #c4b5fd', padding: '8px', textAlign: 'center', width: '50px', color: '#4c1d95' }}>AKSI</th>
                            </tr>
                          </thead>
                          <tbody>
                            {allItems.map((item) => {
                              const val = item.judge
                              const bgColor =
                                val === 'O' ? '#dcfce7' :
                                val === 'X' ? '#fee2e2' :
                                val === 'G' ? '#fef3c7' :
                                val === 'R' ? '#e0f2fe' :
                                val === 'T/A' ? '#f1f5f9' : '#fff'
                              return (
                                <tr key={item.no} style={{ background: item.no % 2 === 0 ? '#faf5ff' : '#fff' }}>
                                  <td style={{ border: '1px solid #e2e8f0', padding: '8px 6px', textAlign: 'center', fontWeight: 700, color: '#6d28d9' }}>{item.no}</td>
                                  <td style={{ border: '1px solid #e2e8f0', padding: '6px 8px', fontWeight: 600 }}>
                                    {item.isCustom ? (
                                      <input
                                        type="text"
                                        placeholder={`Nama Komponen ${item.no}...`}
                                        value={item.label}
                                        onChange={(e) => handleUpdateCustomChuckItem(item.customIndex, 'label', e.target.value)}
                                        style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #a78bfa', fontSize: '13px', fontWeight: 600 }}
                                      />
                                    ) : (
                                      item.label
                                    )}
                                  </td>
                                  <td style={{ border: '1px solid #e2e8f0', padding: '6px 8px', color: '#64748b', fontSize: '12px' }}>
                                    {item.isCustom ? (
                                      <input
                                        type="text"
                                        placeholder="Standar..."
                                        value={item.standard}
                                        onChange={(e) => handleUpdateCustomChuckItem(item.customIndex, 'standard', e.target.value)}
                                        style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                                      />
                                    ) : (
                                      item.standard
                                    )}
                                  </td>
                                  <td style={{ border: '1px solid #e2e8f0', padding: '4px', textAlign: 'center', background: bgColor }}>
                                    <select
                                      value={val}
                                      onChange={(e) => {
                                        if (item.isCustom) {
                                          handleUpdateCustomChuckItem(item.customIndex, 'judge', e.target.value)
                                        } else {
                                          handleChecklistChange(`bm_chuck|${item.no - 1}`, 'judge', e.target.value)
                                        }
                                      }}
                                      style={{
                                        width: '100%', minHeight: '38px', padding: '6px 4px', border: '1px solid #c4b5fd',
                                        borderRadius: '6px', fontWeight: 700, fontSize: '13px',
                                        background: 'transparent', cursor: 'pointer', textAlign: 'center',
                                        color: val === 'O' ? '#15803d' : val === 'X' ? '#b91c1c' : val === 'G' ? '#b45309' : val === 'R' ? '#0369a1' : '#334155'
                                      }}
                                    >
                                      <option value="">— Pilih —</option>
                                      <option value="O">O (OK)</option>
                                      <option value="X">X (NG)</option>
                                      <option value="G">G (Ganti)</option>
                                      <option value="R">R (Repair)</option>
                                      <option value="T/A">T/A (Tdk Pakai)</option>
                                    </select>
                                  </td>
                                  <td style={{ border: '1px solid #e2e8f0', padding: '4px', textAlign: 'center' }}>
                                    {item.isCustom ? (
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveCustomChuckItem(item.customIndex)}
                                        style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '12px' }}
                                        title="Hapus komponen ini"
                                      >
                                        🗑️
                                      </button>
                                    ) : (
                                      <span style={{ color: '#cbd5e1', fontSize: '11px' }}>-</span>
                                    )}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>

                      <button
                        type="button"
                        onClick={handleAddCustomChuckItem}
                        style={{
                          marginTop: '12px', width: '100%', padding: '10px', background: '#f5f3ff', border: '1px dashed #7c3aed',
                          borderRadius: '6px', color: '#6d28d9', fontWeight: 700, fontSize: '13px', cursor: 'pointer'
                        }}
                      >
                        ➕ Tambah Komponen Chuck Baru (Item {allItems.length + 1})
                      </button>

                      {/* JUDGE + REMARK */}
                      <div style={{ marginTop: '14px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <div style={{ flex: '1', minWidth: '140px' }}>
                          <label style={{ fontSize: '11px', fontWeight: 700, color: '#6d28d9', display: 'block', marginBottom: '4px' }}>JUDGE KESELURUHAN</label>
                          <div style={{
                            padding: '10px 14px', borderRadius: '8px', fontWeight: 800, fontSize: '15px', textAlign: 'center',
                            background: !hasAny ? '#f1f5f9' : (hasNG ? '#fee2e2' : '#dcfce7'),
                            color: !hasAny ? '#94a3b8' : (hasNG ? '#b91c1c' : '#15803d'),
                            border: '1px solid #e2e8f0'
                          }}>
                            {!hasAny ? '—' : (hasNG ? '❌ NG' : '✅ OK')}
                          </div>
                        </div>
                        <div style={{ flex: '2', minWidth: '200px' }}>
                          <label style={{ fontSize: '11px', fontWeight: 700, color: '#6d28d9', display: 'block', marginBottom: '4px' }}>REMARK / CATATAN</label>
                          <input
                            type="text"
                            placeholder="Ketik catatan / keterangan..."
                            value={catatan || ''}
                            onChange={(e) => setCatatan(e.target.value)}
                            style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd6fe', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' as any }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })()

            ) : (
              <>
                <div className="cs-section-title" style={{ marginTop: '16px' }}>Informasi Perbaikan</div>
                {CM_CARD_FIELDS.map((label, idx) => {
                  const key = `cm_${idx}`
                  const val = checklist[key] !== undefined ? checklist[key] : (idx === 0 ? (laporan.info || '') : (idx === 2 ? (laporan.countermeasure || '') : ''))

                  return (
                    <div key={idx} style={{ marginTop: '12px' }}>
                      <label className="kecil" style={{ fontWeight: 'bold' }}>{label}</label>
                      <textarea
                        className="cs-catatan-field cm-field"
                        rows={2}
                        value={val}
                        onChange={(e) => setChecklist({ ...checklist, [key]: e.target.value })}
                        style={{ width: '100%', marginTop: '4px' }}
                      />
                    </div>
                  )
                })}

                <div style={{ marginTop: '18px', borderTop: '1px dashed var(--garis)', paddingTop: '14px' }}>
                  <div className="cs-section-title" style={{ fontSize: '13px' }}>Hasil Verifikasi</div>
                  <div className="cs-okng" style={{ justifyContent: 'flex-start', gap: '20px', padding: '8px 0' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input
                        type="radio"
                        name="cm_judge"
                        value="OK"
                        checked={checklist['cm_judge'] === 'OK'}
                        onChange={() => handleChecklistChange('cm_judge', 'judge', 'OK')}
                      /> OK &mdash; Problem Selesai
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input
                        type="radio"
                        name="cm_judge"
                        value="NG"
                        checked={checklist['cm_judge'] === 'NG'}
                        onChange={() => handleChecklistChange('cm_judge', 'judge', 'NG')}
                      /> NG &mdash; Perlu Tindak Lanjut
                    </label>
                  </div>
                </div>

                <div style={{ marginTop: '18px', borderTop: '1px dashed var(--garis)', paddingTop: '14px' }}>
                  <div className="cs-section-title" style={{ fontSize: '13px' }}>Jam Kerja & PIC Pembantu</div>
                  <div className="baris3">
                    <div>
                      <label className="kecil">Jam Mulai</label>
                      <input type="time" value={jamMulai} onChange={(e) => setJamMulai(e.target.value)} />
                    </div>
                    <div>
                      <label className="kecil">Jam Selesai</label>
                      <input type="time" value={jamSelesai} onChange={(e) => setJamSelesai(e.target.value)} />
                    </div>
                    <div>
                      <label className="kecil">Jumlah Orang</label>
                      <input type="number" min="1" value={jumlahOrang} onChange={(e) => setJumlahOrang(parseInt(e.target.value, 10) || 1)} />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* SPAREPARTS SECTION WITH INTERACTIVE CATALOG AUTOCOMPLETE */}
            <div style={{ marginTop: '20px' }}>
              <div className="cs-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>F. PEMAKAIAN / ORDER SPARE PART</span>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--hijau-tua)', background: '#dcfce7', padding: '2px 8px', borderRadius: '12px' }}>💡 Ketik huruf awal & auto pilih dari katalog</span>
              </div>
              <table className="cs-check-tbl" id="cs-sparepart-tbl" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '8px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '10px 12px', textAlign: 'left' }}>Nama / Drawing Sparepart</th>
                    <th style={{ width: '80px', textAlign: 'center' }}>Qty</th>
                    <th style={{ width: '140px', textAlign: 'right' }}>Harga Satuan (Rp)</th>
                    <th style={{ width: '140px', textAlign: 'right', paddingRight: '12px' }}>Total Cost (Rp)</th>
                    <th style={{ width: '70px', textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {spareparts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="cap" style={{ textAlign: 'center', padding: '16px', color: '#64748b', fontStyle: 'italic' }}>
                        Belum ada sparepart ditambahkan. Klik tombol &quot;+ Tambah Sparepart&quot; di bawah untuk mengisi.
                      </td>
                    </tr>
                  ) : (
                    spareparts.map((item, idx) => {
                      const query = item.namaSparepart.trim().toLowerCase()
                      const filtered = katalogList.filter((k) => k.nama.toLowerCase().includes(query))
                      const exactMatch = katalogList.some((k) => k.nama.toLowerCase() === query)

                      return (
                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ position: 'relative', padding: '8px 10px' }}>
                            <input
                              type="text"
                              className="sp-nama"
                              placeholder="Ketik huruf depan (auto-muncul)..."
                              value={item.namaSparepart}
                              onFocus={() => setActiveSpDropdown(idx)}
                              onChange={(e) => {
                                handleUpdateSparepart(idx, 'namaSparepart', e.target.value)
                                setActiveSpDropdown(idx)
                              }}
                              style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 600, fontSize: '13px', outline: 'none' }}
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
                                maxHeight: '250px',
                                overflowY: 'auto',
                                marginTop: '4px',
                                minWidth: '280px'
                              }}>
                                <div style={{ background: '#f8fafc', padding: '8px 12px', fontSize: '11px', fontWeight: 800, color: '#475569', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 2 }}>
                                  <span>✨ DAFTAR KATALOG (Klik untuk pilih)</span>
                                  <button type="button" onClick={() => setActiveSpDropdown(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b', fontSize: '14px', fontWeight: 'bold' }}>✕</button>
                                </div>

                                {filtered.length > 0 ? (
                                  filtered.map((k) => (
                                    <div
                                      key={k.id}
                                      onClick={() => handleSelectKatalog(idx, k)}
                                      style={{
                                        padding: '9px 12px',
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
                                      <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '13px' }}>📦 {k.nama}</span>
                                      <span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: '12px', fontWeight: 800, fontSize: '12px', border: '1px solid #86efac' }}>
                                        Rp {Number(k.hargaSatuan).toLocaleString('id-ID')}
                                      </span>
                                    </div>
                                  ))
                                ) : (
                                  <div style={{ padding: '14px 12px', textAlign: 'center', color: '#64748b', fontSize: '12px', fontStyle: 'italic', background: '#fef2f2' }}>
                                    ❌ Belum ada sparepart dengan nama &quot;{item.namaSparepart}&quot; di database.
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
                                        fontSize: '12.5px',
                                        cursor: 'pointer',
                                        boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px'
                                      }}
                                    >
                                      {savingNewKatalogIdx === idx ? '⏳ Menyimpan...' : `✨ Simpan "${item.namaSparepart}" ke Katalog Master & Harganya`}
                                    </button>
                                    <p style={{ margin: '5px 0 0 0', fontSize: '10.5px', color: '#047857', textAlign: 'center', fontWeight: 600 }}>
                                      💡 *Ketik harganya di kolom kanan lalu klik tombol hijau di atas ini agar besok Anda cukup ketik huruf depannya saja!
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                          <td style={{ width: '80px', padding: '8px 6px' }}>
                            <input
                              type="number"
                              min="1"
                              value={item.qty || 1}
                              onChange={(e) => handleUpdateSparepart(idx, 'qty', Math.max(1, parseInt(e.target.value, 10) || 1))}
                              style={{ width: '100%', padding: '8px 6px', textAlign: 'center', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 700, fontSize: '13px' }}
                            />
                          </td>
                          <td style={{ width: '140px', padding: '8px 6px' }}>
                            <input
                              type="number"
                              className="sp-biaya"
                              placeholder="0"
                              value={item.hargaSatuan || ''}
                              onChange={(e) => handleUpdateSparepart(idx, 'hargaSatuan', parseInt(e.target.value, 10) || 0)}
                              style={{ width: '100%', padding: '8px 8px', textAlign: 'right', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 600, fontSize: '13px' }}
                            />
                          </td>
                          <td style={{ width: '140px', textAlign: 'right', paddingRight: '12px', fontWeight: 800, color: '#047857', fontSize: '13.5px', whiteSpace: 'nowrap' }}>
                            Rp {((item.qty || 1) * Number(item.hargaSatuan || 0)).toLocaleString('id-ID')}
                          </td>
                          <td style={{ textAlign: 'center', width: '70px', padding: '8px 6px' }}>
                            <button
                              type="button"
                              onClick={() => handleRemoveSparepart(idx)}
                              style={{ border: '1px solid #ef4444', background: '#fef2f2', color: '#dc2626', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px', transition: 'all 0.15s' }}
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
              
              <div style={{ display: 'flex', gap: '10px', marginTop: '12px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleAddSparepart}
                  style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#ffffff', border: 'none', padding: '10px 18px', borderRadius: '6px', fontWeight: 800, fontSize: '13px', cursor: 'pointer', boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  ➕ Tambah Sparepart
                </button>
                
                <button
                  type="button"
                  onClick={() => window.open('/sparepart', '_blank')}
                  style={{ background: '#f8fafc', color: '#334155', border: '1px solid #cbd5e1', padding: '10px 16px', borderRadius: '6px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', transition: 'all 0.15s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#e2e8f0'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
                >
                  📦 Kelola Master Katalog Sparepart ↗
                </button>
              </div>

              <div style={{ marginTop: '16px', background: 'var(--krem)', borderRadius: 'var(--radius)', padding: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '3px 0' }}>
                  <span>Man Power Cost {isOverhaul ? '(total b1-b5)' : ''}</span>
                  <b>Rp {totalMpCost.toLocaleString('id-ID')}</b>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '3px 0' }}>
                  <span>Sparepart Cost</span>
                  <b>Rp {totalSparepart.toLocaleString('id-ID')}</b>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 800, color: 'var(--hijau-tua)', borderTop: '1px dashed var(--garis)', marginTop: '6px', paddingTop: '8px' }}>
                  <span>TOTAL ESTIMASI COST</span>
                  <span>Rp {totalCostCombined.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>

            {/* FOTO UPLOAD SECTION */}
            <div style={{ marginTop: '20px' }}>
              <div className="cs-section-title">Foto Temuan / Hasil Kerja</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                {foto.map((src, i) => (
                  <div key={i} style={{ position: 'relative', display: 'inline-block', margin: '4px' }}>
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

            {/* CATATAN TAMBAHAN */}
            <div style={{ marginTop: '20px' }}>
              <div className="cs-section-title">Catatan Tambahan</div>
              <textarea
                className="cs-catatan-field"
                placeholder="Catatan hasil overhaul..."
                rows={3}
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                style={{ width: '100%', marginTop: '4px' }}
              />
            </div>

            {/* SIGNATURE APPROVAL CARD */}
            <div style={{ marginTop: '20px' }}>
              <div className="cs-section-title">Approval Status & Tanda Tangan</div>
              <div className="cs-ttd-wrap">
                {getTtdBox('PIC', 'Member (PIC)', picSign, undefined)}
                {getTtdBox('TL', 'Team Leader', tlSign, picSign)}
                {getTtdBox('GL', 'Group Leader', glSign, tlSign)}
                {getTtdBox('ADM', 'ADM', admSign, glSign)}
              </div>
            </div>

            <button className="tombol-utama" type="button" style={{ width: '100%', padding: '14px', fontSize: '15px', marginTop: '20px' }} onClick={() => handleSave(true)}>
              💾 SIMPAN DATA CHECKSHEET
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================
         ===== TAB PRINT - PRINT ONLY CONTAINER FOR PAPER =====
         ======================================================== */}
      {isBMChuck ? (
        /* ===== BM CHUCK PRINT LAYOUT (HALAMAN 1 & HALAMAN 2) ===== */
        (() => {
          const allItems = getAllBMChuckItems()
          const hasNG = allItems.some((item) => item.judge === 'X')
          const hasAny = allItems.some((item) => !!item.judge)
          const judgeVal = hasAny ? (hasNG ? 'NG' : 'OK') : ''

          return (
            <div className="cs-print-only" style={{ background: '#fff', color: '#000', fontFamily: 'Arial, sans-serif', fontSize: '10px' }}>
              <style>{`
                @media print {
                  @page { size: A4 portrait; margin: 6mm 8mm; }
                  body { margin: 0; padding: 0; background: #fff; color: #000; }
                  .cs-print-only { padding: 0; margin: 0; width: 100%; display: block !important; }
                  .cs-print-only table { border-collapse: collapse; width: 100%; }
                  .cs-print-only th, .cs-print-only td { border: 1px solid #000 !important; padding: 2px 4px; }
                }
              `}</style>

              {/* ===== HALAMAN 1: CHECKSHEET CHUCK ===== */}
              <div style={{ pageBreakAfter: 'always' }}>
                {/* Header */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '4px' }}>
                  <tbody>
                    <tr>
                      <td style={{ border: '1px solid #000', padding: '4px 6px', width: '22%', fontSize: '9px', fontWeight: 'bold', verticalAlign: 'top' }}>
                        PT.SUGITY CREATIVES<br/>
                        MOLD MAINTENANCE DEPT.
                      </td>
                      <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center', fontSize: '18px', fontWeight: 'bold', letterSpacing: '1px' }}>
                        CHECK SHEET PEMERIKSAAN CHUCK
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Spesifikasi Mold */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '6px', fontSize: '10px' }}>
                  <thead>
                    <tr style={{ fontWeight: 'bold', background: '#f0f0f0' }}>
                      <th style={{ border: '1px solid #000', padding: '3px 4px', textAlign: 'center', width: '15%' }}>MOLD NO</th>
                      <th style={{ border: '1px solid #000', padding: '3px 4px', textAlign: 'center', width: '35%' }}>MOLD NAME</th>
                      <th style={{ border: '1px solid #000', padding: '3px 4px', textAlign: 'center', width: '18%' }}>MODEL</th>
                      <th style={{ border: '1px solid #000', padding: '3px 4px', textAlign: 'center', width: '18%' }}>CUSTOMER</th>
                      <th style={{ border: '1px solid #000', padding: '3px 4px', textAlign: 'center', width: '14%' }}>TON</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ border: '1px solid #000', padding: '3px 4px', textAlign: 'center', fontWeight: 'bold' }}>{laporan.noMold}</td>
                      <td style={{ border: '1px solid #000', padding: '3px 4px', textAlign: 'center' }}>{laporan.moldData?.part || laporan.part || '-'}</td>
                      <td style={{ border: '1px solid #000', padding: '3px 4px', textAlign: 'center' }}>{laporan.moldData?.model || '-'}</td>
                      <td style={{ border: '1px solid #000', padding: '3px 4px', textAlign: 'center' }}>{laporan.moldData?.customer || '-'}</td>
                      <td style={{ border: '1px solid #000', padding: '3px 4px', textAlign: 'center' }}>{laporan.moldData?.tonase || '-'}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Gambar Chuck + NOTE Box (Kiri) | Tabel Items 1..N (Kanan) */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '6px' }}>
                  <tbody>
                    <tr>
                      <td style={{ border: '1px solid #000', padding: '4px', width: '42%', verticalAlign: 'top' }}>
                        <img
                          src="/images/chuck-diagram.png"
                          alt="Chuck Diagram"
                          style={{ width: '100%', height: 'auto', display: 'block', marginBottom: '6px' }}
                        />
                        <div style={{ fontSize: '9px' }}>
                          <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>NOTE :</div>
                          <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '9px' }}>
                            <tbody>
                              <tr>
                                <td style={{ border: '1px solid #000', padding: '2px 4px', fontWeight: 'bold', width: '15%' }}>G</td>
                                <td style={{ border: '1px solid #000', padding: '2px 4px', width: '35%' }}>: Ganti</td>
                                <td style={{ border: '1px solid #000', padding: '2px 4px', fontWeight: 'bold', width: '15%' }}>X</td>
                                <td style={{ border: '1px solid #000', padding: '2px 4px', width: '35%' }}>: NG</td>
                              </tr>
                              <tr>
                                <td style={{ border: '1px solid #000', padding: '2px 4px', fontWeight: 'bold' }}>R</td>
                                <td style={{ border: '1px solid #000', padding: '2px 4px' }}>: Repair</td>
                                <td style={{ border: '1px solid #000', padding: '2px 4px', fontWeight: 'bold' }}>O</td>
                                <td style={{ border: '1px solid #000', padding: '2px 4px' }}>: OK</td>
                              </tr>
                              <tr>
                                <td style={{ border: '1px solid #000', padding: '2px 4px', fontWeight: 'bold' }}>T/A</td>
                                <td colSpan={3} style={{ border: '1px solid #000', padding: '2px 4px' }}>: Tdk Pakai</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </td>
                      <td style={{ border: '1px solid #000', padding: '0', width: '58%', verticalAlign: 'top' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9.5px' }}>
                          <thead>
                            <tr style={{ background: '#f5f5f5' }}>
                              <th style={{ border: '1px solid #000', padding: '3px 4px', width: '10%', textAlign: 'center' }}>NO</th>
                              <th style={{ border: '1px solid #000', padding: '3px 4px', width: '42%' }}>ITEM</th>
                              <th style={{ border: '1px solid #000', padding: '3px 4px', width: '48%' }}>STANDART</th>
                            </tr>
                          </thead>
                          <tbody>
                            {allItems.map((item) => (
                              <tr key={item.no}>
                                <td style={{ border: '1px solid #000', padding: '2px 4px', textAlign: 'center' }}>{item.no}.</td>
                                <td style={{ border: '1px solid #000', padding: '2px 4px' }}>{item.label}</td>
                                <td style={{ border: '1px solid #000', padding: '2px 4px' }}>{item.standard}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Tabel Pengisian: OH NO | TANGGAL | ITEM CHECK 1..N | JUDGE | REMARK | PIC */}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px', textAlign: 'center' }}>
                  <thead>
                    <tr>
                      <th rowSpan={2} style={{ border: '1px solid #000', padding: '3px 2px', width: '28px' }}>OH<br/>NO</th>
                      <th rowSpan={2} style={{ border: '1px solid #000', padding: '3px 2px', width: '58px' }}>TANGGAL</th>
                      <th colSpan={allItems.length} style={{ border: '1px solid #000', padding: '3px' }}>ITEM CHECK</th>
                      <th rowSpan={2} style={{ border: '1px solid #000', padding: '3px 2px', width: '40px' }}>JUDGE</th>
                      <th rowSpan={2} style={{ border: '1px solid #000', padding: '3px' }}>REMARK</th>
                      <th rowSpan={2} style={{ border: '1px solid #000', padding: '3px 2px', width: '48px' }}>PIC</th>
                    </tr>
                    <tr>
                      {allItems.map((item) => (
                        <th key={item.no} style={{ border: '1px solid #000', padding: '2px 1px' }}>{item.no}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ height: '22px' }}>
                      <td style={{ border: '1px solid #000', padding: '2px' }}>1</td>
                      <td style={{ border: '1px solid #000', padding: '2px', fontSize: '8.5px' }}>{new Date(laporan.tanggal).toLocaleDateString('id-ID')}</td>
                      {allItems.map((item) => (
                        <td key={item.no} style={{ border: '1px solid #000', padding: '2px', fontWeight: 'bold', color: item.judge === 'X' ? '#c00' : item.judge === 'O' ? '#006600' : '#000' }}>
                          {item.judge}
                        </td>
                      ))}
                      <td style={{ border: '1px solid #000', padding: '2px', fontWeight: 'bold', color: judgeVal === 'NG' ? '#c00' : '#006600' }}>
                        {judgeVal}
                      </td>
                      <td style={{ border: '1px solid #000', padding: '2px', textAlign: 'left' }}>{catatan || ''}</td>
                      <td style={{ border: '1px solid #000', padding: '2px' }}>{laporan.pic.nama.split(' ')[0]}</td>
                    </tr>
                    {Array.from({ length: 27 }).map((_, rowIndex) => (
                      <tr key={rowIndex + 2} style={{ height: '18px' }}>
                        <td style={{ border: '1px solid #000', padding: '2px' }}>{rowIndex + 2}</td>
                        <td style={{ border: '1px solid #000', padding: '2px' }}></td>
                        {allItems.map((item) => (
                          <td key={item.no} style={{ border: '1px solid #000', padding: '2px' }}></td>
                        ))}
                        <td style={{ border: '1px solid #000', padding: '2px' }}></td>
                        <td style={{ border: '1px solid #000', padding: '2px' }}></td>
                        <td style={{ border: '1px solid #000', padding: '2px' }}></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ===== HALAMAN 2: BIAYA SPAREPART, MAN POWER & APPROVAL TTD ===== */}
              <div style={{ paddingTop: '10px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '8px' }}>
                  <tbody>
                    <tr>
                      <td style={{ border: '1px solid #000', padding: '4px 6px', width: '22%', fontSize: '9px', fontWeight: 'bold', verticalAlign: 'top' }}>
                        PT.SUGITY CREATIVES<br/>
                        MOLD MAINTENANCE DEPT.
                      </td>
                      <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>
                        <div style={{ fontSize: '16px', fontWeight: 'bold' }}>RINCIAN BIAYA & APPROVAL PEMERIKSAAN CHUCK</div>
                        <div style={{ fontSize: '10px', color: '#444', marginTop: '2px' }}>
                          MOLD NO: <b>{laporan.noMold}</b> &nbsp;|&nbsp; PART: <b>{laporan.moldData?.part || laporan.part || '-'}</b> &nbsp;|&nbsp; TANGGAL: <b>{new Date(laporan.tanggal).toLocaleDateString('id-ID')}</b>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* F. PEMAKAIAN SPAREPART */}
                <div style={{ fontSize: '11px', fontWeight: 'bold', margin: '12px 0 6px 0', color: '#1e1b4b' }}>
                  F. PEMAKAIAN SPAREPART / ORDER SPARE PART
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', marginBottom: '14px' }}>
                  <thead>
                    <tr style={{ background: '#f0f0f0' }}>
                      <th style={{ border: '1px solid #000', padding: '4px', width: '36px', textAlign: 'center' }}>NO</th>
                      <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'left' }}>NAMA SPAREPART</th>
                      <th style={{ border: '1px solid #000', padding: '4px', width: '70px', textAlign: 'center' }}>QTY</th>
                      <th style={{ border: '1px solid #000', padding: '4px', width: '130px', textAlign: 'right' }}>HARGA SATUAN</th>
                      <th style={{ border: '1px solid #000', padding: '4px', width: '140px', textAlign: 'right' }}>TOTAL BIAYA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {spareparts.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', color: '#666' }}>
                          Tidak ada pemakaian sparepart.
                        </td>
                      </tr>
                    ) : (
                      spareparts.map((sp, idx) => (
                        <tr key={idx}>
                          <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center' }}>{idx + 1}</td>
                          <td style={{ border: '1px solid #000', padding: '4px', fontWeight: 'bold' }}>{sp.namaSparepart}</td>
                          <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center' }}>{sp.qty}</td>
                          <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'right' }}>Rp {Number(sp.hargaSatuan).toLocaleString('id-ID')}</td>
                          <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'right', fontWeight: 'bold' }}>Rp {(sp.qty * Number(sp.hargaSatuan)).toLocaleString('id-ID')}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                {/* COST SUMMARY */}
                <div style={{ fontSize: '11px', fontWeight: 'bold', margin: '12px 0 6px 0', color: '#1e1b4b' }}>
                  RINGKASAN BIAYA PEMELIHARAAN (COST SUMMARY)
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', marginBottom: '14px' }}>
                  <tbody>
                    <tr>
                      <td style={{ border: '1px solid #000', padding: '4px 6px', fontWeight: 'bold', background: '#f0f0f0', width: '70%' }}>Biaya Man Power (M/P Cost)</td>
                      <td style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'right', fontWeight: 'bold' }}>Rp {totalMpCost.toLocaleString('id-ID')}</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #000', padding: '4px 6px', fontWeight: 'bold', background: '#f0f0f0' }}>Biaya Pemakaian Sparepart</td>
                      <td style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'right', fontWeight: 'bold' }}>Rp {totalSparepart.toLocaleString('id-ID')}</td>
                    </tr>
                    <tr style={{ background: '#e8e8e8' }}>
                      <td style={{ border: '1px solid #000', padding: '5px 6px', fontWeight: 'bold', fontSize: '11px' }}>TOTAL BIAYA PEMELIHARAAN (TOTAL COST)</td>
                      <td style={{ border: '1px solid #000', padding: '5px 6px', textAlign: 'right', fontWeight: 'bold', fontSize: '12px', color: '#15803d' }}>Rp {totalCostCombined.toLocaleString('id-ID')}</td>
                    </tr>
                  </tbody>
                </table>

                {/* CATATAN REMARK */}
                <div style={{ border: '1px solid #000', padding: '8px', minHeight: '50px', marginBottom: '20px', fontSize: '10px' }}>
                  <b>CATATAN TAMBAHAN / REMARK:</b>
                  <div style={{ marginTop: '4px', whiteSpace: 'pre-wrap', color: '#333' }}>{catatan || '(Tidak ada catatan)'}</div>
                </div>

                {/* APPROVAL SIGNATURES */}
                <div style={{ fontSize: '11px', fontWeight: 'bold', margin: '12px 0 6px 0', color: '#1e1b4b' }}>
                  LEMBAR APPROVAL & TANDA TANGAN
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
                  <thead>
                    <tr style={{ background: '#f0f0f0' }}>
                      <th style={{ border: '1px solid #000', padding: '4px', width: '25%' }}>Disiapkan Oleh (Member PIC)</th>
                      <th style={{ border: '1px solid #000', padding: '4px', width: '25%' }}>Diperiksa Oleh (Team Leader)</th>
                      <th style={{ border: '1px solid #000', padding: '4px', width: '25%' }}>Disetujui Oleh (Group Leader)</th>
                      <th style={{ border: '1px solid #000', padding: '4px', width: '25%' }}>Diterima Oleh (ADM)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ height: '70px' }}>
                      <td style={{ border: '1px solid #000', padding: '6px', verticalAlign: 'bottom', textAlign: 'center' }}>
                        {picSign?.signedAt ? (
                          <>
                            {picSign.user?.signature && <img src={picSign.user.signature} alt="TTD" style={{ maxHeight: '45px', display: 'block', margin: '0 auto 4px', objectFit: 'contain' }} />}
                            <b>{picSign.user?.nama || 'Verified'}</b><br/><span style={{ fontSize: '9px', color: '#666' }}>{new Date(picSign.signedAt).toLocaleDateString('id-ID')}</span>
                          </>
                        ) : <span style={{ fontSize: '9px', color: '#999' }}>Belum TTD</span>}
                      </td>
                      <td style={{ border: '1px solid #000', padding: '6px', verticalAlign: 'bottom', textAlign: 'center' }}>
                        {tlSign?.signedAt ? (
                          <>
                            {tlSign.user?.signature && <img src={tlSign.user.signature} alt="TTD" style={{ maxHeight: '45px', display: 'block', margin: '0 auto 4px', objectFit: 'contain' }} />}
                            <b>{tlSign.user?.nama || 'Verified'}</b><br/><span style={{ fontSize: '9px', color: '#666' }}>{new Date(tlSign.signedAt).toLocaleDateString('id-ID')}</span>
                          </>
                        ) : <span style={{ fontSize: '9px', color: '#999' }}>Belum TTD</span>}
                      </td>
                      <td style={{ border: '1px solid #000', padding: '6px', verticalAlign: 'bottom', textAlign: 'center' }}>
                        {glSign?.signedAt ? (
                          <>
                            {glSign.user?.signature && <img src={glSign.user.signature} alt="TTD" style={{ maxHeight: '45px', display: 'block', margin: '0 auto 4px', objectFit: 'contain' }} />}
                            <b>{glSign.user?.nama || 'Verified'}</b><br/><span style={{ fontSize: '9px', color: '#666' }}>{new Date(glSign.signedAt).toLocaleDateString('id-ID')}</span>
                          </>
                        ) : <span style={{ fontSize: '9px', color: '#999' }}>Belum TTD</span>}
                      </td>
                      <td style={{ border: '1px solid #000', padding: '6px', verticalAlign: 'bottom', textAlign: 'center' }}>
                        {admSign?.signedAt ? (
                          <>
                            {admSign.user?.signature && <img src={admSign.user.signature} alt="TTD" style={{ maxHeight: '45px', display: 'block', margin: '0 auto 4px', objectFit: 'contain' }} />}
                            <b>{admSign.user?.nama || 'Verified'}</b><br/><span style={{ fontSize: '9px', color: '#666' }}>{new Date(admSign.signedAt).toLocaleDateString('id-ID')}</span>
                          </>
                        ) : <span style={{ fontSize: '9px', color: '#999' }}>Belum TTD</span>}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )
        })()
      ) : (

      <div className="cs-print-only" style={{ background: '#fff', color: '#000', fontFamily: 'Arial, sans-serif' }}>
        <h2 style={{ textAlign: 'center', margin: '0 0 16px 0', textTransform: 'uppercase', textDecoration: 'underline' }}>
          {isOverhaul ? 'DATA PEMERIKSAAN OVERHAUL MOLD' : `CM CARD (${laporan.jenis})`}
        </h2>

        {isOverhaul ? renderHeaderOverhaulReact() : renderHeaderInfoReact()}

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

        <div style={{ border: '1px solid #000', padding: '8px', fontSize: '11px', marginTop: '10px', minHeight: '60px' }}>
          <b>Catatan Tambahan:</b>
          <div style={{ marginTop: '4px', whiteSpace: 'pre-wrap' }}>{catatan || '(Tidak ada catatan)'}</div>
        </div>

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
            <tr style={{ height: '70px' }}>
              <td style={{ padding: '6px', verticalAlign: 'bottom' }}>
                <div><b>{picSign?.signedAt ? picSign.user?.nama || 'Verified' : ''}</b></div>
                <div style={{ fontSize: '10px', color: '#666' }}>{picSign?.signedAt ? new Date(picSign.signedAt).toLocaleDateString('id-ID') : 'Belum TTD'}</div>
              </td>
              <td style={{ padding: '6px', verticalAlign: 'bottom' }}>
                <div><b>{tlSign?.signedAt ? tlSign.user?.nama || 'Verified' : ''}</b></div>
                <div style={{ fontSize: '10px', color: '#666' }}>{tlSign?.signedAt ? new Date(tlSign.signedAt).toLocaleDateString('id-ID') : 'Belum TTD'}</div>
              </td>
              <td style={{ padding: '6px', verticalAlign: 'bottom' }}>
                <div><b>{glSign?.signedAt ? glSign.user?.nama || 'Verified' : ''}</b></div>
                <div style={{ fontSize: '10px', color: '#666' }}>{glSign?.signedAt ? new Date(glSign.signedAt).toLocaleDateString('id-ID') : 'Belum TTD'}</div>
              </td>
              <td style={{ padding: '6px', verticalAlign: 'bottom' }}>
                <div><b>{admSign?.signedAt ? admSign.user?.nama || 'Verified' : ''}</b></div>
                <div style={{ fontSize: '10px', color: '#666' }}>{admSign?.signedAt ? new Date(admSign.signedAt).toLocaleDateString('id-ID') : 'Belum TTD'}</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      )}
    </>
  )
}
