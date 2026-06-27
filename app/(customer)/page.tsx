'use client'

import React, { useEffect, useState } from 'react'
import HeroCarousel from './home/hero-section/page'
import DevicePage from './home/device/page'
import FoodMenu from './home/food/page'
import Footer from '@/components/customer/layout/Footer'
import Testimonials from './home/testimonial/page'


export default function LandingPage(){
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div className="relative">
      {/* Cursor gradient glow effect */}
      <div
        className="pointer-events-none fixed inset-0 z-30 transition-opacity duration-300"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255, 193, 7, 0.15), transparent 40%)`,
        }}
      />

      <HeroCarousel />
      <DevicePage />
      <FoodMenu />
      <Testimonials />
      <Footer />
    </div>
  )
}

