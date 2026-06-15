'use client'

import { memo } from 'react'

function AnimatedBackground() {
  return (
    <>
      {/* Base gradient overlay */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-[#0d0a14] to-[#0d0a14] pointer-events-none z-0" />

      {/* Animated golden blobs - optimized for performance with reduced count */}
      <div
        className="fixed top-20 left-1/4 w-[600px] h-[600px] bg-gradient-to-r from-primary/10 to-amber-500/10 rounded-full blur-[100px] animate-pulse pointer-events-none z-0"
        style={{ willChange: 'opacity', animationDuration: '4s' }}
      />
      <div
        className="fixed bottom-20 right-1/4 w-[500px] h-[500px] bg-gradient-to-l from-orange-600/10 to-primary/10 rounded-full blur-[100px] animate-pulse pointer-events-none z-0"
        style={{ animationDelay: '2s', willChange: 'opacity', animationDuration: '4s' }}
      />
    </>
  )
}

// Memoize to prevent unnecessary re-renders
export default memo(AnimatedBackground)
