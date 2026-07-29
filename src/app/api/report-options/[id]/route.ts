import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: 'ID opsi harus disertakan' }, { status: 400 })
    }

    await prisma.reportOption.delete({
      where: { id: Number(id) }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API Error in DELETE /api/report-options/[id]:', error)
    return NextResponse.json({ error: 'Gagal menghapus opsi' }, { status: 500 })
  }
}
