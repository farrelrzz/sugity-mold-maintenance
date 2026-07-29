import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')

    const where = category ? { category: category.toUpperCase() } : {}
    
    let options = await prisma.reportOption.findMany({
      where,
      orderBy: { id: 'asc' }
    })

    // Auto-seed defaults if completely empty
    if (options.length === 0 && !category) {
      const defaultProblems = [
        'Material nyangkut', 'Hasil kasar', 'Tidak mau auto',
        'Gerak macet', 'Lis angin NG', 'Cleaning area cavity',
        'Open mold', 'Welding ulang'
      ]
      const defaultCms = [
        'Cleaning material', 'Analisa problem', 'Ganti part baru',
        'Grease up', 'Mold finish / polish', 'Turunkan temperatur',
        'Cek tekanan angin', 'Monitoring produksi'
      ]
      
      const seedData = [
        ...defaultProblems.map(v => ({ category: 'PROBLEM', value: v })),
        ...defaultCms.map(v => ({ category: 'COUNTERMEASURE', value: v }))
      ]

      await prisma.reportOption.createMany({ data: seedData })
      
      options = await prisma.reportOption.findMany({
        where,
        orderBy: { id: 'asc' }
      })
    }

    return NextResponse.json(options)
  } catch (error) {
    console.error('API Error in GET /api/report-options:', error)
    return NextResponse.json({ error: 'Gagal mengambil opsi' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { category, value } = body

    if (!category || !value) {
      return NextResponse.json({ error: 'Category dan value harus diisi' }, { status: 400 })
    }

    const newOption = await prisma.reportOption.create({
      data: {
        category: category.toUpperCase(),
        value: value.trim()
      }
    })

    return NextResponse.json(newOption, { status: 201 })
  } catch (error) {
    console.error('API Error in POST /api/report-options:', error)
    return NextResponse.json({ error: 'Gagal menambah opsi' }, { status: 500 })
  }
}
