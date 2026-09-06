import { useMemo, useRef, useState } from 'react'
import { CATEGORIES, worldAnimals } from '../data/animals'
import type { AnimalAssets, World } from '../data/animals'
import { engine } from '../lib/audio'
import { shuffled } from '../lib/shuffle'
import type { Settings } from '../lib/storage'
import HomeButton from './HomeButton'

interface Props {
  world: World
  settings: Settings
  /** Pills filter directly — unlike other modes' chips, no picker detour. */
  onWorldChange: (w: World) => void
  onHome: () => void
}

/** Few, large tiles per page — small fingers need big targets. */
const PAGE_SIZE = 6

export default function Gallery({ world, settings, onWorldChange, onHome }: Props) {
  const seqRef = useRef(0)
  // Shuffled on every entry and world change, and re-shufflable on demand —
  // so "where's the cow?" never happens in the same spot twice.
  const [nonce, setNonce] = useState(0)
  const pagesRef = useRef<HTMLDivElement | null>(null)

  const deck: AnimalAssets[] = useMemo(() => shuffled(worldAnimals(world)), [world, nonce])

  const pages: AnimalAssets[][] = []
  for (let i = 0; i < deck.length; i += PAGE_SIZE) {
    pages.push(deck.slice(i, i + PAGE_SIZE))
  }

  const reshuffle = () => {
    setNonce((n) => n + 1)
    pagesRef.current?.scrollTo({ left: 0, behavior: 'smooth' })
  }

  const play = (animal: AnimalAssets) => {
    const my = ++seqRef.current
    void (async () => {
      try {
        await engine.playSound(animal.sound)
        if (seqRef.current !== my) return
        await engine.speak(animal.name, settings, animal.recording)
      } catch {
        /* aborted by a newer tap */
      }
    })()
  }

  return (
    <div className="game-screen gallery-screen">
      <HomeButton onHome={onHome} />
      <button className="chip back-chip" onClick={reshuffle}>
        <ShuffleIcon /> Shuffle
      </button>
      <div className="filter-bar" role="tablist" aria-label="Animal worlds">
        <button
          className={world === 'all' ? 'filter-chip on' : 'filter-chip'}
          onClick={() => onWorldChange('all')}
        >
          🐾 All
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            className={world === cat.id ? 'filter-chip on' : 'filter-chip'}
            onClick={() => onWorldChange(cat.id)}
          >
            {cat.emoji} {cat.name}
          </button>
        ))}
      </div>
      <div className="gallery-pages" ref={pagesRef}>
        {pages.map((page, pi) => (
          <div className="gallery-page" key={pi}>
            {page.map((animal) => (
              <button key={animal.id} className="gallery-tile" onClick={() => play(animal)}>
                <img src={animal.photo} alt={animal.name} draggable={false} />
                <span>{animal.name}</span>
              </button>
            ))}
          </div>
        ))}
      </div>
      <p className="gallery-hint">Swipe to see more</p>
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
