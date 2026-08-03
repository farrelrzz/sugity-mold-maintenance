'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { GraduationCap, X, Heart } from 'lucide-react'
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
    const duration = 3000
    const end = Date.now() + duration
    const frame = () => {
      confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#10b981', '#3b82f6', '#f59e0b'] })
      confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#10b981', '#3b82f6', '#f59e0b'] })
      if (Date.now() < end) requestAnimationFrame(frame)
    }
    frame()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Background Image with Tint */}
          <div className="absolute inset-0 bg-[url('/factory-bg.png')] bg-cover bg-center" />
          <div className="absolute inset-0 bg-[#4e6b5d]/80 mix-blend-multiply" /> {/* Greenish factory tint matching the video */}

          {/* Close Button */}
          <button 
            onClick={() => setIsOpen(false)}
            className="absolute top-6 right-6 z-50 text-white/60 hover:text-white bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full p-2 transition-all hover:rotate-90 duration-300"
          >
            <X size={24} />
          </button>

          {/* Cinematic Container */}
          <div className="relative z-10 w-full max-w-6xl h-full flex flex-col items-center p-8">
            
            {/* Title (Moves to top) */}
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 1.2 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="mt-10 mb-12 text-center"
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight uppercase leading-tight drop-shadow-xl font-sans">
                MAINTENANCE <br />
                REPORT CREATOR
              </h1>
            </motion.div>

            {/* Collage Area */}
            <div className="relative w-full flex-1 flex flex-col md:flex-row items-center justify-center md:items-start gap-6 md:gap-10">
              
              {/* Left Column (Farrel Card + Education Card) */}
              <div className="flex flex-col gap-6 w-full max-w-md">
                {/* Card 1: Name */}
                <motion.div 
                  initial={{ opacity: 0, x: -100 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 1, type: "spring", bounce: 0.4 }}
                  className="bg-white rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden"
                  style={{ borderRadius: '2rem 2rem 2rem 1rem' }}
                >
                  <div className="absolute right-0 bottom-0 opacity-5 w-40 h-40 rounded-full border-[20px] border-black -mr-10 -mb-10"></div>
                  <h2 className="text-3xl font-bold text-slate-800 mb-1 font-sans">
                    Farrel Rizky Al Aqso
                  </h2>
                  <p className="text-lg text-slate-600 font-medium">
                    Lead Developer & Creator
                  </p>
                </motion.div>

                {/* Card 2: Education */}
                <motion.div 
                  initial={{ opacity: 0, x: -100 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 2, type: "spring", bounce: 0.4 }}
                  className="bg-white rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden flex items-center justify-between gap-4"
                  style={{ borderRadius: '1rem 2rem 2rem 2rem' }}
                >
                  <div className="absolute left-0 top-0 opacity-5 w-32 h-32 rounded-full border-[15px] border-green-800 -ml-8 -mt-8"></div>
                  <div className="relative z-10">
                    <h3 className="text-xl font-bold text-orange-500 mb-2">Education</h3>
                    <h2 className="text-2xl font-bold text-slate-800 mb-1">Politeknik Negeri Malang</h2>
                    <p className="text-slate-600 font-medium text-sm">Sarjana Terapan Teknik Otomotif Elektronik</p>
                    <p className="text-slate-500 text-sm">Jurusan Mechanical Engineering</p>
                  </div>
                  <div className="flex-shrink-0 relative z-10">
                    <GraduationCap size={70} strokeWidth={1} className="text-green-600 opacity-80" />
                  </div>
                </motion.div>
              </div>

              {/* Right Column (Role & Division + Quote) */}
              <div className="flex flex-col gap-6 w-full max-w-md pt-0 md:pt-12">
                {/* Card 3: Role & Division */}
                <motion.div 
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 3, type: "spring", bounce: 0.4 }}
                  className="bg-white/95 rounded-3xl p-6 shadow-2xl relative flex items-center gap-6"
                  style={{ borderRadius: '2rem 2rem 1rem 2rem' }}
                >
                  <div className="flex-shrink-0 w-24 h-24 bg-slate-900 rounded-full overflow-hidden flex items-center justify-center p-2 shadow-lg border-4 border-white">
                    <Image 
                      src="/logo-sugity.jpg" 
                      alt="PT Sugity Creatives" 
                      width={100} 
                      height={100} 
                      className="object-contain w-full h-full"
                    />
                  </div>
                  <div className="relative z-10">
                    <h3 className="text-xl font-bold text-orange-500 mb-1">Role & Division</h3>
                    <h2 className="text-xl font-bold text-slate-800 mb-1">PT Sugity Creatives</h2>
                    <p className="text-slate-700 font-semibold text-sm mb-2">PKL Molding Maintenance Division</p>
                    <div className="bg-green-100 rounded-xl px-3 py-1.5 inline-block">
                      <p className="text-xs font-bold text-green-700">Project Period</p>
                      <p className="text-xs font-semibold text-green-900">22 Juni 2026 - 31 Oktober 2026</p>
                    </div>
                  </div>
                </motion.div>
              </div>

            </div>

            {/* Bottom Quote */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 4 }}
              className="absolute bottom-12 w-full text-center px-4 flex flex-col items-center"
            >
              <h3 className="text-2xl md:text-3xl font-medium text-white italic drop-shadow-lg mb-6">
                "Digitalizing maintenance for a better and efficient future."
              </h3>
              
              <div className="inline-flex items-center gap-2 text-sm text-white/80 font-semibold tracking-wider">
                Made with <Heart size={16} className="text-red-500 fill-red-500 animate-pulse mx-1" /> by Farrel
              </div>
            </motion.div>
            
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
