import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const noMold = formData.get('noMold') as string
    const tipe = (formData.get('tipe') as string) || 'mold' // 'mold' | 'produk'

    if (!noMold) {
      return NextResponse.json({ error: 'noMold diperlukan' }, { status: 400 })
    }

    // Sanitize noMold for filesystem (replace / and special chars)
    const safeName = noMold.replace(/[^a-zA-Z0-9_\-]/g, '_')
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'molds', safeName)
    await mkdir(uploadDir, { recursive: true })

    const files = formData.getAll('files') as File[]
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'Tidak ada file yang dikirim' }, { status: 400 })
    }

    const MAX_SIZE_MB = 5
    const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024
    const savedPaths: string[] = []

    for (const file of files) {
      if (!file || typeof file === 'string') continue

      if (file.size > MAX_SIZE_BYTES) {
        return NextResponse.json({ 
          error: `Ukuran foto "${file.name}" melebihi batas maksimal 5 MB! (Ukuran file: ${(file.size / (1024 * 1024)).toFixed(2)} MB)` 
        }, { status: 400 })
      }

      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const timestamp = Date.now()
      const randomStr = Math.random().toString(36).slice(2, 7)
      const fileName = `${tipe}_${timestamp}_${randomStr}.${ext}`
      const filePath = path.join(uploadDir, fileName)

      const buffer = Buffer.from(await file.arrayBuffer())
      await writeFile(filePath, buffer)

      // Store relative path for serving from /public
      savedPaths.push(`/uploads/molds/${safeName}/${fileName}`)
    }

    return NextResponse.json({ paths: savedPaths })
  } catch (error) {
    console.error('POST /api/mold-book/upload error:', error)
    return NextResponse.json({ error: 'Gagal upload foto' }, { status: 500 })
  }
}


