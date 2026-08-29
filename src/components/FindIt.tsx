import { useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { ANIMALS } from '../data/animals'
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
const SCENE_ANIMALS = 8
const MISSES_BEFORE_HINT = 2

interface Placement {
  x: number
  y: number
  tilt: number
}

interface Game {
  targets: AnimalAssets[]
  scene: Array<{ animal: AnimalAssets; pos: Placement }>
}

/** Favorite animals become the round targets when there are enough of them. */
function buildGame(favorites: string[]): Game {
  const favPool = shuffled(ANIMALS.filter((a) => favorites.includes(a.id)))
  const pool = favPool.length >= ROUNDS ? favPool : shuffled(ANIMALS)
  const targets = pool.slice(0, ROUNDS)
  const rest = shuffled(ANIMALS.filter((a) => !targets.some((t) => t.id === a.id)))
  const scene = shuffled([...targets, ...rest.slice(0, SCENE_ANIMALS - targets.length)])
  // Jittered slot grid: stickers can never overlap or hide behind the UI.
  const cols = [14, 38, 62, 86]
  const rows = [34, 72]
  const slots = shuffled(cols.flatMap((x) => rows.map((y) => ({ x, y }))))
  return {
    targets,
    scene: scene.map((animal, i) => {
      const slot = slots[i % slots.length]
      return {
        animal,
        pos: {
          x: slot.x + (Math.random() * 8 - 4),
          y: slot.y + (Math.random() * 10 - 5),
          tilt: Math.random() * 10 - 5
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
          await engine.speak(`Where is the ${animal.name}?`, settings)
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
        await engine.speak(`Yes! ${animal.name}!`, settings)
      } catch {
        /* aborted */
      }
      if (seqRef.current !== my) return
      if (round + 1 >= ROUNDS) {
        setWon(true)
        void engine.speak('You found them all!', settings).catch(() => {})
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
            style={{ left: `${pos.x}%`, top: `${pos.y}%`, '--tilt': `${pos.tilt}deg` } as CSSProperties}
            onClick={() => tap(animal)}
            aria-label="animal"
          >
            <img src={animal.photo} alt="" draggable={false} />
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

/** Flat storybook farm, drawn once and scaled to cover the scene. */
function FarmScene() {
  return (
    <svg viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <rect width="1600" height="1000" fill="#c9e0ee" />
      <circle cx="1370" cy="128" r="95" fill="#f9e2a0" />
      <circle cx="1370" cy="128" r="60" fill="#f4c95d" />
      {/* rolling hills */}
      <path d="M0 520 Q400 380 800 500 T1600 470 V1000 H0 Z" fill="#b7ce8f" />
      <path d="M0 640 Q500 520 1000 620 T1600 600 V1000 H0 Z" fill="#9dbe7c" />
      <rect y="760" width="1600" height="240" fill="#8fbf6b" />
      {/* trees */}
      <g>
        <rect x="567" y="405" width="26" height="80" rx="6" fill="#8a5a3b" />
        <circle cx="580" cy="375" r="58" fill="#6fa05c" />
        <circle cx="540" cy="415" r="42" fill="#7faf6b" />
        <circle cx="622" cy="412" r="44" fill="#7faf6b" />
      </g>
      <g>
        <rect x="66" y="470" width="22" height="66" rx="6" fill="#8a5a3b" />
        <circle cx="77" cy="445" r="48" fill="#6fa05c" />
        <circle cx="44" cy="480" r="34" fill="#7faf6b" />
        <circle cx="112" cy="478" r="36" fill="#7faf6b" />
      </g>
      {/* barn */}
      <g>
        <rect x="1100" y="430" width="300" height="300" fill="#c46a4a" />
        <polygon points="1070,430 1250,300 1430,430" fill="#8a4b36" />
        <rect x="1215" y="560" width="72" height="170" rx="4" fill="#7a422f" />
        <path d="M1215 560l72 170M1287 560l-72 170" stroke="#fff7e8" strokeWidth="7" />
        <circle cx="1250" cy="498" r="26" fill="#fff7e8" stroke="#8a4b36" strokeWidth="8" />
      </g>
      {/* fence */}
      <g fill="#a9805b">
        <rect x="430" y="738" width="16" height="122" rx="5" />
        <rect x="526" y="738" width="16" height="122" rx="5" />
        <rect x="622" y="738" width="16" height="122" rx="5" />
        <rect x="718" y="738" width="16" height="122" rx="5" />
        <rect x="814" y="738" width="16" height="122" rx="5" />
        <rect x="422" y="760" width="416" height="13" rx="6" />
        <rect x="422" y="812" width="416" height="13" rx="6" />
      </g>
      {/* pond */}
      <ellipse cx="330" cy="860" rx="235" ry="88" fill="#9fc6d8" />
      <ellipse cx="330" cy="860" rx="235" ry="88" fill="none" stroke="#86b0c4" strokeWidth="10" />
      <ellipse cx="270" cy="838" rx="52" ry="14" fill="#b9d7e4" />
      {/* tractor */}
      <g>
        <rect x="660" y="838" width="160" height="58" rx="12" fill="#d9822b" />
        <rect x="688" y="786" width="74" height="62" rx="10" fill="#e8a13c" />
        <rect x="698" y="796" width="54" height="42" rx="6" fill="#c9e0ee" />
        <circle cx="700" cy="912" r="44" fill="#4a382b" />
        <circle cx="700" cy="912" r="17" fill="#a9805b" />
        <circle cx="796" cy="922" r="30" fill="#4a382b" />
        <circle cx="796" cy="922" r="11" fill="#a9805b" />
      </g>
      {/* mud puddle */}
      <ellipse cx="1060" cy="930" rx="115" ry="34" fill="#b99b72" />
      <ellipse cx="1040" cy="922" rx="46" ry="13" fill="#c9ad88" />
      {/* flowers + tufts */}
      <g fill="#f2a2b6">
        <circle cx="480" cy="905" r="9" />
        <circle cx="900" cy="950" r="9" />
        <circle cx="1240" cy="905" r="9" />
        <circle cx="1450" cy="940" r="9" />
      </g>
      <g fill="#fffdf7">
        <circle cx="496" cy="918" r="6" />
        <circle cx="916" cy="962" r="6" />
        <circle cx="1256" cy="918" r="6" />
        <circle cx="1466" cy="952" r="6" />
      </g>
      <g stroke="#6fa05c" strokeWidth="6" strokeLinecap="round">
        <path d="M760 960v-26M744 958l10-22M776 958l-10-22" />
        <path d="M1360 955v-26M1344 953l10-22M1376 953l-10-22" />
      </g>
    </svg>
  )
}
