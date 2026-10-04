"use client"

// Fits the fixed-size (8.5in) resume sheet into any screen width by scaling it
// down, so the preview never needs horizontal scrolling. Printing ignores the
// scale (see the @media print rules in the Create page) and uses full size.

import { useEffect, useRef, useState } from "react"

const SHEET_WIDTH = 816 // 8.5in at 96dpi

export default function ResumePreview({ children }: { children: React.ReactNode }) {
  const frameRef = useRef<HTMLDivElement>(null)
  const sheetRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [height, setHeight] = useState<number | undefined>(undefined)

  useEffect(() => {
    const frame = frameRef.current
    const sheet = sheetRef.current
    if (!frame || !sheet) return

    const update = () => {
      const next = Math.min(1, frame.clientWidth / SHEET_WIDTH)
      setScale(next)
      setHeight(sheet.offsetHeight * next)
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(frame)
    observer.observe(sheet)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      id="resume-frame"
      ref={frameRef}
      className="w-full overflow-hidden"
      style={{ height }}
    >
      <div
        id="resume-scaler"
        ref={sheetRef}
        style={{
          width: SHEET_WIDTH,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        {children}
      </div>
    </div>
  )
}