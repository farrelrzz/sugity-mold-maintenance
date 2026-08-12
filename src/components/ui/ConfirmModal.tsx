'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { AlertCircle, Trash2, X } from 'lucide-react'

interface ConfirmOptions {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info'
}

let confirmGlobal: ((options: ConfirmOptions) => Promise<boolean>) | null = null

export function confirmDialog(options: ConfirmOptions): Promise<boolean> {
  if (!confirmGlobal) return Promise.resolve(window.confirm(options.message))
  return confirmGlobal(options)
}

export function ConfirmModalProvider() {
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<ConfirmOptions>({ title: '', message: '' })
  const [resolver, setResolver] = useState<{ resolve: (value: boolean) => void } | null>(null)

  const showConfirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts)
    setIsOpen(true)
    return new Promise<boolean>((resolve) => {
      setResolver({ resolve })
    })
  }, [])

  useEffect(() => {
    confirmGlobal = showConfirm
    return () => {
      confirmGlobal = null
    }
  }, [showConfirm])

  const handleConfirm = () => {
    setIsOpen(false)
    resolver?.resolve(true)
  }

  const handleCancel = () => {
    setIsOpen(false)
    resolver?.resolve(false)
  }

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      backgroundColor: 'rgba(15, 23, 42, 0.4)',
      backdropFilter: 'blur(4px)',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        overflow: 'hidden',
        animation: 'slideUpScale 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '16px',
              background: options.type === 'danger' ? '#fee2e2' : options.type === 'warning' ? '#fef3c7' : '#e0e7ff',
              color: options.type === 'danger' ? '#ef4444' : options.type === 'warning' ? '#f59e0b' : '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              {options.type === 'danger' ? <Trash2 size={24} /> : <AlertCircle size={24} />}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                {options.title}
              </h3>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: '14.5px', color: '#475569', lineHeight: 1.5 }}>
            {options.message}
          </p>
        </div>
        <div style={{
          background: '#f8fafc',
          padding: '16px 24px',
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end',
          borderTop: '1px solid #f1f5f9'
        }}>
          <button
            onClick={handleCancel}
            style={{
              padding: '10px 18px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: 700,
              color: '#475569',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#f1f5f9'}
            onMouseOut={(e) => e.currentTarget.style.background = '#ffffff'}
          >
            {options.cancelText || 'Batal'}
          </button>
          <button
            onClick={handleConfirm}
            style={{
              padding: '10px 20px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: 700,
              color: '#ffffff',
              background: options.type === 'danger' ? '#ef4444' : '#3b82f6',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: options.type === 'danger' ? '0 4px 12px rgba(239, 68, 68, 0.25)' : '0 4px 12px rgba(59, 130, 246, 0.25)'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            {options.confirmText || 'Ya, Hapus'}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUpScale {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  )
}
