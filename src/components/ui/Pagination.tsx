import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  currentPage: number
  totalItems: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  onItemsPerPageChange?: (itemsPerPage: number) => void
  itemLabel?: string
  pageSizeOptions?: number[]
}

export default function Pagination({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  itemLabel = 'data',
  pageSizeOptions = [5, 6, 8, 10, 20, 50]
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(totalItems, currentPage * itemsPerPage)

  if (totalItems === 0) return null

  // Generate page numbers to show (max 5 buttons around current page)
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages)
      }
    }
    return pages
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '16px',
      padding: '12px 4px 4px 4px',
      margin: '4px 0 0 0',
      width: '100%',
      boxSizing: 'border-box',
      borderTop: '1px dashed #e2e8f0',
      fontFamily: 'inherit'
    }}>
      {/* Kiri: Keterangan Data & Pilihan Tampilan yang Lebih Halus */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', fontSize: '13.5px', color: '#64748b' }}>
        <span>
          Menampilkan <strong style={{ color: '#0f172a', fontWeight: 700 }}>{startItem}-{endItem}</strong> dari <strong style={{ color: '#0f172a', fontWeight: 700 }}>{totalItems}</strong> {itemLabel}
        </span>

        {onItemsPerPageChange && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: '#f1f5f9',
            padding: '4px 12px',
            borderRadius: '20px',
            border: '1px solid transparent',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#e2e8f0'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#f1f5f9'; }}
          >
            <span style={{ fontSize: '12.5px', color: '#64748b', fontWeight: 600 }}>Tampilkan:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                onItemsPerPageChange(Number(e.target.value))
                onPageChange(1)
              }}
              style={{
                border: 'none',
                background: 'transparent',
                fontWeight: 700,
                fontSize: '13px',
                color: '#0f172a',
                outline: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit'
              }}
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Kanan: Navigasi Minimalis Ala Apple / Vercel */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {/* Tombol Previous */}
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 12px',
            borderRadius: '20px',
            border: 'none',
            background: 'transparent',
            color: currentPage <= 1 ? '#cbd5e1' : '#475569',
            fontWeight: 600,
            fontSize: '13px',
            cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            opacity: currentPage <= 1 ? 0.6 : 1
          }}
          onMouseEnter={(e) => {
            if (currentPage > 1) {
              e.currentTarget.style.background = '#f1f5f9'
              e.currentTarget.style.color = '#0f172a'
            }
          }}
          onMouseLeave={(e) => {
            if (currentPage > 1) {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = '#475569'
            }
          }}
        >
          <ChevronLeft size={16} />
          <span>Sebelumnya</span>
        </button>

        {/* Nomor Halaman dengan Pill Mewah */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', margin: '0 4px' }}>
          {getPageNumbers().map((page, idx) => {
            if (page === '...') {
              return (
                <span key={`dots-${idx}`} style={{ padding: '0 6px', color: '#94a3b8', fontWeight: 700, fontSize: '13px' }}>
                  •••
                </span>
              )
            }
            const isCurrent = page === currentPage
            return (
              <button
                key={`page-${page}`}
                type="button"
                onClick={() => typeof page === 'number' && onPageChange(page)}
                style={{
                  minWidth: '34px',
                  height: '34px',
                  padding: '0 8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '10px',
                  border: 'none',
                  background: isCurrent ? 'var(--hijau-tua, #047857)' : 'transparent',
                  color: isCurrent ? '#ffffff' : '#475569',
                  fontWeight: isCurrent ? 700 : 600,
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.2, 1.25, 0.4, 1)',
                  boxShadow: isCurrent ? '0 3px 10px rgba(4, 120, 87, 0.25)' : 'none',
                  transform: isCurrent ? 'scale(1.02)' : 'none'
                }}
                onMouseEnter={(e) => {
                  if (!isCurrent) {
                    e.currentTarget.style.background = '#f1f5f9'
                    e.currentTarget.style.color = '#0f172a'
                    e.currentTarget.style.transform = 'translateY(-1px)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isCurrent) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = '#475569'
                    e.currentTarget.style.transform = 'none'
                  }
                }}
              >
                {page}
              </button>
            )
          })}
        </div>

        {/* Tombol Next */}
        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 12px',
            borderRadius: '20px',
            border: 'none',
            background: 'transparent',
            color: currentPage >= totalPages ? '#cbd5e1' : '#475569',
            fontWeight: 600,
            fontSize: '13px',
            cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            opacity: currentPage >= totalPages ? 0.6 : 1
          }}
          onMouseEnter={(e) => {
            if (currentPage < totalPages) {
              e.currentTarget.style.background = '#f1f5f9'
              e.currentTarget.style.color = '#0f172a'
            }
          }}
          onMouseLeave={(e) => {
            if (currentPage < totalPages) {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = '#475569'
            }
          }}
        >
          <span>Berikutnya</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
