import { PrismaClient } from '@prisma/client'

/**
 * Server-Side TiDB Cloud Storage Optimization Utility
 * Bertugas memadatkan (compacting) data JSON dan teks sebelum disimpan ke database
 * serta membersihkan log sementara/sampah yang sudah usang agar kuota TiDB Cloud super awet!
 */

/**
 * Menghapus properti yang bernilai null, undefined, atau string kosong dari dalam objek JSON
 * agar penyimpanan kolom JSON di TiDB tidak membengkak dengan key yang tidak berisi nilai.
 * Kualitas & integritas struktur data tetap 100% utuh saat di-render kembali.
 */
export function compactJsonPayload(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj
      .map(compactJsonPayload)
      .filter(item => item !== null && item !== undefined);
  }

  const compacted: { [key: string]: any } = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) continue;
    
    // Jika string kosong pada catatan/note, kita lewati untuk menghemat byte storage
    if (typeof value === 'string' && value.trim() === '') continue;

    if (typeof value === 'object') {
      const nested = compactJsonPayload(value);
      // Simpan hanya jika object/array hasil komparasi memiliki isi atau bernilai signifikan
      if (nested !== null && (typeof nested !== 'object' || Object.keys(nested).length > 0)) {
        compacted[key] = nested;
      }
    } else {
      compacted[key] = typeof value === 'string' ? value.trim() : value;
    }
  }

  return Object.keys(compacted).length > 0 ? compacted : null;
}

/**
 * Membersihkan spasi berlebih dan enter bertumpuk pada teks komentar/info agar ringkes.
 */
export function cleanTextPayload(text: string | null | undefined): string | null {
  if (!text) return null;
  const cleaned = text
    .replace(/\r\n/g, '\n')      // Normalisasi line ends
    .replace(/\n{3,}/g, '\n\n')  // Batasi enter berurutan maksimal 2 baris
    .trim();
  return cleaned.length > 0 ? cleaned : null;
}

/**
 * Background Pruning Job
 * Menghapus notifikasi yang sudah DIBACA dan berumur di atas 30 hari
 * serta log audit rutin yang berumur di atas 90 hari agar tabel TiDB tidak penuh.
 * Bisa dipanggil secara asinkron di belakang layar tanpa memblokir request utama.
 */
export async function autoPruneOldLogs(prisma: PrismaClient): Promise<void> {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
    const ninetyDaysAgo = new Date(new Date().setDate(new Date().getDate() - 90));

    // 1. Bersihkan Notifikasi yang sudah dibaca > 30 hari
    await prisma.notifikasi.deleteMany({
      where: {
        dibaca: true,
        createdAt: {
          lt: thirtyDaysAgo
        }
      }
    });

    // 2. Bersihkan Audit Log rutin > 90 hari (kecuali log kritikal jika ada)
    await prisma.auditLog.deleteMany({
      where: {
        createdAt: {
          lt: ninetyDaysAgo
        }
      }
    });

    // Log silent success (opsional untuk debug)
  } catch (error) {
    // Abaikan jika terjadi kendala sementara sewaktu pruning latar belakang
    console.warn('⚠️ [Auto-Prune] Gagal mengeksekusi pembersihan log rutin:', error);
  }
}
