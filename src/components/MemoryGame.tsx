import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { ANIMALS } from '../data/animals'
import type { AnimalAssets } from '../data/animals'
import { engine } from '../lib/audio'
import { shuffled } from '../lib/shuffle'
import type { Settings } from '../lib/storage'
import HomeButton from './HomeButton'
import { StarIcon } from './FavoriteStar'

type Level = 'easy' | 'medium' | 'hard'

const LEVELS: Record<
  Level,
  { pairs: number; cols: number; rows: number; previewMs: number; label: string; blurb: string }
> = {
  easy: { pairs: 3, cols: 3, rows: 2, previewMs: 4000, label: 'Easy', blurb: '3 pairs' },
  medium: { pairs: 6, cols: 3, rows: 4, previewMs: 6000, label: 'Medium', blurb: '6 pairs' },
  hard: { pairs: 10, cols: 4, rows: 5, previewMs: 8000, label: 'Hard', blurb: '10 pairs' }
}

/** Favorite animals get picked first when there are enough of them. */
function buildDeck(pairs: number, favorites: string[]): AnimalAssets[] {
  const favPool = ANIMALS.filter((a) => favorites.includes(a.id))
  const pool = favPool.length >= pairs ? shuffled(favPool) : shuffled(ANIMALS)
  const picks = pool.slice(0, pairs)
  return shuffled(picks.flatMap((a) => [a, a]))
}

interface Props {
  settings: Settings
  favorites: string[]
  onHome: () => void
}

