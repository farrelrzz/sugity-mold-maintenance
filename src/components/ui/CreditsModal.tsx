'use client'

import React, { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import Image from 'next/image'

export default function CreditsModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [inputBuffer, setInputBuffer] = useState('')
  const [showLogo, setShowLogo] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
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
          setIsOpen(true)
          setShowLogo(false)
          return ''
        }
        return newBuffer
      })
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Sync logo overlay with video playback and handle reliable autoplay
  useEffect(() => {
    if (!isOpen) return
    const video = videoRef.current
    if (!video) return

    // Attempt to play immediately when modal opens; fallback to muted if blocked by browser
    const startPlay = async () => {
      try {
        await video.play()
      } catch (err) {
        console.log('Autoplay with sound blocked, falling back to muted play:', err)
        video.muted = true
        await video.play()
      }
    }
    startPlay()

    const handleTimeUpdate = () => {
      // The Role & Division card slides in around 5.5s to 6.0s
      if (video.currentTime >= 5.8) {
        setShowLogo(true)
      } else {
        setShowLogo(false)
      }
    }

    video.addEventListener('timeupdate', handleTimeUpdate)
    return () => video.removeEventListener('timeupdate', handleTimeUpdate)
  }, [isOpen])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 z-[9999] bg-black flex items-center justify-center overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Close Button */}
          <button 
            onClick={() => setIsOpen(false)}
            className="absolute top-6 right-6 z-50 text-white/60 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full p-2 transition-all hover:rotate-90 duration-300"
          >
            <X size={24} />
          </button>

          {/* Video Container to maintain 16:9 aspect ratio */}
          <div className="relative w-full max-w-[100vw] max-h-[100vh] aspect-video flex items-center justify-center">
            
            <video 
              ref={videoRef}
              src="/credits-video.mp4" 
              autoPlay 
              playsInline
              controls={false}
              className="w-full h-full object-contain"
              onEnded={() => {
                // Keep video on last frame when ended
                if (videoRef.current) {
                  videoRef.current.pause();
                }
              }}
            />

            {/* Logo Overlay - carefully positioned to cover the generic logo in the video */}
            <AnimatePresence>
              {showLogo && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.5, x: -50 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                  className="absolute z-10 bg-white rounded-full flex items-center justify-center shadow-2xl p-1 overflow-hidden border-2 border-slate-100"
                  style={{
                    // These percentages target the location of the generic logo on the 16:9 video frame
                    left: '52.5%', 
                    top: '49%',
                    width: '14.5%', 
                    height: 'auto',
                    aspectRatio: '1/1',
                    transform: 'translate(0, -50%)' // Center vertically relative to top
                  }}
                >
                  <Image 
                    src="/logo-sugity.jpg" 
                    alt="PT Sugity Creatives" 
                    width={200} 
                    height={200} 
                    className="object-contain w-full h-full rounded-full scale-90"
                  />
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
