'use client'

import React, { useEffect, useState } from 'react'
import { Code2, GraduationCap, Wrench, Calendar, X, Heart } from 'lucide-react'

export default function CreditsModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [inputBuffer, setInputBuffer] = useState('')
  const secretKeyword = 'farrel'

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input or textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return
      }

      setInputBuffer((prev) => {
        const newBuffer = (prev + e.key.toLowerCase()).slice(-secretKeyword.length)
        if (newBuffer === secretKeyword) {
          setIsOpen(true)
          return ''
        }
        return newBuffer
      })
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300">
      <div 
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-300"
      >
        {/* Decorative Top Banner */}
        <div className="h-32 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 relative">
          <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px]"></div>
          <button 
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/20 hover:bg-black/40 rounded-full p-1.5 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Profile Image/Avatar */}
        <div className="absolute top-16 left-1/2 -translate-x-1/2">
          <div className="w-24 h-24 rounded-full border-4 border-white dark:border-slate-900 bg-gradient-to-b from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center shadow-lg">
            <Code2 size={40} className="text-blue-600 dark:text-blue-400" />
          </div>
        </div>

        {/* Content */}
        <div className="pt-16 pb-8 px-8 text-center">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-1">
            Farrel Rizky Al Aqso
          </h2>
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-6 uppercase tracking-wider">
            System Developer & Creator
          </p>

          <div className="space-y-4 text-left">
            <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 group">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <GraduationCap className="text-indigo-600 dark:text-indigo-400" size={20} />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Education</p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Politeknik Negeri Malang
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Mechanical Engineering • Sarjana Terapan Teknik Otomotif Elektronik
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 group">
              <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <Wrench className="text-orange-600 dark:text-orange-400" size={20} />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Role & Division</p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  PKL Molding Maintenance Division
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  PT Sugity Creatives
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 group">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <Calendar className="text-emerald-600 dark:text-emerald-400" size={20} />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Project Period</p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  22 Juni 2026 - 31 Oktober 2026
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-8 text-center border-t border-slate-100 dark:border-slate-800 pt-6 flex flex-col items-center justify-center gap-2">
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium italic">
              "Digitalizing maintenance for a better and efficient future."
            </p>
            <div className="flex items-center gap-1 text-[10px] text-slate-400 uppercase tracking-widest font-semibold mt-2">
              Made with <Heart size={12} className="text-red-500 mx-1 fill-red-500 animate-pulse" /> by Farrel
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
