"use client"

import { ReactLenis } from "lenis/react"
import type { ReactNode } from "react"

// Place this file at: src/components/lenis-provider.tsx
// Requires: npm install lenis
//
// Wraps the app in Lenis's smooth-scroll behavior. `anchors: true` makes
// Lenis automatically smooth-scroll existing `<a href="#...">` links (like
// the ones already in the hero nav) without needing to rewrite the nav's
// click handlers — this is what keeps anchor links working per the brief.
interface LenisProviderProps {
  children: ReactNode
}

export function LenisProvider({ children }: LenisProviderProps) {
  return (
    <ReactLenis
      root
      options={{
        lerp: 0.1,
        duration: 1.2,
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 2,
        infinite: false,
        anchors: true,
      }}
    >
      {children}
    </ReactLenis>
  )
}