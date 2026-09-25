"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  PointerEvent as ReactPointerEvent,
  KeyboardEvent as ReactKeyboardEvent,
} from "react"
import gsap from "gsap"

// Place this file at: src/components/ui/depth-carousel.tsx
// Install dependency first:  npm install gsap

export type DepthCarouselItem = string | { image: string; alt?: string; label?: string }
type TiltDirection = "left" | "right"

export interface DepthCarouselProps {
  items?: DepthCarouselItem[]
  cardWidth?: number
  cardHeight?: number
  radius?: number
  tint?: string
  depth?: number
  spread?: number
  tilt?: number
  tiltDirection?: TiltDirection
  perspective?: number
  visibleCards?: number
  falloff?: number
  blur?: number
  duration?: number
  ease?: string
  autoplay?: boolean
  autoplayDelay?: number
  loop?: boolean
  showControls?: boolean
  showIndicators?: boolean
  onChange?: (index: number, item: { image: string; alt?: string; label?: string }) => void
  className?: string
}

interface CarouselConfig {
  count: number
  depth: number
  spread: number
  tilt: number
  tiltDirection: TiltDirection
  visibleCards: number
  falloff: number
  blur: number
  duration: number
  ease: string
  loop: boolean
  cardWidth: number
  autoplayDelay: number
}

interface DragState {
  x: number
  startPos: number
  lastX: number
  lastT: number
  v: number
  moved: boolean
  id: number
}

const clamp = (v: number, min: number, max: number) =>
  Math.min(Math.max(v, min), max)

const normalizeItem = (it: DepthCarouselItem) =>
  typeof it === "string" ? { image: it, alt: "", label: "" } : it

