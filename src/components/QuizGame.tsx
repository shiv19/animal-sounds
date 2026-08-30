import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { ANIMALS, phraseClip } from '../data/animals'
import type { AnimalAssets } from '../data/animals'
import { engine } from '../lib/audio'
import type { Settings } from '../lib/storage'
import { shuffled } from '../lib/shuffle'
import HomeButton from './HomeButton'
import { StarIcon } from './FavoriteStar'

interface Question {
  answer: AnimalAssets
  options: AnimalAssets[]
}

function buildQuestion(recent: string[], favorites: string[]): Question {
  const favPool = ANIMALS.filter((a) => favorites.includes(a.id))
  const pool = favPool.length >= 6 ? shuffled(favPool) : shuffled(ANIMALS)
  const candidates = pool.filter((a) => !recent.includes(a.id))
  const answer = candidates[0] ?? pool[0]
  const sameCategory = ANIMALS.filter((a) => a.id !== answer.id && a.category === answer.category)
  const distractors = shuffled(sameCategory).slice(0, 2)
  return { answer, options: shuffled([answer, ...distractors]) }
}

const CLEAR_THRESHOLD = 0.42

interface Props {
  settings: Settings
  favorites: string[]
  onHome: () => void
}

export default function QuizGame({ settings, favorites, onHome }: Props) {
  const [recent, setRecent] = useState<string[]>([])
  const [question, setQuestion] = useState<Question>(() => buildQuestion([], favorites))
  const [revealed, setRevealed] = useState(false)
  const [wrongPick, setWrongPick] = useState<string | null>(null)
  const [solved, setSolved] = useState(false)
  const [score, setScore] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const seqRef = useRef(0)
  const nextTimer = useRef(0)
  const scratch = useRef({ down: false, moves: 0 })

  const { answer, options } = question

  /** Draws the opaque mask. Returns false if the card isn't measurable yet. */
  const resetMask = useCallback(() => {
    const canvas = canvasRef.current
    const card = canvas?.parentElement
    if (!canvas || !card) return false
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = card.clientWidth
    const h = card.clientHeight
    if (!w || !h) return false
    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
    const ctx = canvas.getContext('2d')
    if (!ctx) return false
    // The fresh mask must be fully opaque this very frame — the previous
    // question left the canvas faded out, and a transition would flash the
    // new photo through it.
    canvas.style.transition = 'none'
    ctx.globalCompositeOperation = 'source-over'
    ctx.fillStyle = '#9fb4c7'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    // soft bubbles + a big question mark; neutral color so nothing hints the answer
    ctx.fillStyle = 'rgba(255, 253, 247, 0.14)'
    const bubbles: Array<[number, number, number]> = [
      [0.18, 0.24, 0.09],
      [0.82, 0.3, 0.11],
      [0.22, 0.78, 0.12],
      [0.78, 0.8, 0.08]
    ]
    for (const [px, py, pr] of bubbles) {
      ctx.beginPath()
      ctx.arc(px * canvas.width, py * canvas.height, pr * canvas.width, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.fillStyle = 'rgba(255, 253, 247, 0.85)'
    ctx.font = `600 ${Math.round(h * 0.4)}px Fredoka, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('?', canvas.width / 2, canvas.height / 2)
    requestAnimationFrame(() => {
      canvas.style.transition = ''
    })
    return true
  }, [])

  // New question: reset the mask and play the sound as the first hint.
  // Runs as a layout effect so the opaque mask exists before the browser
  // paints the new photo — otherwise it flashes visible for a frame.
  useLayoutEffect(() => {
    resetMask()
    setRevealed(false)
    setWrongPick(null)
    setSolved(false)
    const mySeq = ++seqRef.current
    const t = window.setTimeout(() => {
      if (seqRef.current === mySeq) void engine.playSound(answer.sound).catch(() => {})
    }, 500)
    return () => {
      window.clearTimeout(t)
      engine.stopAll()
    }
  }, [answer, resetMask])

  useEffect(() => {
    const onResize = () => {
      if (!revealed) resetMask()
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [revealed, resetMask])

  useEffect(() => () => window.clearTimeout(nextTimer.current), [])

  const checkRevealed = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
    let clear = 0
    let total = 0
    for (let i = 3; i < data.length; i += 64) {
      total++
      if (data[i] === 0) clear++
    }
    if (total > 0 && clear / total > CLEAR_THRESHOLD) setRevealed(true)
  }

  const scratchAt = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current
    if (!canvas || revealed) return
    const rect = canvas.getBoundingClientRect()
    const dpr = canvas.width / rect.width
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.globalCompositeOperation = 'destination-out'
    ctx.beginPath()
    ctx.arc((clientX - rect.left) * dpr, (clientY - rect.top) * dpr, (rect.width / 7) * dpr, 0, Math.PI * 2)
    ctx.fill()
    if (++scratch.current.moves % 10 === 0) checkRevealed()
  }

  const onDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    scratch.current.down = true
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      /* capture is best-effort */
    }
    scratchAt(e.clientX, e.clientY)
  }

  const onMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (scratch.current.down) scratchAt(e.clientX, e.clientY)
  }

  const onUp = () => {
    scratch.current.down = false
  }

  const nextQuestion = () => {
    const nextRecent = [answer.id, ...recent].slice(0, 4)
    setRecent(nextRecent)
    setQuestion(buildQuestion(nextRecent, favorites))
  }

  const pick = (id: string) => {
    if (solved) return
    if (id !== answer.id) {
      setWrongPick(id)
      void engine.speak('Try again', settings, phraseClip('try-again')).catch(() => {})
      return
    }
    setSolved(true)
    setRevealed(true)
    if (!wrongPick) setScore((s) => s + 1)

    // Advance when the celebration finishes — or on a hard cap, so a hung
    // sound/speech chain can never strand the player on this question.
    let scheduled = false
    const scheduleNext = () => {
      if (scheduled) return
      scheduled = true
      nextTimer.current = window.setTimeout(nextQuestion, 800)
    }
    window.setTimeout(scheduleNext, 3400)
    void (async () => {
      try {
        await engine.playSound(answer.sound)
        await engine.speak(`Yes! ${answer.name}!`, settings, phraseClip(`yes-${answer.id}`))
      } catch {
        /* aborted */
      }
      scheduleNext()
    })()
  }

  return (
    <div className="game-screen quiz-screen">
      <HomeButton onHome={onHome} />
      <header className="quiz-head">
        <span className="chip">Guess who?</span>
        <span className="chip score-chip">
          <StarIcon /> {score}
        </span>
      </header>
      <p className="quiz-hint">
        {solved ? `Yes! ${answer.name}!` : revealed ? 'Who is it?' : 'Scratch to see who it is!'}
      </p>
      <div className="scratch-card">
        <img src={answer.photo} alt="" draggable={false} />
        <canvas
          ref={canvasRef}
          className={revealed ? 'mask cleared' : 'mask'}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        />
      </div>
      <div className="quiz-options">
        {options.map((o) => (
          <button
            key={o.id}
            className={`quiz-opt${solved && o.id === answer.id ? ' correct' : ''}${
              wrongPick === o.id ? ' wrong' : ''
            }`}
            disabled={solved || wrongPick === o.id}
            onClick={() => pick(o.id)}
          >
            {o.name}
          </button>
        ))}
      </div>
      <button
        className="ghost-btn replay-btn"
        onClick={() => void engine.playSound(answer.sound).catch(() => {})}
      >
        <SpeakerIcon /> Hear again
      </button>
    </div>
  )
}

export function SpeakerIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path
        d="M4 9.5v5c0 .6.4 1 1 1h2.6l3.9 3.2c.7.6 1.5.1 1.5-.7V6c0-.8-.9-1.3-1.5-.7L7.6 8.5H5c-.6 0-1 .4-1 1z"
        fill="currentColor"
      />
      <path
        d="M15.5 8.7a4.6 4.6 0 0 1 0 6.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}
