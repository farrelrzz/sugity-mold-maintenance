'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { Code2, GraduationCap, Wrench, Calendar, X, Sparkles, Heart } from 'lucide-react'

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
    const duration = 3000
    const end = Date.now() + duration

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#3b82f6', '#8b5cf6', '#ec4899']
      })
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#3b82f6', '#8b5cf6', '#ec4899']
      })

      if (Date.now() < end) {
        requestAnimationFrame(frame)
      }
    }
    frame()
  }

  // Animation variants
  const backdropVariants: any = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  }

  const modalVariants: any = {
    hidden: { scale: 0.8, opacity: 0, y: 50 },
    visible: { 
      scale: 1, 
      opacity: 1, 
      y: 0,
      transition: { 
        type: 'spring', 
        damping: 25, 
        stiffness: 300,
        staggerChildren: 0.1,
        delayChildren: 0.2
      } 
    },
    exit: { scale: 0.8, opacity: 0, y: 50, transition: { duration: 0.2 } }
  }

  const itemVariants: any = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 300 } }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          {/* Animated blurred background */}
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setIsOpen(false)} />

          <motion.div 
            className="relative w-full max-w-xl bg-white/70 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2rem] shadow-2xl overflow-hidden border border-white/50 dark:border-slate-700/50"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Ambient Background Glows */}
            <div className="absolute top-0 -left-1/4 w-96 h-96 bg-blue-500/30 rounded-full mix-blend-multiply filter blur-[80px] animate-blob" />
            <div className="absolute top-0 -right-1/4 w-96 h-96 bg-purple-500/30 rounded-full mix-blend-multiply filter blur-[80px] animate-blob animation-delay-2000" />
            <div className="absolute -bottom-32 left-1/4 w-96 h-96 bg-pink-500/30 rounded-full mix-blend-multiply filter blur-[80px] animate-blob animation-delay-4000" />

            <div className="relative z-10">
              {/* Header section with gradient */}
              <div className="relative h-40 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 overflow-hidden">
                {/* Overlay patterns */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                
                <button 
                  onClick={() => setIsOpen(false)}
                  className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full p-2 transition-all hover:rotate-90 duration-300"
                >
                  <X size={20} />
                </button>

                <motion.div 
                  className="absolute bottom-4 left-6 right-6 flex justify-between items-end"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="text-white">
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles size={16} className="text-yellow-300 animate-pulse" />
                      <span className="text-xs font-bold tracking-widest text-yellow-300 uppercase">Creator</span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                      Farrel Rizky Al Aqso
                    </h2>
                  </div>
                </motion.div>
              </div>

              {/* Profile Avatar floating over the border */}
              <motion.div 
                className="absolute top-28 right-8"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.4 }}
              >
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-4 border-white/80 dark:border-slate-800/80 bg-gradient-to-br from-blue-100 to-indigo-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center shadow-xl rotate-3 transform hover:rotate-6 transition-transform">
                  <Code2 size={40} className="text-blue-600 dark:text-blue-400" />
                </div>
              </motion.div>

              {/* Body Content */}
              <div className="p-6 sm:p-8 pt-10">
                <div className="space-y-4">
                  <motion.div variants={itemVariants} className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-center gap-5 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm transition-all hover:shadow-lg hover:-translate-y-1">
                      <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-300">
                        <GraduationCap className="text-blue-600 dark:text-blue-400" size={24} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-blue-500 dark:text-blue-400 uppercase tracking-wider mb-1">Education</p>
                        <p className="text-base font-bold text-slate-800 dark:text-white">
                          Politeknik Negeri Malang
                        </p>
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                          Sarjana Terapan Teknik Otomotif Elektronik
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Jurusan Mechanical Engineering
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div variants={itemVariants} className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-center gap-5 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm transition-all hover:shadow-lg hover:-translate-y-1">
                      <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center flex-shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-300">
                        <Wrench className="text-orange-600 dark:text-orange-400" size={24} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-orange-500 dark:text-orange-400 uppercase tracking-wider mb-1">Role & Division</p>
                        <p className="text-base font-bold text-slate-800 dark:text-white">
                          PKL Molding Maintenance Division
                        </p>
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                          PT Sugity Creatives
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div variants={itemVariants} className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-center gap-5 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm transition-all hover:shadow-lg hover:-translate-y-1">
                      <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center flex-shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-300">
                        <Calendar className="text-emerald-600 dark:text-emerald-400" size={24} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-wider mb-1">Project Period</p>
                        <p className="text-base font-bold text-slate-800 dark:text-white">
                          22 Juni 2026 - 31 Oktober 2026
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </div>
                
                <motion.div 
                  variants={itemVariants}
                  className="mt-8 text-center"
                >
                  <div className="inline-flex flex-col items-center justify-center p-4 bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 w-full">
                    <p className="text-sm text-slate-600 dark:text-slate-300 font-medium italic mb-3">
                      "Digitalizing maintenance for a better and efficient future."
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest font-bold bg-white dark:bg-slate-900 px-4 py-1.5 rounded-full shadow-sm">
                      Made with <Heart size={14} className="text-red-500 fill-red-500 animate-pulse" /> by Farrel
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