const DepthCarousel = ({
  items = [],
  cardWidth = 260,
  cardHeight = 340,
  radius = 14,
  // Light-theme default: a soft navy tint rather than near-black,
  // since receded cards sit on a light (#EFF2F9) page background.
  tint = "#1B2A4A",
  depth = 180,
  spread = 70,
  tilt = 20,
  tiltDirection = "right",
  perspective = 1300,
  visibleCards = 4,
  falloff = 0.2,
  blur = 5,
  duration = 700,
  ease = "power3.out",
  autoplay = true,
  autoplayDelay = 3200,
  loop = true,
  showControls = true,
  showIndicators = true,
  onChange,
  className = "",
}: DepthCarouselProps) => {
  const data = useMemo(
    () => (Array.isArray(items) ? items : []).map(normalizeItem),
    [items],
  )
  const count = data.length

  const rootRef = useRef<HTMLDivElement | null>(null)
  const stageRef = useRef<HTMLDivElement | null>(null)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])
  const overlayRefs = useRef<(HTMLSpanElement | null)[]>([])

  const posRef = useRef(0)
  const focusRef = useRef(0)
  const tweenRef = useRef<gsap.core.Tween | null>(null)
  const scaleRef = useRef(1)
  const cfgRef = useRef<CarouselConfig>({} as CarouselConfig)
  const onChangeRef = useRef(onChange)

  const dragRef = useRef<DragState | null>(null)
  const wheelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const autoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const reducedRef = useRef(false)

  const [active, setActive] = useState(0)

  onChangeRef.current = onChange
  cfgRef.current = {
    count,
    depth,
    spread,
    tilt,
    tiltDirection,
    visibleCards,
    falloff,
    blur,
    duration,
    ease,
    loop,
    cardWidth,
    autoplayDelay,
  }

  const layout = useCallback((pos: number) => {
    const cfg = cfgRef.current
    const n = cfg.count
    if (!n) return
    const dir = cfg.tiltDirection === "left" ? -1 : 1
    const sc = scaleRef.current

    for (let i = 0; i < n; i++) {
      const el = cardRefs.current[i]
      if (!el) continue

      let d = i - pos
      if (cfg.loop && n > 1) {
        d = ((d % n) + n) % n
        if (d > n / 2) d -= n
      }

      const back = Math.max(0, d)
      const az = Math.abs(d)
      const shown = az <= cfg.visibleCards + 0.5

      const tz = -cfg.depth * d
      const tx = dir * cfg.spread * d
      const ry = dir * cfg.tilt * clamp(d, 0, 1)

      let opacity = d < 0 ? Math.max(0, 1 + d) : 1
      if (!shown) opacity = 0

      const brightness = Math.max(0.35, 1 - back * cfg.falloff)
      const blurPx =
        cfg.blur > 0
          ? Math.min(cfg.blur, (back / Math.max(1, cfg.visibleCards)) * cfg.blur)
          : 0
      const zi = Math.round(2000 - d * 20)

      el.style.transform = `translate(-50%, -50%) scale(${sc}) translateX(${tx.toFixed(2)}px) translateZ(${tz.toFixed(2)}px) rotateY(${ry.toFixed(3)}deg)`
      el.style.opacity = opacity.toFixed(3)
      el.style.filter = `brightness(${brightness.toFixed(3)}) blur(${blurPx.toFixed(2)}px)`
      el.style.zIndex = String(zi)
      el.style.pointerEvents = shown && opacity > 0.05 ? "auto" : "none"

      const ov = overlayRefs.current[i]
      if (ov) ov.style.opacity = clamp(back * cfg.falloff * 1.1, 0, 0.55).toFixed(3)
    }
  }, [])

  const notify = useCallback(
    (idx: number) => {
      setActive(idx)
      onChangeRef.current?.(idx, data[idx])
    },
    [data],
  )

  const tweenTo = useCallback(
    (target: number, animate: boolean) => {
      tweenRef.current?.kill()
      const cfg = cfgRef.current
      const proxy = { p: posRef.current }
      const dur = animate && !reducedRef.current ? cfg.duration / 1000 : 0
      tweenRef.current = gsap.to(proxy, {
        p: target,
        duration: dur,
        ease: cfg.ease,
        onUpdate: () => {
          posRef.current = proxy.p
          layout(proxy.p)
        },
        onComplete: () => {
          const n = cfg.count
          if (n > 0) posRef.current = ((posRef.current % n) + n) % n
          layout(posRef.current)
        },
      })
    },
    [layout],
  )

  const setFocus = useCallback(
    (rawIndex: number, animate = true) => {
      const cfg = cfgRef.current
      const n = cfg.count
      if (!n) return
      const idx = cfg.loop ? ((rawIndex % n) + n) % n : clamp(rawIndex, 0, n - 1)
      let delta = idx - posRef.current
      if (cfg.loop && n > 1) {
        delta = ((delta % n) + n) % n
        if (delta > n / 2) delta -= n
      }
      tweenTo(posRef.current + delta, animate)
      if (idx !== focusRef.current) {
        focusRef.current = idx
        notify(idx)
      }
    },
    [tweenTo, notify],
  )

  const navigateBy = useCallback(
    (step: number) => setFocus(focusRef.current + step, true),
    [setFocus],
  )

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const ro = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width
      const cfg = cfgRef.current
      const needed = cfg.cardWidth + Math.abs(cfg.spread) * 2 + 120
      scaleRef.current = clamp(w / needed, 0.5, 1)
      layout(posRef.current)
    })
    ro.observe(root)
    return () => ro.disconnect()
  }, [layout])

  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      const cfg = cfgRef.current
      if (cfg.count < 2) return
      e.preventDefault()
      const stepPx = Math.max(cfg.cardWidth * 0.55 * scaleRef.current, 40)
      posRef.current += (e.deltaY || e.deltaX) / stepPx
      layout(posRef.current)
      if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current)
      wheelTimerRef.current = setTimeout(
        () => setFocus(Math.round(posRef.current), true),
        130,
      )
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    return () => {
      el.removeEventListener("wheel", onWheel)
      if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current)
    }
  }, [layout, setFocus])

  const onPointerDown = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    const cfg = cfgRef.current
    if (cfg.count < 2) return
    tweenRef.current?.kill()
    dragRef.current = {
      x: e.clientX,
      startPos: posRef.current,
      lastX: e.clientX,
      lastT: performance.now(),
      v: 0,
      moved: false,
      id: e.pointerId,
    }
  }, [])

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current
      if (!drag) return
      const cfg = cfgRef.current
      const stepPx = Math.max(cfg.cardWidth * 0.55 * scaleRef.current, 40)
      const dx = e.clientX - drag.x
      if (!drag.moved && Math.abs(dx) > 4) {
        drag.moved = true
        rootRef.current?.setPointerCapture(drag.id)
      }
      if (!drag.moved) return
      const now = performance.now()
      const dt = Math.max(now - drag.lastT, 1)
      drag.v = (e.clientX - drag.lastX) / dt
      drag.lastX = e.clientX
      drag.lastT = now
      posRef.current = drag.startPos - dx / stepPx
      layout(posRef.current)
    },
    [layout],
  )

  const onPointerEnd = useCallback(() => {
    const drag = dragRef.current
    if (!drag) return
    dragRef.current = null
    if (!drag.moved) return
    const cfg = cfgRef.current
    const stepPx = Math.max(cfg.cardWidth * 0.55 * scaleRef.current, 40)
    const projected = posRef.current - (drag.v * 180) / stepPx
    setFocus(Math.round(projected), true)
  }, [setFocus])

  const onKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLDivElement>) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault()
        navigateBy(-1)
      } else if (e.key === "ArrowRight") {
        e.preventDefault()
        navigateBy(1)
      }
    },
    [navigateBy],
  )

  const onCardClick = useCallback(
    (index: number) => {
      if (dragRef.current?.moved) return
      setFocus(index, true)
    },
    [setFocus],
  )

  useEffect(() => {
    reducedRef.current =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (!autoplay || reducedRef.current || count < 2) return
    const root = rootRef.current
    let hovered = false
    let focused = false
    const stop = () => {
      if (autoTimerRef.current) clearInterval(autoTimerRef.current)
      autoTimerRef.current = null
    }
    const start = () => {
      stop()
      autoTimerRef.current = setInterval(() => {
        if (!hovered && !focused) navigateBy(1)
      }, Math.max(cfgRef.current.autoplayDelay, 600))
    }
    const onEnter = () => { hovered = true }
    const onLeave = () => { hovered = false }
    const onFocusIn = () => { focused = true }
    const onFocusOut = () => { focused = false }
    root?.addEventListener("mouseenter", onEnter)
    root?.addEventListener("mouseleave", onLeave)
    root?.addEventListener("focusin", onFocusIn)
    root?.addEventListener("focusout", onFocusOut)
    start()
    return () => {
      stop()
      root?.removeEventListener("mouseenter", onEnter)
      root?.removeEventListener("mouseleave", onLeave)
      root?.removeEventListener("focusin", onFocusIn)
      root?.removeEventListener("focusout", onFocusOut)
    }
  }, [autoplay, autoplayDelay, count, navigateBy])

  useEffect(() => {
    layout(posRef.current)
  }, [layout, depth, spread, tilt, tiltDirection, visibleCards, falloff, blur, cardWidth, cardHeight, radius, count])

  useEffect(
    () => () => {
      tweenRef.current?.kill()
      if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current)
      if (autoTimerRef.current) clearInterval(autoTimerRef.current)
    },
    [],
  )

  return (
    <div
      ref={rootRef}
      className={`relative flex h-full min-h-[320px] w-full cursor-grab touch-pan-y select-none items-center justify-center outline-none [perspective-origin:50%_50%] active:cursor-grabbing focus-visible:rounded-xl focus-visible:outline-2 focus-visible:outline-[#1170CD]/50 focus-visible:[outline-offset:4px] ${className}`.trim()}
      style={{ perspective: `${perspective}px` }}
      role="group"
      aria-roledescription="carousel"
      aria-label="Resume template carousel"
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onKeyDown={onKeyDown}
    >
      <div className="absolute inset-0 [transform-style:preserve-3d]" ref={stageRef}>
        {data.map((item, i) => (
          <div
            key={i}
            className="absolute left-1/2 top-1/2 cursor-pointer overflow-hidden bg-white shadow-[0_24px_50px_-18px_rgba(27,42,74,0.35),0_6px_16px_-8px_rgba(27,42,74,0.15)] [transform:translate(-50%,-50%)] [transform-origin:center] [will-change:transform,opacity,filter]"
            ref={(el) => { cardRefs.current[i] = el }}
            style={{ width: cardWidth, height: cardHeight, borderRadius: radius }}
            aria-roledescription="slide"
            aria-label={item.label || `${i + 1} of ${count}`}
            aria-hidden={active !== i}
            onClick={() => onCardClick(i)}
          >
            <img
              className="block h-full w-full select-none object-cover [pointer-events:none] [-webkit-user-drag:none]"
              src={item.image}
              alt={item.alt || ""}
              draggable={false}
            />
            <span
              className="pointer-events-none absolute inset-0 opacity-0 mix-blend-multiply"
              ref={(el) => { overlayRefs.current[i] = el }}
              style={{ background: tint }}
            />
          </div>
        ))}
      </div>

      {showControls && count > 1 && (
        <>
          <button
            type="button"
            className="absolute left-4 top-1/2 z-[3000] grid h-[42px] w-[42px] -translate-y-1/2 place-items-center rounded-full border border-[#1B2A4A]/10 bg-white/90 text-[#1B2A4A] backdrop-blur-md transition-[background,border-color,transform] duration-200 hover:border-[#1170CD]/40 hover:bg-white active:scale-95 shadow-sm"
            aria-label="Previous template"
            onClick={() => navigateBy(-1)}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            className="absolute right-4 top-1/2 z-[3000] grid h-[42px] w-[42px] -translate-y-1/2 place-items-center rounded-full border border-[#1B2A4A]/10 bg-white/90 text-[#1B2A4A] backdrop-blur-md transition-[background,border-color,transform] duration-200 hover:border-[#1170CD]/40 hover:bg-white active:scale-95 shadow-sm"
            aria-label="Next template"
            onClick={() => navigateBy(1)}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </>
      )}

      {showIndicators && count > 1 && (
        <div
          className="absolute bottom-4 left-1/2 z-[3000] flex -translate-x-1/2 gap-2 rounded-full bg-white/80 px-3 py-2 backdrop-blur-sm shadow-sm"
          role="tablist"
          aria-label="Templates"
        >
          {data.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={active === i}
              aria-label={`Go to template ${i + 1}`}
              className={`h-[7px] cursor-pointer rounded-full transition-[width,background] duration-[250ms] ${
                active === i ? "w-5 bg-[#1170CD]" : "w-[7px] bg-[#1B2A4A]/25"
              }`}
              onClick={() => setFocus(i, true)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default DepthCarousel