'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { GraduationCap, X, Heart, Code2, Building2, Sparkles, Calendar } from 'lucide-react'
import Image from 'next/image'

export default function CreditsModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [inputBuffer, setInputBuffer] = useState('')
  const secretKeyword = 'farrel'

  // Input listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
          triggerConfetti()
          setIsOpen(true)
          return ''
        }
        return newBuffer
      })
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const triggerConfetti = () => {
    const duration = 3500
    const end = Date.now() + duration
    const frame = () => {
      confetti({ particleCount: 6, angle: 60, spread: 60, origin: { x: 0 }, colors: ['#10b981', '#3b82f6', '#f59e0b'] })
      confetti({ particleCount: 6, angle: 120, spread: 60, origin: { x: 1 }, colors: ['#10b981', '#3b82f6', '#f59e0b'] })
      if (Date.now() < end) requestAnimationFrame(frame)
    }
    frame()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-slate-950/95 p-4 md:p-8 select-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Background Image with Factory & Deep Green Vibe */}
          <div className="absolute inset-0 bg-[url('/factory-bg.png')] bg-cover bg-center opacity-25 mix-blend-luminosity fixed-bg" />
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/90 via-slate-950/95 to-teal-950/90 backdrop-blur-[2px]" />
          
          {/* Decorative Glowing Orbs */}
          <div className="absolute top-1/4 left-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-teal-500/10 rounded-full blur-[100px] pointer-events-none" />

          {/* Close Button */}
          <button 
            onClick={() => setIsOpen(false)}
            className="absolute top-6 right-6 z-50 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full p-2.5 transition-all hover:scale-110 hover:rotate-90 duration-300 shadow-lg border border-white/20 cursor-pointer"
            title="Tutup (Close)"
          >
            <X size={24} />
          </button>

          {/* Cinematic Dashboard Container */}
          <div className="relative z-10 w-full max-w-6xl my-auto flex flex-col items-center justify-between py-6 min-h-[85vh]">
            
            {/* Top Title */}
            <motion.div 
              initial={{ opacity: 0, y: -40, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, type: "spring", bounce: 0.3 }}
              className="text-center mb-8 md:mb-12"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs md:text-sm font-bold tracking-widest uppercase mb-3 shadow-inner">
                <Sparkles size={14} className="animate-pulse" /> Digital Maintenance Solution
              </div>
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-tight uppercase leading-none drop-shadow-2xl font-sans">
                MAINTENANCE <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-200 to-white">
                  REPORT CREATOR
                </span>
              </h1>
            </motion.div>

            {/* Cards Collage Layout */}
            <div className="w-full flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-center max-w-5xl mx-auto my-4">
              
              {/* Left Side: Developer Info & Education (Span 7) */}
              <div className="lg:col-span-7 flex flex-col gap-6 w-full">
                
                {/* Card 1: Name & Role */}
                <motion.div 
                  initial={{ opacity: 0, x: -100 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.7, delay: 0.4, type: "spring", bounce: 0.35 }}
                  className="bg-gradient-to-br from-white via-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-3xl p-6 md:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/40 relative overflow-hidden group hover:scale-[1.01] transition-transform duration-300"
                >
                  <div className="absolute right-0 bottom-0 translate-x-1/4 translate-y-1/4 opacity-10 pointer-events-none">
                    <Code2 size={200} className="text-emerald-900 dark:text-emerald-300" />
                  </div>
                  
                  <div className="flex items-center gap-5 relative z-10">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 text-white flex-shrink-0 border-2 border-white/30 group-hover:rotate-6 transition-transform duration-300">
                      <Code2 size={36} />
                    </div>
                    <div>
                      <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 tracking-wider uppercase">Lead Architect & Developer</span>
                      <h2 className="text-2xl md:text-4xl font-black text-slate-800 dark:text-white tracking-tight mt-0.5">
                        Farrel Rizky Al Aqso
                      </h2>
                      <p className="text-sm md:text-base text-slate-600 dark:text-slate-300 font-medium mt-1">
                        Creator of Digitalized Mold Maintenance Report
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Card 2: Education */}
                <motion.div 
                  initial={{ opacity: 0, x: -100 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.7, delay: 0.8, type: "spring", bounce: 0.35 }}
                  className="bg-gradient-to-br from-white via-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-3xl p-6 md:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/40 relative overflow-hidden group hover:scale-[1.01] transition-transform duration-300 flex items-center justify-between gap-4"
                >
                  <div className="absolute left-0 top-0 -translate-x-1/3 -translate-y-1/3 opacity-10 pointer-events-none">
                    <GraduationCap size={180} className="text-orange-900 dark:text-orange-300" />
                  </div>

                  <div className="relative z-10">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 font-extrabold text-xs uppercase mb-2">
                      <GraduationCap size={14} /> Education
                    </div>
                    <h3 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-white leading-tight">
                      Politeknik Negeri Malang
                    </h3>
                    <p className="text-slate-700 dark:text-slate-200 font-bold text-sm md:text-base mt-2">
                      Sarjana Terapan Teknik Otomotif Elektronik
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                      Jurusan Mechanical Engineering
                    </p>
                  </div>

                  <div className="hidden sm:flex flex-shrink-0 w-16 h-16 rounded-2xl bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 items-center justify-center shadow-inner relative z-10 group-hover:scale-110 transition-transform duration-300">
                    <GraduationCap size={36} />
                  </div>
                </motion.div>
              </div>

              {/* Right Side: Role & Division (Span 5) */}
              <div className="lg:col-span-5 flex flex-col w-full h-full justify-center">
                
                {/* Card 3: Role, Division & Company */}
                <motion.div 
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.7, delay: 1.2, type: "spring", bounce: 0.35 }}
                  className="bg-gradient-to-br from-white via-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-3xl p-6 md:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/40 relative overflow-hidden flex flex-col justify-between h-full min-h-[280px] group hover:scale-[1.01] transition-transform duration-300"
                >
                  <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none">
                    <Building2 size={220} className="text-blue-900 dark:text-blue-300" />
                  </div>

                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 font-extrabold text-xs uppercase">
                        <Building2 size={14} /> Role & Division
                      </div>
                      
                      {/* Real PT Sugity Creatives Logo */}
                      <div className="w-14 h-14 bg-white rounded-xl shadow-md border border-slate-200 p-1.5 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 overflow-hidden">
                        <Image 
                          src="/logo-sugity.jpg" 
                          alt="PT Sugity Creatives" 
                          width={80} 
                          height={80} 
                          className="object-contain w-full h-full"
                        />
                      </div>
                    </div>

                    <h3 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white mb-1">
                      PKL Molding Maintenance Division
                    </h3>
                    <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mb-6">
                      PT Sugity Creatives
                    </p>
                  </div>

                  <div className="relative z-10 pt-4 border-t border-slate-200 dark:border-slate-700/60 mt-auto">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <Calendar size={20} />
                      </div>
                      <div>
                        <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Project Period</p>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">22 Juni 2026 - 31 Oktober 2026</p>
                      </div>
                    </div>
                  </div>
                </motion.div>

              </div>

            </div>

            {/* Bottom Quote & Footer */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.6, ease: "easeOut" }}
              className="w-full text-center mt-10 flex flex-col items-center gap-4"
            >
              <p className="text-lg md:text-2xl lg:text-3xl font-medium text-white/90 italic drop-shadow-lg max-w-3xl leading-relaxed">
                "Digitalizing maintenance for a better and efficient future."
              </p>
              
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 backdrop-blur-md text-white font-bold text-xs md:text-sm tracking-widest uppercase shadow-xl transition-all">
                Made with <Heart size={16} className="text-red-500 fill-red-500 animate-pulse mx-0.5" /> by Farrel Rizky Al Aqso
              </div>
            </motion.div>
            
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
