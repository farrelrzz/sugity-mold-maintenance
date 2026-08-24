'use client'

import { useState, useEffect } from 'react'
import { showToast } from '@/components/ui/Toast'

interface SummarizeModalProps {
  isOpen: boolean
  onClose: () => void
  initialDate?: string
}

export default function SummarizeModal({ isOpen, onClose, initialDate }: SummarizeModalProps) {
  const todayStr = new Date().toISOString().split('T')[0]
  const [tanggal, setTanggal] = useState(initialDate || todayStr)
  const [shiftName, setShiftName] = useState('Shift B DayShift')
  const [lainLain, setLainLain] = useState('- Support Produksi\n- 2s Area Maintenance')
  const [temuanOH, setTemuanOH] = useState('- T/A')
  const [laporanList, setLaporanList] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [customText, setCustomText] = useState('')
  const [isManualEdit, setIsManualEdit] = useState(false)

  useEffect(() => {
    if (initialDate) setTanggal(initialDate)
  }, [initialDate])

  // Fetch laporan for selected date
  useEffect(() => {
    if (!isOpen) return
    setLoading(true)
    fetch(`/api/laporan?tanggal=${tanggal}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setLaporanList(data)
        } else {
          setLaporanList([])
        }
      })
      .catch((err) => {
        console.error('Error fetching laporan for summarize:', err)
        setLaporanList([])
      })
      .finally(() => setLoading(false))
  }, [isOpen, tanggal])

  // Generate automatically generated text
  const generateSummaryText = () => {
    const d = new Date(tanggal)
    const hariNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
    const namaHari = hariNames[d.getDay()] || 'Hari'
    const dateFormatted = `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`

    // Group by factory
    const groupedByFactory: Record<string, any[]> = {}
    laporanList.forEach((lap) => {
      const f = lap.factory || 'F2'
      if (!groupedByFactory[f]) groupedByFactory[f] = []
      groupedByFactory[f].push(lap)
    })

    const factories = Object.keys(groupedByFactory).sort()

    // 1. Header O/H per factory
    let ohHeaderLines = ''
    factories.forEach((fac) => {
      const moldItems = groupedByFactory[fac].map((lap) => {
        const isOH = lap.jenis === 'OH_MOLD' || lap.jenis === 'OH MOLD'
        const tag = isOH ? '(Total)' : `(${lap.jenis})`
        return `*${lap.noMold}${tag}*`
      }).join(', ')

      ohHeaderLines += `${fac} : ${moldItems}\n`
    })

    // 2. Detail Maintenance Per Factory
    let detailLines = ''
    factories.forEach((fac) => {
      detailLines += `P/M ${fac}\n`
      groupedByFactory[fac].forEach((lap) => {
        const isOH = lap.jenis === 'OH_MOLD' || lap.jenis === 'OH MOLD'
        const titleTag = isOH ? '#O/H Total' : `#Maintenance`
        detailLines += `${titleTag} *Mold ${lap.noMold} ${lap.part || ''}*\n`

        if (lap.info || lap.countermeasure) {
          if (lap.info) {
            lap.info.split('\n').forEach((line: string) => {
              if (line.trim()) detailLines += `- ${line.trim()}\n`
            })
          }
          if (lap.countermeasure) {
            lap.countermeasure.split('\n').forEach((line: string) => {
              if (line.trim()) detailLines += `- ${line.trim()}\n`
            })
          }
          detailLines += `- Mold finish\n`
        } else {
          // Standard Overhaul Steps
          detailLines += `- Cek eksternal mold\n`
          detailLines += `- Cleaning P/L Core & Cavity\n`
          detailLines += `- Dissassy E/J group\n`
          detailLines += `- Cleaning + Greasse E/J group\n`
          detailLines += `- Assy E/J group\n`
          detailLines += `- Cek mekanisme, OK\n`
          detailLines += `- Cek gaspring, OK\n`
          detailLines += `- Mold finish\n`
        }
        detailLines += `\n`
      })
    })

    return `*INFORMASI MOLD MAINTENANCE*
           *${shiftName}*
          _${namaHari}_,${dateFormatted}

*O/H*
${ohHeaderLines || 'Tidak ada aktivitas maintenance\n'}
${detailLines}
Temuan OH
${temuanOH}

*Lain - Lain*
${lainLain}

                Terimakasih🙏🏻`
  }

  useEffect(() => {
    if (!isManualEdit) {
      setCustomText(generateSummaryText())
    }
  }, [tanggal, shiftName, lainLain, temuanOH, laporanList, isManualEdit])

  if (!isOpen) return null

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(customText)
      showToast('Teks Rangkuman Maintenance berhasil disalin! 📋✓', 'sukses')
    } catch {
      showToast('Gagal menyalin teks ke clipboard', 'error')
    }
  }

  return (
    <div className="cs-overlay no-print" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="cs-box" style={{ maxWidth: '680px', width: '92%', borderRadius: '12px', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#1e1b4b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📋 Copy Summarize Maintenance Harian
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}
          >
            ✕
          </button>
        </div>

        {/* Form Controls */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '16px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
              📅 Tanggal
            </label>
            <input
              type="date"
              value={tanggal}
              onChange={(e) => { setTanggal(e.target.value); setIsManualEdit(false) }}
              style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
              🌅/🌙 Shift
            </label>
            <select
              value={shiftName}
              onChange={(e) => { setShiftName(e.target.value); setIsManualEdit(false) }}
              style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 600 }}
            >
              <option value="Shift B DayShift">Shift B DayShift (07:15 - 20:40)</option>
              <option value="Shift A DayShift">Shift A DayShift (07:15 - 20:40)</option>
              <option value="Shift B NightShift">Shift B NightShift (21:00 - 06:55)</option>
              <option value="Shift A NightShift">Shift A NightShift (21:00 - 06:55)</option>
              <option value="Nonshift DayShift">Nonshift DayShift</option>
              <option value="Nonshift NightShift">Nonshift NightShift</option>
            </select>
          </div>
        </div>

        {/* Dynamic Fields */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
              🔍 Temuan OH
            </label>
            <input
              type="text"
              value={temuanOH}
              onChange={(e) => { setTemuanOH(e.target.value); setIsManualEdit(false) }}
              placeholder="- T/A..."
              style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
              📌 Lain - Lain
            </label>
            <textarea
              rows={2}
              value={lainLain}
              onChange={(e) => { setLainLain(e.target.value); setIsManualEdit(false) }}
              placeholder="- Support Produksi..."
              style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
            />
          </div>
        </div>

        {/* Text Preview & Editor Area */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#4c1d95' }}>
              📝 Preview Teks Rangkuman (Format WhatsApp)
            </label>
            {isManualEdit && (
              <button
                type="button"
                onClick={() => setIsManualEdit(false)}
                style={{ background: 'none', border: 'none', color: '#7c3aed', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
              >
                🔄 Reset ke Otomatis
              </button>
            )}
          </div>
          <textarea
            rows={14}
            value={customText}
            onChange={(e) => { setCustomText(e.target.value); setIsManualEdit(true) }}
            style={{
              width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #c4b5fd',
              background: '#faf5ff', fontFamily: 'monospace', fontSize: '12px', lineHeight: '1.4',
              color: '#1e1b4b', boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="tombol-sekunder"
            onClick={onClose}
            style={{ margin: 0, padding: '10px 18px', fontSize: '13px' }}
          >
            Batal
          </button>
          <button
            type="button"
            className="tombol-utama"
            onClick={handleCopy}
            style={{ margin: 0, padding: '10px 22px', fontSize: '14px', background: 'linear-gradient(135deg, #15803d 0%, #166534 100%)' }}
          >
            📋 Copy Teks Rangkuman
          </button>
        </div>
      </div>
    </div>
  )
}
