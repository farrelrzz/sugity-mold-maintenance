'use client'

import { useState, useEffect } from 'react'
import { showToast } from '@/components/ui/Toast'
import { Bar, Doughnut, Line, Chart as ChartComponent } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title as ChartTitle,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from 'chart.js'

// Register Chart.js elements
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ChartTitle,
  Tooltip,
  Legend,
  ArcElement,
  Filler
)

interface StatsData {
  cardStats: {
    totalCost: number
    totalActions: number
    maintenanceDone: number
    accidentFreeDays: number
    yearlyAccidents?: number
  }
  maintenanceSummary: {
    totalPlan: number
    totalAktual: number
    achievementPct: number
    topPerformer: { nama: string; total: number } | null
  }
  approvalRatios: {
    total: number
    pic: number
    tl: number
    gl: number
    cl: number
    adm: number
    period: string
  }
  planningWeekly: {
    weeks: string[]
    targetsA: number[]
    targetsB: number[]
    aktualA: number[]
    aktualB: number[]
    aktualNonshift?: number[]
    totalTarget: number
    totalAktual: number
  }
  dailyOh: { date: string; count: number }[]
  overtime: {
    Nonshift: { labels: string[]; plan: number[]; aktual: number[] }
    Shift_A: { labels: string[]; plan: number[]; aktual: number[] }
    Shift_B: { labels: string[]; plan: number[]; aktual: number[] }
  }
  monthlyTrends: {
    costs: number[]
    actions: number[]
  }
  recentLaporan: any[]
  todayMaintenance: any[]
}

import { useSession } from 'next-auth/react'
import RegularUI from './RegularUI'

export default function DashboardPage() {
  const { data: session } = useSession()
  const [bulan, setBulan] = useState(() => new Date().toISOString().slice(0, 7))
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  // Target inputs
  const [targetA, setTargetA] = useState<number | string>('')
  const [targetB, setTargetB] = useState<number | string>('')
  const [submittingTarget, setSubmittingTarget] = useState(false)

  const fetchStats = () => {
    setLoading(true)
    fetch(`/api/dashboard/stats?bulan=${bulan}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          showToast(data.error, 'error')
        } else {
          setStats(data)
          if (data.planningWeekly) {
            const rawA = data.planningWeekly.targetsA.reduce((s: number, v: number) => s + v, 0)
            const rawB = data.planningWeekly.targetsB.reduce((s: number, v: number) => s + v, 0)
            setTargetA(rawA || '')
            setTargetB(rawB || '')
          }
        }
      })
      .catch((err) => {
        console.error(err)
        showToast('Gagal memuat statistik dashboard', 'error')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchStats()
  }, [bulan])

  const handleSaveTarget = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmittingTarget(true)

    try {
      const resA = await fetch('/api/dashboard/planning-target', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bulan, shift: 'Shift_A', target: Number(targetA) || 0 }),
      })

      const resB = await fetch('/api/dashboard/planning-target', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bulan, shift: 'Shift_B', target: Number(targetB) || 0 }),
      })

      if (resA.ok && resB.ok) {
        showToast('Target bulanan berhasil diperbarui! ✓')
        fetchStats()
      } else {
        showToast('Gagal memperbarui target planning', 'error')
      }
    } catch {
      showToast('Kesalahan jaringan', 'error')
    } finally {
      setSubmittingTarget(false)
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const [tahun] = bulan.split('-')
      const res = await fetch(`/api/dashboard/export-excel?tahun=${tahun}`)
      if (!res.ok) throw new Error('Export gagal')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Laporan_Mold_${tahun}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
      showToast('📊 File Excel berhasil diunduh!')
    } catch {
      showToast('Gagal export Excel', 'error')
    } finally {
      setExporting(false)
    }
  }

  if (loading && !stats) {
    return <div className="kosong">Memuat data dashboard analitik...</div>
  }

  if (!stats) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>
        <h2>Gagal memuat data dashboard.</h2>
        <p>Terjadi kesalahan pada server atau database.</p>
        <button onClick={fetchStats} style={{ padding: '10px 20px', marginTop: '20px', cursor: 'pointer' }}>Coba Lagi</button>
      </div>
    )
  }

  const props = {
    data: stats!,
    bulan,
    setBulan,
    targetA,
    setTargetA,
    targetB,
    setTargetB,
    submittingTarget,
    handleSaveTarget,
    exporting,
    handleExport
  }

  return <RegularUI {...props} />
}
