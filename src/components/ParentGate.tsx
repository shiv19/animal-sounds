import { useEffect, useRef, useState } from 'react'

const HOLD_MS = 2000

/** Gear that only opens after a 2-second hold — toddler-proof. */
export default function ParentGate({ onOpen }: { onOpen: () => void }) {
  const [progress, setProgress] = useState(0)
  const raf = useRef(0)
  const beganAt = useRef(0)

  const stop = () => {
    cancelAnimationFrame(raf.current)
    setProgress(0)
  }

  const tick = () => {
    const p = Math.min(1, (performance.now() - beganAt.current) / HOLD_MS)
    setProgress(p)
    if (p >= 1) {
      stop()
      onOpen()
      return
    }
    raf.current = requestAnimationFrame(tick)
  }

  const begin = () => {
    beganAt.current = performance.now()
    raf.current = requestAnimationFrame(tick)
  }

  useEffect(() => () => cancelAnimationFrame(raf.current), [])

  const circumference = 2 * Math.PI * 20

  return (
    <button
      className="gate"
      aria-label="Parent settings — press and hold"
      onPointerDown={(e) => {
        e.stopPropagation()
        begin()
      }}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onContextMenu={(e) => e.preventDefault()}
    >
      <svg className="rings" viewBox="0 0 48 48" aria-hidden>
        <circle className="ring-bg" cx="24" cy="24" r="20" />
        <circle
          className="ring"
          cx="24"
          cy="24"
          r="20"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
        />
      </svg>
      <GearIcon />
    </button>
  )
}

function GearIcon() {
  return (
    <svg className="gear" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <path
        strokeLinejoin="round"
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
      />
    </svg>
  )
}
