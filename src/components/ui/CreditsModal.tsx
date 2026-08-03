'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { Code2, GraduationCap, X, Heart, Building2 } from 'lucide-react'
import Image from 'next/image'

export default function CreditsModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState(0)
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
          setStep(1) // Start sequence
          return ''
        }
        return newBuffer
      })
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Sequence controller
  useEffect(() => {
    if (!isOpen) {
      setStep(0)
      return
    }

    let timer: NodeJS.Timeout
    if (step === 1) {
      timer = setTimeout(() => setStep(2), 3000) // Title -> Card 1
    } else if (step === 2) {
      timer = setTimeout(() => setStep(3), 3500) // Card 1 -> Card 2
    } else if (step === 3) {
      timer = setTimeout(() => setStep(4), 3500) // Card 2 -> Card 3
    } else if (step === 4) {
      timer = setTimeout(() => setStep(5), 4000) // Card 3 -> Quote
    }

    return () => clearTimeout(timer)
  }, [isOpen, step])

  const triggerConfetti = () => {
    const duration = 3000
    const end = Date.now() + duration

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#10b981', '#3b82f6', '#f59e0b']
      })
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#10b981', '#3b82f6', '#f59e0b']
      })

      if (Date.now() < end) {
        requestAnimationFrame(frame)
      }
    }
    frame()
  }

  const slideVariants: any = {
    enter: { x: 300, opacity: 0, scale: 0.9 },
    center: { 
      x: 0, 
      opacity: 1, 
      scale: 1,
      transition: { type: 'spring', damping: 25, stiffness: 200 }
    },
    exit: { 
      x: -300, 
      opacity: 0, 
      scale: 0.9,
      transition: { duration: 0.4, ease: 'easeInOut' } 
    }
  }

  const fadeVariants: any = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.8, ease: 'easeOut' }
    },
    exit: { opacity: 0, transition: { duration: 0.5 } }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-teal-950/90 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Background Image with Tint */}
          <div 
            className="absolute inset-0 bg-[url('/factory-bg.png')] bg-cover bg-center opacity-30 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-teal-900/50 to-slate-900/80" />

          {/* Close / Skip Button */}
          <button 
            onClick={() => setIsOpen(false)}
            className="absolute top-6 right-6 z-50 text-white/60 hover:text-white bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full p-2 transition-all hover:rotate-90 duration-300"
          >
            <X size={24} />
          </button>
          
          {step < 5 && (
             <button 
               onClick={() => setStep(5)}
               className="absolute bottom-6 right-6 z-50 text-white/50 hover:text-white text-sm uppercase tracking-widest font-bold tracking-widest transition-colors"
             >
               Skip to End →
             </button>
          )}

          {/* Cinematic Container */}
          <div className="relative z-10 w-full max-w-4xl px-4 flex flex-col items-center justify-center min-h-[400px]">
            
            <AnimatePresence mode="wait">
              {/* Step 1: Title */}
              {step === 1 && (
                <motion.div 
                  key="title"
                  variants={fadeVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="text-center"
                >
                  <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight uppercase leading-tight drop-shadow-2xl">
                    Maintenance <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">
                      Report Creator
                    </span>
                  </h1>
                </motion.div>
              )}

              {/* Step 2: Name Card */}
              {step === 2 && (
                <motion.div 
                  key="card1"
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="w-full max-w-2xl bg-white/95 backdrop-blur-xl rounded-[2rem] p-8 md:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/20 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl"></div>
                  <div className="flex flex-col md:flex-row items-center gap-8">
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-gradient-to-br from-teal-50 to-emerald-100 flex items-center justify-center shadow-inner flex-shrink-0 border-4 border-white">
                      <Code2 size={48} className="text-teal-600" />
                    </div>
                    <div className="text-center md:text-left">
                      <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 mb-2">
                        Farrel Rizky Al Aqso
                      </h2>
                      <p className="text-lg md:text-xl font-medium text-teal-600 uppercase tracking-wider">
                        Lead Developer & Creator
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Education */}
              {step === 3 && (
                <motion.div 
                  key="card2"
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="w-full max-w-2xl bg-white/95 backdrop-blur-xl rounded-[2rem] p-8 md:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/20 relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 -mt-16 -ml-16 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl"></div>
                  <div className="flex flex-col md:flex-row items-center gap-8">
                    <div className="text-center md:text-left flex-1">
                      <p className="text-xl font-bold text-orange-500 uppercase tracking-widest mb-4">Education</p>
                      <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 mb-3">
                        Politeknik Negeri Malang
                      </h2>
                      <p className="text-lg text-slate-600 font-medium leading-relaxed">
                        Sarjana Terapan Teknik Otomotif Elektronik<br/>
                        <span className="text-slate-500 text-base">Jurusan Mechanical Engineering</span>
                      </p>
                    </div>
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-gradient-to-br from-orange-50 to-amber-100 flex items-center justify-center shadow-inner flex-shrink-0 border-4 border-white">
                      <GraduationCap size={48} className="text-orange-500" />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 4: Role & Division with Logo */}
              {step === 4 && (
                <motion.div 
                  key="card3"
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="w-full max-w-2xl bg-white/95 backdrop-blur-xl rounded-[2rem] p-8 md:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/20 relative overflow-hidden"
                >
                  <div className="absolute bottom-0 right-0 -mb-16 -mr-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
                  <div className="flex flex-col md:flex-row items-center gap-8">
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-white flex items-center justify-center shadow-md flex-shrink-0 overflow-hidden border-4 border-slate-100 p-2">
                      <Image 
                        src="/logo-sugity.jpg" 
                        alt="PT Sugity Creatives" 
                        width={100} 
                        height={100} 
                        className="object-contain w-full h-full"
                      />
                    </div>
                    <div className="text-center md:text-left flex-1">
                      <p className="text-xl font-bold text-blue-600 uppercase tracking-widest mb-4 flex items-center justify-center md:justify-start gap-2">
                        <Building2 size={24} /> Role & Division
                      </p>
                      <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 mb-2">
                        PKL Molding Maintenance Division
                      </h2>
                      <p className="text-lg text-slate-700 font-bold mb-4">
                        PT Sugity Creatives
                      </p>
                      <div className="inline-block bg-blue-50 px-4 py-2 rounded-xl">
                        <p className="text-xs text-blue-500 font-bold uppercase tracking-wider mb-1">Project Period</p>
                        <p className="text-sm font-semibold text-blue-900">22 Juni 2026 - 31 Oktober 2026</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 5: Final Quote */}
              {step === 5 && (
                <motion.div 
                  key="quote"
                  variants={fadeVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="text-center w-full max-w-4xl"
                >
                  <div className="relative">
                    <span className="absolute -top-10 -left-6 md:-left-12 text-6xl md:text-8xl text-teal-500/30 font-serif">"</span>
                    <h2 className="text-2xl md:text-4xl lg:text-5xl font-medium text-white italic leading-relaxed drop-shadow-lg px-8">
                      Digitalizing maintenance for a better and efficient future.
                    </h2>
                    <span className="absolute -bottom-12 -right-6 md:-right-12 text-6xl md:text-8xl text-teal-500/30 font-serif">"</span>
                  </div>
                  
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1, type: 'spring' }}
                    className="mt-16 inline-flex items-center gap-2 text-sm md:text-base text-white/80 uppercase tracking-[0.3em] font-bold bg-black/30 px-6 py-3 rounded-full backdrop-blur-md border border-white/10"
                  >
                    Made with <Heart size={18} className="text-red-500 fill-red-500 animate-pulse" /> by Farrel
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
            
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