export default function MemoryGame({ settings, favorites, onHome }: Props) {
  const [level, setLevel] = useState<Level | null>(null)
  const [run, setRun] = useState(0)

  if (!level) {
    return (
      <div className="game-screen">
        <HomeButton onHome={onHome} />
        <h2 className="game-title">Memory match</h2>
        <p className="game-sub">All cards show for a moment — remember them!</p>
        <div className="level-picker">
          {(Object.keys(LEVELS) as Level[]).map((l) => (
            <button key={l} className="level-btn" onClick={() => setLevel(l)}>
              <strong>{LEVELS[l].label}</strong>
              <small>
                {LEVELS[l].blurb} · {LEVELS[l].previewMs / 1000}s to peek
              </small>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <MemoryBoard
      key={`${level}-${run}`}
      level={level}
      settings={settings}
      favorites={favorites}
      onHome={onHome}
      onLevels={() => setLevel(null)}
      onAgain={() => setRun((r) => r + 1)}
    />
  )
}

interface BoardProps {
  level: Level
  settings: Settings
  favorites: string[]
  onHome: () => void
  onLevels: () => void
  onAgain: () => void
}

function MemoryBoard({ level, settings, favorites, onHome, onLevels, onAgain }: BoardProps) {
  const cfg = LEVELS[level]
  const [deck] = useState(() => buildDeck(cfg.pairs, favorites))
  const [phase, setPhase] = useState<'preview' | 'play' | 'won'>('preview')
  const [flipped, setFlipped] = useState<number[]>([])
  const [matched, setMatched] = useState<string[]>([])
  const [wrongPair, setWrongPair] = useState<number[]>([])
  const [peekLeft, setPeekLeft] = useState(Math.round(cfg.previewMs / 1000))
  const timers = useRef<number[]>([])

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms))
  }

  useEffect(
    () => () => {
      timers.current.forEach((t) => window.clearTimeout(t))
      engine.stopAll()
    },
    []
  )

  // Memorization phase: everything is face-up with a countdown, then it all closes.
  useEffect(() => {
    if (phase !== 'preview') return
    setPeekLeft(Math.round(cfg.previewMs / 1000))
    const interval = window.setInterval(() => setPeekLeft((s) => Math.max(0, s - 1)), 1000)
    const t = window.setTimeout(() => setPhase('play'), cfg.previewMs)
    return () => {
      window.clearInterval(interval)
      window.clearTimeout(t)
    }
  }, [phase, cfg.previewMs])

  useEffect(() => {
    if (phase === 'play' && matched.length === cfg.pairs) {
      setPhase('won')
      // let the last match's sound + name finish before cheering
      const t = window.setTimeout(() => {
        void engine.speak('Great job!', settings).catch(() => {})
      }, 2400)
      return () => window.clearTimeout(t)
    }
  }, [phase, matched.length, cfg.pairs, settings])

  const flip = (i: number) => {
    // tapping during the peek closes the preview early
    if (phase === 'preview') {
      setPhase('play')
      return
    }
    if (phase !== 'play') return
    if (flipped.length >= 2 || flipped.includes(i) || matched.includes(deck[i].id)) return

    const next = [...flipped, i]
    setFlipped(next)
    if (next.length < 2) return

    const [a, b] = next
    if (deck[a].id === deck[b].id) {
      const id = deck[a].id
      const animal = deck[a]
      // keep the pair face-up…
      later(() => {
        setMatched((m) => [...m, id])
        setFlipped([])
      }, 450)
      // …and celebrate with its sound + name
      later(() => {
        void (async () => {
          try {
            await engine.playSound(animal.sound)
            await engine.speak(animal.name, settings)
          } catch {
            /* aborted */
          }
        })()
      }, 380)
    } else {
      setWrongPair(next)
      later(() => {
        setFlipped([])
        setWrongPair([])
      }, 950)
    }
  }

  const faceUp = (i: number) => phase === 'preview' || flipped.includes(i) || matched.includes(deck[i].id)

  return (
    <div className="game-screen">
      <HomeButton onHome={onHome} />
      <button className="chip back-chip" onClick={onLevels}>
        Levels
      </button>
      {phase === 'preview' && <div className="banner">Remember the animals! {peekLeft}</div>}
      {phase === 'play' && (
        <div className="banner quiet">
          {matched.length} of {cfg.pairs} pairs
        </div>
      )}
      <div className="mem-grid" style={{ '--cols': cfg.cols, '--ratio': cfg.cols / cfg.rows } as CSSProperties}>
        {deck.map((animal, i) => (
          <MemoryCard
            key={i}
            animal={animal}
            faceUp={faceUp(i)}
            matched={matched.includes(animal.id)}
            wrong={wrongPair.includes(i)}
            onFlip={() => flip(i)}
          />
        ))}
      </div>
      {phase === 'won' && (
        <div className="win-overlay">
          <div className="win-card">
            <StarIcon />
            <h3>You did it!</h3>
            <p>All {cfg.pairs} pairs found</p>
            <button className="primary-btn" onClick={onAgain}>
              Play again
            </button>
            <button className="ghost-btn" onClick={onLevels}>
              Change level
            </button>
            <button className="ghost-btn" onClick={onHome}>
              Back to home
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function MemoryCard({
  animal,
  faceUp,
  matched,
  wrong,
  onFlip
}: {
  animal: AnimalAssets
  faceUp: boolean
  matched: boolean
  wrong: boolean
  onFlip: () => void
}) {
  const cls = ['mem-card', faceUp ? 'up' : '', matched ? 'matched' : '', wrong ? 'wrong' : '']
    .filter(Boolean)
    .join(' ')
  return (
    <button className={cls} onClick={onFlip} aria-label="Memory card">
      <span className="mem-inner">
        <span className="mem-face mem-back">
          <PawIcon />
        </span>
        <span className="mem-face mem-photo">
          <img src={animal.photo} alt="" draggable={false} />
        </span>
      </span>
    </button>
  )
}

function PawIcon() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden>
      <g fill="currentColor">
        <ellipse cx="32" cy="42" rx="13" ry="10.5" />
        <ellipse cx="15" cy="27" rx="5.6" ry="7.2" transform="rotate(-18 15 27)" />
        <ellipse cx="25.5" cy="19.5" rx="5.6" ry="7.6" transform="rotate(-6 25.5 19.5)" />
        <ellipse cx="38.5" cy="19.5" rx="5.6" ry="7.6" transform="rotate(6 38.5 19.5)" />
        <ellipse cx="49" cy="27" rx="5.6" ry="7.2" transform="rotate(18 49 27)" />
      </g>
    </svg>
  )
}
