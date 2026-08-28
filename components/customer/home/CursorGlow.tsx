'use client'

import { useEffect, useRef } from 'react'

/**
 * The glow that follows the pointer across the landing page.
 *
 * This used to be a `useState` on the landing page itself, written on every
 * `mousemove`. That made the whole page a client component, and - far worse -
 * re-rendered the entire tree beneath it (the hero carousel, the device grid,
 * the food menu, the testimonials, the footer) at pointer-event rate, none of
 * which is memoised. Moving a mouse across the page was re-rendering several
 * hundred nodes dozens of times a second to move one gradient.
 *
 * The position is written straight to the element as two custom properties
 * instead. React renders this once and never again; the browser composites the
 * gradient on the values it finds. The listener is passive because it never
 * calls preventDefault, which lets the browser keep scrolling off the main
 * thread while the pointer moves.
 */
export function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onMove = (event: MouseEvent) => {
      const el = ref.current
      if (!el) return
      el.style.setProperty('--cursor-x', `${event.clientX}px`)
      el.style.setProperty('--cursor-y', `${event.clientY}px`)
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-30 transition-opacity duration-300"
      style={{
        // Starts off-screen rather than centred, so the glow does not sit in the
        // middle of the page for anyone who never moves a pointer - a touch
        // device, or a reader arriving by keyboard.
        background:
          'radial-gradient(600px circle at var(--cursor-x, -100%) var(--cursor-y, -100%), rgba(255, 193, 7, 0.15), transparent 40%)',
      }}
    />
  )
}

export default CursorGlow
