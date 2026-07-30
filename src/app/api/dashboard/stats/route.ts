import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Shift, UserRole } from '@prisma/client'

function formatDateLocal(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const date = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${date}`
}

// Helper to get ISO Monday (yyyy-mm-dd) in local time
function mulaiMingguISO(d: Date): string {
  const tgl = new Date(d)
  const hari = tgl.getDay() // 0=Minggu, 1=Senin...
  const selisih = hari === 0 ? -6 : 1 - hari
  tgl.setDate(tgl.getDate() + selisih)
  return formatDateLocal(tgl)
}

// Helper to calculate weeks in month
function hitungMingguDalamBulan(bulanInput: string): string[] {
  const [tahun, bln] = bulanInput.split('-').map(Number)
  const minggu: string[] = []
  
  let cursor = new Date(tahun, bln - 1, 1)
  // Get Monday of the week containing the 1st of the month
  const firstMon = mulaiMingguISO(cursor)
  cursor = new Date(firstMon)
  
  // Subtract 1 week to capture overlap if needed, or start from firstMon
  // Let's align with legacy algorithm
  cursor.setDate(cursor.getDate() - 7)
  
  for (let i = 0; i < 8; i++) {
    let jumlahHariDiBulan = 0
    for (let d = 0; d < 7; d++) {
      const hariCek = new Date(cursor)
      hariCek.setDate(hariCek.getDate() + d)
      if (hariCek.getFullYear() === tahun && hariCek.getMonth() === bln - 1) {
        jumlahHariDiBulan++
      }
    }
    if (jumlahHariDiBulan >= 4) {
      minggu.push(formatDateLocal(cursor))
    }
    cursor.setDate(cursor.getDate() + 7)
  }
  return minggu
}

// Helper to calculate cost of a single checksheet (Man Power Cost + Spareparts + dll)
function hitungChecksheetCost(cs: any, isOverhaul: boolean, defaultDurationHrs: number, defaultOrang: number) {
  let mpCost = 0
  let spCost = 0

  // 1. MP Cost
  if (isOverhaul) {
    const rawChecklist = cs.checklist || {}
    const costBox = rawChecklist.costBox || {}
    
    // Sum b1 to b5
    const costKeys = ['b1', 'b2', 'b3', 'b4', 'b5']
    costKeys.forEach((key) => {
      const cb = costBox[key] || {}
      const start = cb.jamMulai || ''
      const end = cb.jamSelesai || ''
      const people = Number(cb.orang) || 0
      
      if (start && end) {
        const [hStart, minStart] = start.split(':').map(Number)
        const [hEnd, minEnd] = end.split(':').map(Number)
        let diffMinutes = (hEnd * 60 + minEnd) - (hStart * 60 + minStart)
        if (diffMinutes < 0) diffMinutes += 24 * 60
        const hours = diffMinutes / 60
        mpCost += Math.round(hours * 89595 * people)
      }
    })
  } 
  
  // Jika bukan overhaul atau overhaul tapi costBox (b1-b5) belum terisi (mpCost masih 0), hitung dari durasi jamMulai-jamSelesai
  if (!isOverhaul || mpCost === 0) {
    const start = cs.jamMulai || ''
    const end = cs.jamSelesai || ''
    const orang = Number(cs.jumlahOrang || defaultOrang || 1)
    if (start && end) {
      const [hStart, minStart] = start.split(':').map(Number)
      const [hEnd, minEnd] = end.split(':').map(Number)
      let diffMinutes = (hEnd * 60 + minEnd) - (hStart * 60 + minStart)
      if (diffMinutes < 0) diffMinutes += 24 * 60
      const hours = diffMinutes / 60
      mpCost += Math.round(hours * 89595 * orang)
    } else if (mpCost === 0) {
      mpCost += Math.round(defaultDurationHrs * 89595 * orang)
    }
  }

  // 2. Sparepart Cost
  if (Array.isArray(cs.spareparts)) {
    cs.spareparts.forEach((sp: any) => {
      spCost += (Number(sp.qty || 1)) * Number(sp.hargaSatuan || 0)
    })
  }

  return { mpCost, spCost, total: mpCost + spCost }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const bulanParam = searchParams.get('bulan') || new Date().toISOString().slice(0, 7) // YYYY-MM
    
    const [tahun, bln] = bulanParam.split('-').map(Number)
    const startDate = new Date(tahun, bln - 1, 1)
    const endDate = new Date(tahun, bln, 0, 23, 59, 59, 999)
    const currentYear = new Date().getFullYear()

    const monStr = mulaiMingguISO(new Date())
    const startOfWeek = new Date(monStr)
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(endOfWeek.getDate() + 6)
    endOfWeek.setHours(23, 59, 59, 999)

    const startOfYear = new Date(tahun, 0, 1)
    const endOfYear = new Date(tahun, 11, 31, 23, 59, 59, 999)

    // 🚀 SEQUENTIAL QUERY EXECUTION (Prevents Serverless Connection Pool Timeout/Exhaustion)
    // Because TiDB Cloud / Vercel Serverless limits concurrent connection spikes.
    
    const laporanBulanIni = await prisma.laporan.findMany({
      where: { tanggal: { gte: startDate, lte: endDate } },
      include: { checksheet: { include: { spareparts: true, approvals: true } } },
    });

    const lastAccident = await prisma.safetyRecord.findFirst({
      where: { status: 'ACCIDENT' },
      orderBy: { date: 'desc' },
    });

    const totalNoAccident = await prisma.safetyRecord.count({ 
      where: { status: 'NO_ACCIDENT' } 
    });

    const yearlyAccidents = await prisma.safetyRecord.count({ 
      where: { year: currentYear, status: 'ACCIDENT' } 
    });

    const laporanMingguIni = await prisma.laporan.findMany({
      where: { tanggal: { gte: startOfWeek, lte: endOfWeek } },
      include: { checksheet: { include: { approvals: true } } },
    });

    const targets = await prisma.planningTarget.findMany({ 
      where: { bulan: startDate } 
    });

    const overtimeEntries = await prisma.overtimeEntry.findMany({
      where: { tanggal: { gte: startDate, lte: endDate } },
      include: { user: true },
    });

    const laporanYtd = await prisma.laporan.findMany({
      where: { tanggal: { gte: startOfYear, lte: endOfYear } },
      include: { checksheet: { include: { spareparts: true } } },
    });

    const recentLaporan = await prisma.laporan.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { pic: { select: { nama: true } } },
    });

    const pendingMaintenance = await prisma.jadwalMingguan.findMany({
      where: { status: { notIn: ['Sudah_Dikerjakan' as any, 'Sudah Dikerjakan' as any, 'Selesai' as any] } },
      include: {
        pic: { select: { id: true, nama: true } },
        laporan: {
          select: {
            id: true,
            tanggal: true,
            noMold: true,
            checksheet: {
              select: {
                approvals: { select: { role: true, signedAt: true } }
              }
            }
          }
        }
      },
    });

    // Hitung summary stats
    let totalActions = laporanBulanIni.length
    let totalCost = 0
    let maintenanceDone = 0

    laporanBulanIni.forEach((lap) => {
      const isOh = lap.jenis === 'OH_MOLD'
      const cs = lap.checksheet
      
      if (cs) {
        const costRes = hitungChecksheetCost(cs, isOh, 1, 1)
        totalCost += costRes.total

        const approvals = cs.approvals || []
        const isFullApproved = ['PIC', 'TL', 'GL', 'CL', 'ADM'].every((role) =>
          approvals.some((a) => a.role === role && a.signedAt !== null)
        )
        if (isFullApproved) {
          maintenanceDone++
        }
      } else {
        const mpCost = Math.round(1 * 89595 * 1)
        totalCost += mpCost
      }
    })

    // 2. Accident Free Days
    let accidentFreeDays = 365
    if (lastAccident) {
      const diffTime = Math.abs(new Date().setHours(0,0,0,0) - new Date(lastAccident.date).setHours(0,0,0,0))
      accidentFreeDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    } else {
      if (totalNoAccident > 0) {
        accidentFreeDays = totalNoAccident
      } else {
        accidentFreeDays = 365
      }
    }

    // 3. Approval Ratios untuk MINGGU BERJALAN
    const totalWeekly = laporanMingguIni.length
    let weeklyPic = 0
    let weeklyTl = 0
    let weeklyGl = 0
    let weeklyCl = 0
    let weeklyAdm = 0

    laporanMingguIni.forEach((lap) => {
      const cs = lap.checksheet
      if (cs) {
        const approvals = cs.approvals || []
        if (approvals.some((a) => a.role === 'PIC' && a.signedAt !== null)) weeklyPic++
        if (approvals.some((a) => a.role === 'TL' && a.signedAt !== null)) weeklyTl++
        if (approvals.some((a) => a.role === 'GL' && a.signedAt !== null)) weeklyGl++
        if (approvals.some((a) => a.role === 'CL' && a.signedAt !== null)) weeklyCl++
        if (approvals.some((a) => a.role === 'ADM' && a.signedAt !== null)) weeklyAdm++
      }
    })

    // 4. Planning Target vs Aktual per Minggu
    const weeks = hitungMingguDalamBulan(bulanParam)
    const targetOhA = targets.find((t) => t.shift === 'Shift_A')?.targetOh || 0
    const targetOhB = targets.find((t) => t.shift === 'Shift_B')?.targetOh || 0
    
    const perMingguA = weeks.length > 0 ? Math.round(targetOhA / weeks.length) : 0
    const perMingguB = weeks.length > 0 ? Math.round(targetOhB / weeks.length) : 0

    const targetsA = weeks.map(() => perMingguA)
    const targetsB = weeks.map(() => perMingguB)
    const aktualA = weeks.map(() => 0)
    const aktualB = weeks.map(() => 0)
    const aktualNonshift = weeks.map(() => 0)

    laporanBulanIni.forEach((lap) => {
      const cs = lap.checksheet
      if (!cs) return

      const approvals = cs.approvals || []
      const isFullApproved = ['PIC', 'TL', 'GL', 'CL', 'ADM'].every((role) =>
        approvals.some((a) => a.role === role && a.signedAt !== null)
      )
      if (!isFullApproved) return

      const dateMon = mulaiMingguISO(new Date(lap.tanggal))
      const idx = weeks.indexOf(dateMon)
      if (idx !== -1) {
        if (lap.shift === 'Shift_A') {
          aktualA[idx]++
        } else if (lap.shift === 'Shift_B') {
          aktualB[idx]++
        } else if (lap.shift === 'Nonshift') {
          aktualNonshift[idx]++
        }
      }
    })

    // 4b. Hitung Daily OH
    const daysInMonth = new Date(tahun, bln, 0).getDate()
    const dailyOhMap: Record<number, number> = {}
    for (let d = 1; d <= daysInMonth; d++) dailyOhMap[d] = 0

    laporanBulanIni.forEach((lap) => {
      if (lap.jenis === 'OH_MOLD') {
        const isFullApproved = ['PIC', 'TL', 'GL', 'CL', 'ADM'].every((role) =>
          (lap.checksheet?.approvals || []).some((a) => a.role === role && a.signedAt !== null)
        )
        if (isFullApproved) {
          const d = new Date(lap.tanggal).getDate()
          dailyOhMap[d]++
        }
      }
    })

    const dailyOh = Object.keys(dailyOhMap).map(d => ({
      date: `${tahun}-${String(bln).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      count: dailyOhMap[Number(d)]
    }))

    // 5. Lembur (Overtime) per PIC
    const overtimeGroup: Record<Shift, Record<string, { plan: number; aktual: number }>> = {
      Nonshift: {},
      Shift_A: {},
      Shift_B: {},
    }

    overtimeEntries.forEach((entry) => {
      const shift = entry.user.shift || Shift.Nonshift
      const nama = entry.user.nama
      if (!overtimeGroup[shift]) overtimeGroup[shift] = {}
      if (!overtimeGroup[shift][nama]) {
        overtimeGroup[shift][nama] = { plan: 0, aktual: 0 }
      }
      overtimeGroup[shift][nama].plan += Number(entry.jamRencana || 0)
      overtimeGroup[shift][nama].aktual += Number(entry.jamAktual || 0)
    })

    const mappedOvertime = (shift: Shift) => {
      const data = overtimeGroup[shift] || {}
      const labels = Object.keys(data)
      const plan = labels.map((l) => data[l].plan)
      const aktual = labels.map((l) => data[l].aktual)
      return { labels, plan, aktual }
    }

    const allOtUsers = Object.values(
      overtimeEntries.reduce((acc: Record<string, { nama: string; total: number }>, e) => {
        const key = e.user.nama
        if (!acc[key]) acc[key] = { nama: key, total: 0 }
        acc[key].total += Number(e.jamRencana || 0) + Number(e.jamAktual || 0)
        return acc
      }, {})
    ).sort((a, b) => b.total - a.total)
    const topPerformer = allOtUsers[0] || null

    const totalPlanMaintenance = targetOhA + targetOhB
    const totalAktualMaintenance = aktualA.reduce((a, b) => a + b, 0) + aktualB.reduce((a, b) => a + b, 0)
    const achievementPct = totalPlanMaintenance > 0 ? Math.round((totalAktualMaintenance / totalPlanMaintenance) * 100) : 0

    // 6. Tren Bulanan (YTD Jan - Dec)
    const rawMonthlyCosts = Array(12).fill(0)
    const monthlyActions = Array(12).fill(0)

    laporanYtd.forEach((lap) => {
      const dateObj = new Date(lap.tanggal)
      const monthIdx = dateObj.getMonth()
      const isOh = lap.jenis === 'OH_MOLD'
      const cs = lap.checksheet
      
      let costVal = 0
      if (cs) {
        const costRes = hitungChecksheetCost(cs, isOh, 1, 1)
        costVal = costRes.total
      } else {
        costVal = Math.round(1 * 89595 * 1)
      }

      rawMonthlyCosts[monthIdx] += costVal
      monthlyActions[monthIdx]++
    })

    const monthlyCosts = rawMonthlyCosts.map((val) => Math.round(val / 1000))

    // 8. Jadwal Maintenance Mingguan & Urgent
    const activeSchedules = pendingMaintenance.map(j => {
      const linked = (j as any).laporan || []
      const matching = linked.length > 0 ? linked : laporanBulanIni.filter((rep: any) => {
        if (rep.noMold.trim().toLowerCase() !== j.noMold.trim().toLowerCase()) return false
        if (!j.tanggalRencana) return true
        const jDate = new Date(j.tanggalRencana)
        const repDate = new Date(rep.tanggal)
        const diffDays = Math.abs(repDate.getTime() - jDate.getTime()) / (1000 * 3600 * 24)
        return diffDays <= 2
      })

      let computedStatus = 'Belum_Dikerjakan'
      if (matching.length > 0) {
        const isApprovedByAdm = matching.some((rep: any) => {
          const approvals = rep.checksheet?.approvals || []
          const admApp = approvals.find((a: any) => a.role === 'ADM')
          return admApp && admApp.signedAt !== null
        })
        const isApprovedByPic = matching.some((rep: any) => {
          const approvals = rep.checksheet?.approvals || []
          const picApp = approvals.find((a: any) => a.role === 'PIC')
          return picApp && picApp.signedAt !== null
        })

        if (isApprovedByAdm) {
          computedStatus = 'Sudah_Dikerjakan'
        } else if (isApprovedByPic) {
          computedStatus = 'Proses_Approval'
        } else {
          computedStatus = 'Sedang_Dikerjakan'
        }
      }

      return {
        ...j,
        status: computedStatus
      }
    }).filter(j => j.status !== 'Sudah_Dikerjakan' && j.status !== 'Sudah Dikerjakan' && j.status !== 'Selesai')

    // Urutkan sesuai hari/tanggal (urgent pertama), jika hari sama dahulukan OH dibanding PM dll.
    const getJenisPriority = (jenis?: string | null) => {
      const j = (jenis || '').toUpperCase()
      if (j.includes('OH') || j.includes('OVERHAUL')) return 1
      if (j.includes('PM')) return 2
      if (j.includes('I/M')) return 3
      if (j.includes('B/M')) return 4
      return 5
    }

    activeSchedules.sort((a, b) => {
      const dateA = a.tanggalRencana ? new Date(a.tanggalRencana).getTime() : 0
      const dateB = b.tanggalRencana ? new Date(b.tanggalRencana).getTime() : 0
      if (dateA !== dateB) return dateA - dateB
      
      const prioA = getJenisPriority(a.jenis)
      const prioB = getJenisPriority(b.jenis)
      return prioA - prioB
    })

    const moldNumbers = activeSchedules.map(m => m.noMold)
    const molds = moldNumbers.length > 0 ? await prisma.moldBook.findMany({
      where: { noMold: { in: moldNumbers } },
      select: { noMold: true, part: true, factory: true }
    }) : []
    
    const moldDict: Record<string, any> = {}
    molds.forEach(m => moldDict[m.noMold] = m)

    const todayMaintenance = activeSchedules.map(m => ({
      ...m,
      part: moldDict[m.noMold]?.part || '-',
      factory: moldDict[m.noMold]?.factory || '-'
    }))

    return NextResponse.json({
      cardStats: {
        totalCost,
        totalActions,
        maintenanceDone,
        accidentFreeDays,
        yearlyAccidents,
      },
      maintenanceSummary: {
        totalPlan: totalPlanMaintenance,
        totalAktual: totalAktualMaintenance,
        achievementPct,
        topPerformer,
      },
      dailyOh,
      approvalRatios: {
        total: totalWeekly,
        pic: weeklyPic,
        tl: weeklyTl,
        gl: weeklyGl,
        cl: weeklyCl,
        adm: weeklyAdm,
        period: `${formatDateLocal(startOfWeek)} s/d ${formatDateLocal(endOfWeek)}`,
      },
      planningWeekly: {
        weeks,
        targetsA,
        targetsB,
        aktualA,
        aktualB,
        aktualNonshift,
        totalTarget: targetOhA + targetOhB,
        totalAktual: aktualA.reduce((a, b) => a + b, 0) + aktualB.reduce((a, b) => a + b, 0) + aktualNonshift.reduce((a, b) => a + b, 0),
      },
      overtime: {
        Nonshift: mappedOvertime('Nonshift'),
        Shift_A: mappedOvertime('Shift_A'),
        Shift_B: mappedOvertime('Shift_B'),
      },
      monthlyTrends: {
        costs: monthlyCosts,
        actions: monthlyActions,
      },
      recentLaporan,
      todayMaintenance,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=59',
      },
    })
  } catch (error) {
    console.error('API Error in GET /api/dashboard/stats:', error)
    return NextResponse.json({ error: 'Gagal memuat statistik dashboard' }, { status: 500 })
  }
}
