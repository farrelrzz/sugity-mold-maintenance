'use client'

import { useState, useEffect, useCallback } from 'react'

interface ToastState {
  message: string
  type: 'sukses' | 'error' | 'info'
  visible: boolean
}

let toastSetterGlobal: ((msg: string, type?: 'sukses' | 'error' | 'info') => void) | null = null

export function showToast(message: string, type: 'sukses' | 'error' | 'info' = 'sukses') {
  toastSetterGlobal?.(message, type)
}

export function Toast() {
  const [toast, setToast] = useState<ToastState>({
    message: '',
    type: 'sukses',
    visible: false,
  })
  const timerRef = { current: null as ReturnType<typeof setTimeout> | null }

  const show = useCallback((message: string, type: 'sukses' | 'error' | 'info' = 'sukses') => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setToast({ message, type, visible: true })
    timerRef.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }))
    }, 3000)
  }, [])

  useEffect(() => {
    toastSetterGlobal = show
    return () => {
      toastSetterGlobal = null
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [show])

  return (
    <div
      className={`toast ${toast.visible ? 'tampil' : ''} ${toast.type === 'error' ? 'error' : ''}`}
      role="status"
      aria-live="polite"
    >
      {toast.message}
    </div>
  )
}
