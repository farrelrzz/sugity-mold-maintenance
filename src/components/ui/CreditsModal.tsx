'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { 
  GraduationCap, X, Heart, Code2, Building2, Sparkles, 
  Calendar, ChevronRight, ChevronLeft, Award, CheckCircle2, Terminal, Lightbulb
} from 'lucide-react'
import Image from 'next/image'

export default function CreditsModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [inputBuffer, setInputBuffer] = useState('')
  const [currentSlide, setCurrentSlide] = useState(0)
  const [direction, setDirection] = useState(1)
  const secretKeyword = 'farrel'
  const totalSlides = 4

  // Trigger celebratory confetti
  const triggerConfetti = useCallback(() => {
    const duration = 2500
    const end = Date.now() + duration
    const frame = () => {
      confetti({ particleCount: 6, angle: 60, spread: 60, origin: { x: 0 }, colors: ['#10b981', '#3b82f6', '#f59e0b'] })
      confetti({ particleCount: 6, angle: 120, spread: 60, origin: { x: 1 }, colors: ['#10b981', '#3b82f6', '#f59e0b'] })
      if (Date.now() < end) requestAnimationFrame(frame)
    }
    frame()
  }, [])

  // Input listener for secret keyword
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
          setCurrentSlide(0)
          setIsOpen(true)
          triggerConfetti()
          return ''
        }
        return newBuffer
      })
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [triggerConfetti])

  // Slide navigation handlers
  const handleNext = useCallback(() => {
    if (currentSlide < totalSlides - 1) {
      setDirection(1)
      setCurrentSlide(prev => {
        const next = prev + 1
        if (next === totalSlides - 1) triggerConfetti()
        return next
      })
    } else {
      setIsOpen(false)
    }
  }, [currentSlide, triggerConfetti])

  const handlePrev = useCallback(() => {
    if (currentSlide > 0) {
      setDirection(-1)
      setCurrentSlide(prev => prev - 1)
    }
  }, [currentSlide])

  // Keyboard controls for presentation (PowerPoint behavior)
  useEffect(() => {
    if (!isOpen) return
    const handleSlideKeys = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        handleNext()
      } else if (e.key === 'ArrowLeft' || e.key === 'Backspace') {
        e.preventDefault()
        handlePrev()
      } else if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }
    window.addEventListener('keydown', handleSlideKeys)
    return () => window.removeEventListener('keydown', handleSlideKeys)
  }, [isOpen, handleNext, handlePrev])

  if (!isOpen) return null

  // Slide transition variants
  const slideVariants: any = {
    enter: (dir: number) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.95
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -300 : 300,
      opacity: 0,
      scale: 0.95,
      transition: { duration: 0.3 }
    })
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-between overflow-hidden bg-slate-950 p-4 md:p-10 select-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Background Layer (Cinematic Dark with Subtle Green Vibe) */}
          <div className="absolute inset-0 bg-[url('/factory-bg.png')] bg-cover bg-center opacity-15 mix-blend-luminosity pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/80 via-slate-950/95 to-slate-950 pointer-events-none" />
          
          {/* Decorative Glowing Orbs */}
          <div className="absolute top-10 left-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-teal-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />

          {/* Header Bar */}
          <div className="relative z-20 w-full max-w-5xl flex items-center justify-between py-2 border-b border-white/10 text-white/80">
            <div className="flex items-center gap-2 text-xs md:text-sm font-bold tracking-widest uppercase text-emerald-400">
              <Sparkles size={16} className="text-emerald-400 animate-spin-slow" /> 
              <span>System Creator Presentation</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs font-semibold text-slate-400 px-3 py-1 bg-white/5 rounded-full border border-white/10 hidden sm:inline-block">
                Press <b>→</b> or <b>Space</b> for Next Slide
              </span>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-white/60 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full p-2 transition-all hover:scale-110 hover:rotate-90 duration-200"
                title="Exit Presentation"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Main Slide Stage */}
          <div className="relative z-10 w-full max-w-5xl flex-1 flex items-center justify-center overflow-hidden my-4">
            <AnimatePresence custom={direction} mode="wait">
              
              {/* SLIDE 0: TITLE & DEVELOPER INTRO */}
              {currentSlide === 0 && (
                <motion.div 
                  key="slide-0"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="w-full max-w-4xl bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl rounded-3xl p-8 md:p-14 border border-white/20 shadow-[0_25px_60px_rgba(0,0,0,0.7)] text-center flex flex-col items-center justify-center relative overflow-hidden"
                >
                  <div className="absolute -right-20 -bottom-20 opacity-10 pointer-events-none">
                    <Code2 size={400} className="text-emerald-300" />
                  </div>

                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center shadow-2xl shadow-emerald-500/30 text-white mb-6 border-2 border-white/30 animate-bounce">
                    <Code2 size={44} />
                  </div>

                  <span className="px-4 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 font-extrabold text-xs md:text-sm tracking-widest uppercase mb-4 shadow-sm">
                    Lead System Architect & Developer
                  </span>

                  <h1 className="text-3xl md:text-6xl font-black text-white tracking-tight uppercase leading-none drop-shadow-2xl font-sans mb-4">
                    Farrel Rizky Al Aqso
                  </h1>

                  <div className="h-1 w-24 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full my-4" />

                  <p className="text-base md:text-xl text-slate-300 max-w-2xl leading-relaxed font-medium">
                    The engineer behind the digital transformation of the <span className="text-emerald-400 font-bold">Molding Maintenance System</span>, upgrading traditional workflow into an automated high-efficiency web ecosystem.
                  </p>
                </motion.div>
              )}

              {/* SLIDE 1: EDUCATION BACKGROUND */}
              {currentSlide === 1 && (
                <motion.div 
                  key="slide-1"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="w-full max-w-4xl bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl rounded-3xl p-8 md:p-14 border border-white/20 shadow-[0_25px_60px_rgba(0,0,0,0.7)] flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden"
                >
                  <div className="absolute left-0 bottom-0 opacity-10 pointer-events-none">
                    <GraduationCap size={350} className="text-orange-300" />
                  </div>

                  <div className="w-full md:w-2/3 text-left relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-500/20 border border-orange-400/30 text-orange-300 font-extrabold text-xs tracking-wider uppercase mb-4">
                      <GraduationCap size={16} /> Academic Background
                    </div>

                    <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight mb-4">
                      State Polytechnic of Malang
                    </h2>

                    <div className="space-y-4 text-slate-200 mt-6">
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                        <p className="text-xs font-bold text-orange-400 uppercase tracking-widest">Major / Department</p>
                        <p className="text-lg md:text-2xl font-bold text-white mt-0.5">Mechanical Engineering</p>
                      </div>

                      <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                        <p className="text-xs font-bold text-orange-400 uppercase tracking-widest">Degree & Program</p>
                        <p className="text-lg md:text-xl font-bold text-white mt-0.5">
                          Bachelor of Applied Science in Automotive Electronic Engineering
                        </p>
                        <p className="text-xs text-slate-400 italic mt-1">(Sarjana Terapan Teknik Otomotif Elektronik)</p>
                      </div>
                    </div>
                  </div>

                  <div className="w-full md:w-1/3 flex items-center justify-center relative z-10">
                    <div className="w-44 h-44 rounded-3xl bg-gradient-to-br from-orange-500/20 to-amber-600/30 border-2 border-orange-400/40 shadow-2xl flex flex-col items-center justify-center text-orange-400 p-6 text-center">
                      <Award size={64} className="mb-2 text-amber-400" />
                      <span className="text-sm font-extrabold text-white">Excellence in Applied Engineering</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* SLIDE 2: INDUSTRIAL INTERNSHIP & COMPANY LOGO */}
              {currentSlide === 2 && (
                <motion.div 
                  key="slide-2"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="w-full max-w-4xl bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl rounded-3xl p-8 md:p-14 border border-white/20 shadow-[0_25px_60px_rgba(0,0,0,0.7)] flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden"
                >
                  <div className="absolute right-0 top-0 opacity-10 pointer-events-none">
                    <Building2 size={380} className="text-blue-300" />
                  </div>

                  <div className="w-full md:w-2/3 text-left relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/20 border border-blue-400/30 text-blue-300 font-extrabold text-xs tracking-wider uppercase mb-4">
                      <Building2 size={16} /> Professional Industrial Internship
                    </div>

                    <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight mb-2">
                      PT Sugity Creatives
                    </h2>
                    <p className="text-xl font-extrabold text-emerald-400 mb-6">
                      Molding Maintenance Division
                    </p>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3 bg-white/5 px-4 py-3 rounded-xl border border-white/10 text-slate-200">
                        <Calendar size={20} className="text-blue-400 flex-shrink-0" />
                        <div>
                          <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Assignment Period</p>
                          <p className="text-sm md:text-base font-bold text-white">June 22, 2026 – October 31, 2026</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 bg-white/5 px-4 py-3 rounded-xl border border-white/10 text-slate-200">
                        <Terminal size={20} className="text-emerald-400 flex-shrink-0" />
                        <div>
                          <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Key Contribution</p>
                          <p className="text-sm md:text-base font-bold text-white">Full-Stack Digitalization & Reporting Automation</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Real Corporate Logo */}
                  <div className="w-full md:w-1/3 flex items-center justify-center relative z-10">
                    <div className="w-48 h-48 bg-white rounded-3xl shadow-2xl border-4 border-slate-200 p-4 flex flex-col items-center justify-center">
                      <Image 
                        src="/logo-sugity.jpg" 
                        alt="PT Sugity Creatives" 
                        width={200} 
                        height={200} 
                        className="object-contain w-full h-full"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* SLIDE 3: VISION & FINAL STATEMENT */}
              {currentSlide === 3 && (
                <motion.div 
                  key="slide-3"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="w-full max-w-4xl bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl rounded-3xl p-8 md:p-16 border border-white/20 shadow-[0_25px_60px_rgba(0,0,0,0.7)] text-center flex flex-col items-center justify-center relative overflow-hidden"
                >
                  <div className="w-16 h-16 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center mb-6 shadow-lg animate-pulse">
                    <Heart size={32} className="fill-red-500/40" />
                  </div>

                  <h2 className="text-xs md:text-sm font-bold text-emerald-400 tracking-widest uppercase mb-4">
                    Engineering Vision
                  </h2>

                  <p className="text-2xl md:text-4xl font-extrabold text-white italic max-w-3xl leading-relaxed drop-shadow-lg mb-8">
                    "Digitalizing maintenance for a better and efficient future."
                  </p>

                  <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-bold text-sm tracking-wide uppercase shadow-2xl">
                    <CheckCircle2 size={18} className="text-emerald-400" /> Dedicated to Operational Excellence
                  </div>

                  <p className="text-slate-400 text-xs md:text-sm font-medium mt-8">
                    Thank you for experiencing the digital revolution of molding maintenance.
                  </p>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* PowerPoint Navigation Footer */}
          <div className="relative z-20 w-full max-w-5xl flex items-center justify-between pt-4 border-t border-white/10">
            
            {/* Slide Indicators */}
            <div className="flex items-center gap-2">
              {Array.from({ length: totalSlides }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setDirection(idx > currentSlide ? 1 : -1)
                    setCurrentSlide(idx)
                  }}
                  className={`h-2.5 transition-all rounded-full ${
                    idx === currentSlide 
                      ? 'w-10 bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.8)]' 
                      : 'w-2.5 bg-white/20 hover:bg-white/40'
                  }`}
                  title={`Go to Slide ${idx + 1}`}
                />
              ))}
              <span className="text-slate-400 font-bold text-xs ml-3 uppercase tracking-wider">
                Slide {currentSlide + 1} of {totalSlides}
              </span>
            </div>

            {/* Next / Prev Action Buttons */}
            <div className="flex items-center gap-3">
              <button 
                onClick={handlePrev}
                disabled={currentSlide === 0}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  currentSlide === 0 
                    ? 'opacity-30 cursor-not-allowed bg-white/5 text-slate-400 border border-white/5' 
                    : 'bg-white/10 hover:bg-white/20 text-white border border-white/20 shadow-md cursor-pointer active:scale-95'
                }`}
              >
                <ChevronLeft size={18} /> Previous
              </button>

              <button 
                onClick={handleNext}
                className={`flex items-center gap-1.5 px-6 py-2 rounded-xl text-sm font-black transition-all shadow-xl cursor-pointer active:scale-95 ${
                  currentSlide === totalSlides - 1
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white border border-emerald-300/50 shadow-emerald-500/30'
                    : 'bg-white text-slate-900 hover:bg-slate-200 font-extrabold'
                }`}
              >
                {currentSlide === totalSlides - 1 ? (
                  <>Finish & Exit <CheckCircle2 size={18} /></>
                ) : (
                  <>Next Slide <ChevronRight size={18} /></>
                )}
              </button>
            </div>

          </div>

        </motion.div>
      )}
    </AnimatePresence>
  )
}
