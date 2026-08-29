import { useRef, useState } from 'react'
import { ANIMALS } from '../data/animals'
import type { AnimalAssets } from '../data/animals'
import { engine } from '../lib/audio'
import { shuffled } from '../lib/shuffle'
import type { Settings } from '../lib/storage'
import HomeButton from './HomeButton'

interface Props {
  settings: Settings
  onHome: () => void
}

/** Few, large tiles per page — small fingers need big targets. */
const PAGE_SIZE = 6

export default function Gallery({ settings, onHome }: Props) {
  const seqRef = useRef(0)
  // Shuffled on every entry, and re-shufflable on demand — so "where's the
  // cow?" never happens in the same spot twice.
  const [deck, setDeck] = useState(() => shuffled(ANIMALS))
  const pagesRef = useRef<HTMLDivElement | null>(null)

  const pages: AnimalAssets[][] = []
  for (let i = 0; i < deck.length; i += PAGE_SIZE) {
    pages.push(deck.slice(i, i + PAGE_SIZE))
  }

  const reshuffle = () => {
    setDeck((d) => shuffled(d))
    pagesRef.current?.scrollTo({ left: 0, behavior: 'smooth' })
  }

  const play = (animal: AnimalAssets) => {
    const my = ++seqRef.current
    void (async () => {
      try {
        await engine.playSound(animal.sound)
        if (seqRef.current !== my) return
        await engine.speak(animal.name, settings)
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
