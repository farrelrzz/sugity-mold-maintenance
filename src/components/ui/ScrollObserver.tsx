'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function ScrollObserver() {
  const pathname = usePathname()

  useEffect(() => {
    // 1. Setup Intersection Observer
    const scrollContainer = document.querySelector('.konten');
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            // Option to unobserve if we only want it to animate once
            // observer.unobserve(entry.target)
          } else {
            // Remove if we want the animation to re-trigger when scrolling back up
            entry.target.classList.remove('is-visible')
          }
        })
      },
      { 
        root: scrollContainer,
        threshold: 0.05, 
        rootMargin: '0px 0px -40px 0px' 
      }
    )

    // 2. Define exactly which classes should be animated globally
    const observeElements = () => {
      const elements = document.querySelectorAll('.kartu, .tabel-wrapper, .info-section, .filter-bar, .stats-grid > div, .form-container, .grid-container > div')
      elements.forEach((el) => {
        if (!el.classList.contains('animate-on-scroll')) {
          el.classList.add('animate-on-scroll')
          observer.observe(el)
        }
      })
    }

    // Run initially
    observeElements()

    // 3. Setup Mutation Observer to catch newly rendered elements
    const mutationObserver = new MutationObserver(() => {
      observeElements()
    })
    
    mutationObserver.observe(document.body, { 
      childList: true, 
      subtree: true 
    })

    // Cleanup
    return () => {
      observer.disconnect()
      mutationObserver.disconnect()
    }
  }, [pathname])

  return null
}
