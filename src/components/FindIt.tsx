import { useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { ANIMALS, phraseClip } from '../data/animals'
import type { AnimalAssets } from '../data/animals'
import { engine, wait } from '../lib/audio'
import { shuffled } from '../lib/shuffle'
import type { Settings } from '../lib/storage'
import HomeButton from './HomeButton'
import { StarIcon } from './FavoriteStar'
import { SpeakerIcon } from './QuizGame'

interface Props {
  settings: Settings
  favorites: string[]
  onHome: () => void
}

const ROUNDS = 5
const MISSES_BEFORE_HINT = 2

interface Placement {
  x: number
  y: number
  tilt: number
  scale: number
}

interface Game {
  targets: AnimalAssets[]
  scene: Array<{ animal: AnimalAssets; pos: Placement }>
}

/** Jittered slot grid tuned to the current orientation, so stickers spread
    across the whole screen and can never overlap or hide behind the UI.
    Rows stay inside the grass band — only sun and clouds live in the sky. */
function sceneSlots(landscape: boolean): Array<{ x: number; y: number }> {
  const cols = landscape ? [10, 30, 50, 70, 90] : [17, 50, 83]
  const rows = landscape ? [56, 82] : [57, 72, 87]
  return shuffled(cols.flatMap((x) => rows.map((y) => ({ x, y }))))
}

/** Favorite animals become the round targets when there are enough of them. */
function buildGame(favorites: string[]): Game {
  // Landscape spreads wider, so it can afford a couple more distractors.
  const landscape = window.innerWidth > window.innerHeight
  const sceneSize = landscape ? 10 : 8
  const favPool = shuffled(ANIMALS.filter((a) => favorites.includes(a.id)))
  const pool = favPool.length >= ROUNDS ? favPool : shuffled(ANIMALS)
  const targets = pool.slice(0, ROUNDS)
  const rest = shuffled(ANIMALS.filter((a) => !targets.some((t) => t.id === a.id)))
  const scene = shuffled([...targets, ...rest.slice(0, sceneSize - targets.length)])
  const slots = sceneSlots(landscape)
  return {
    targets,
    scene: scene.map((animal, i) => {
      const slot = slots[i % slots.length]
      return {
        animal,
        pos: {
          x: slot.x + (Math.random() * 7 - 3.5),
          y: slot.y + (Math.random() * 5 - 2.5),
          tilt: Math.random() * 12 - 6,
          scale: 0.9 + Math.random() * 0.3
        }
      }
    })
  }
}

export default function FindIt({ settings, favorites, onHome }: Props) {
  const [game, setGame] = useState<Game>(() => buildGame(favorites))
  const [round, setRound] = useState(0)
  const [solved, setSolved] = useState(false)
  const [misses, setMisses] = useState(0)
  const [wrongId, setWrongId] = useState<string | null>(null)
  const [won, setWon] = useState(false)
  const seqRef = useRef(0)
  const timers = useRef<number[]>([])

  const target = game.targets[round]
  const hint = misses >= MISSES_BEFORE_HINT && !solved

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

  const ask = useCallback(
    (animal: AnimalAssets) => {
      const my = ++seqRef.current
      void (async () => {
        engine.stopAll()
        try {
          await engine.playSound(animal.sound)
          if (seqRef.current !== my) return
          await wait(250)
          if (seqRef.current !== my) return
          await engine.speak(`Where is the ${animal.name}?`, settings, phraseClip(`where-${animal.id}`))
        } catch {
          /* aborted */
        }
      })()
    },
    [settings]
  )

  // New round: gentle beat, then the sound + spoken question.
  useEffect(() => {
    setSolved(false)
    setMisses(0)
    const my = ++seqRef.current
    const t = window.setTimeout(() => {
      if (seqRef.current === my) ask(game.targets[round])
    }, 450)
    return () => window.clearTimeout(t)
  }, [game, round, ask])

  const tap = (animal: AnimalAssets) => {
    if (won || solved) return
    if (animal.id !== target.id) {
      // wrong tap: still rewarding — the tapped animal answers — then shake
      setWrongId(animal.id)
      setMisses((m) => m + 1)
      later(() => setWrongId((w) => (w === animal.id ? null : w)), 500)
      void engine.playSound(animal.sound).catch(() => {})
      return
    }
    setSolved(true)
    setMisses(0)
    const my = ++seqRef.current
    void (async () => {
      try {
        await engine.playSound(animal.sound)
        if (seqRef.current !== my) return
        await engine.speak(`Yes! ${animal.name}!`, settings, phraseClip(`yes-${animal.id}`))
      } catch {
        /* aborted */
      }
      if (seqRef.current !== my) return
      if (round + 1 >= ROUNDS) {
        setWon(true)
        void engine.speak('You found them all!', settings, phraseClip('found-all')).catch(() => {})
      } else {
        setRound((r) => r + 1)
      }
    })()
  }

  const stickerClass = (animal: AnimalAssets) =>
    [
      'scene-animal',
      solved && animal.id === target.id ? 'found' : '',
      wrongId === animal.id ? 'wrong' : '',
      hint && animal.id === target.id ? 'hint' : ''
    ]
      .filter(Boolean)
      .join(' ')

  return (
    <div className="game-screen findit-screen">
      <HomeButton onHome={onHome} />
      <button className="chip back-chip" onClick={() => { setGame(buildGame(favorites)); setRound(0); setWon(false) }}>
        <ShuffleIcon /> Shuffle
      </button>

      <div className="findit-top">
        <span className="chip find-chip">Find: {target.name}</span>
        <span className="round-dots" aria-label={`Round ${round + 1} of ${ROUNDS}`}>
          {game.targets.map((_, i) => (
            <span
              key={i}
              className={i < round || solved ? 'dot on' : i === round ? 'dot now' : 'dot'}
            />
          ))}
        </span>
        <button className="chip" onClick={() => ask(target)} aria-label="Say it again">
          <SpeakerIcon />
        </button>
      </div>

      <div className="findit-scene">
        <FarmScene />
        {game.scene.map(({ animal, pos }) => (
          <button
            key={animal.id}
            className={stickerClass(animal)}
            style={
              {
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                '--tilt': `${pos.tilt}deg`,
                '--s': pos.scale
              } as CSSProperties
            }
            onClick={() => tap(animal)}
            aria-label={animal.name}
          >
            {animal.emoji}
          </button>
        ))}
      </div>

      {won && (
        <div className="win-overlay">
          <div className="win-card">
            <StarIcon />
            <h3>You found them all!</h3>
            <p>All {ROUNDS} animals found</p>
            <button
              className="primary-btn"
              onClick={() => {
                setGame(buildGame(favorites))
                setRound(0)
                setWon(false)
              }}
            >
              Play again
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

function ShuffleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M16 3h5v5" />
      <path d="M4 20 21 3" />
      <path d="M21 16v5h-5" />
      <path d="m15 15 6 6" />
      <path d="m4 4 5 5" />
    </svg>
  )
}

/** Full-bleed storybook farm: gradient sky and grass that fit any aspect
    ratio, plus landmarks pinned to the edges so nothing is ever cropped. */
function FarmScene() {
  return (
    <div className="farm-backdrop" aria-hidden>
      <div className="farm-sky" />
      <span className="farm-prop sun">🌞</span>
      <span className="farm-prop cloud cloud-a">☁️</span>
      <span className="farm-prop cloud cloud-b">☁️</span>
      <svg className="farm-hills" viewBox="0 0 1200 90" preserveAspectRatio="none">
        <path d="M0 90 V40 Q170 4 380 28 T760 22 T1200 30 V90 Z" fill="#b7ce8f" />
      </svg>
      <div className="farm-ground" />
      <svg className="farm-meadow" viewBox="0 0 1200 80" preserveAspectRatio="none">
        <path d="M0 80 V34 Q210 0 450 20 T860 16 T1200 24 V80 Z" fill="#9dbe7c" />
      </svg>
      <span className="farm-prop tree tree-a">🌳</span>
      <span className="farm-prop tree tree-b">🌲</span>
      <Barn />
      <Pond />
      <span className="farm-prop tractor">🚜</span>
      <span className="farm-prop flower flower-a">🌻</span>
      <span className="farm-prop flower flower-b">🌷</span>
      <span className="farm-prop flower flower-c">🌼</span>
    </div>
  )
}

function Barn() {
  return (
    <svg className="farm-prop barn" viewBox="0 0 360 430">
      <rect x="30" y="130" width="300" height="300" fill="#c46a4a" />
      <polygon points="0,130 180,0 360,130" fill="#8a4b36" />
      <rect x="145" y="260" width="72" height="170" rx="4" fill="#7a422f" />
      <path d="M145 260l72 170M217 260l-72 170" stroke="#fff7e8" strokeWidth="7" />
      <circle cx="180" cy="198" r="26" fill="#fff7e8" stroke="#8a4b36" strokeWidth="8" />
    </svg>
  )
}

function Pond() {
  return (
    <svg className="farm-prop pond" viewBox="0 0 470 176">
      <ellipse cx="235" cy="88" rx="235" ry="88" fill="#9fc6d8" />
      <ellipse cx="235" cy="88" rx="235" ry="88" fill="none" stroke="#86b0c4" strokeWidth="10" />
      <ellipse cx="175" cy="66" rx="52" ry="14" fill="#b9d7e4" />
    </svg>
  )
}
