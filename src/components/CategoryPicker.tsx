import type { CSSProperties } from 'react'
import { ANIMALS, CATEGORIES } from '../data/animals'
import type { World } from '../data/animals'

interface Props {
  /** Which mode is starting — drives the playful question line */
  question: string
  current: World
  onPick: (w: World) => void
  onClose: () => void
}

/** Full-screen "pick a world" stop between the home menu and every mode.
    Big tappable cards, one per animal category, plus an everything card. */
export default function CategoryPicker({ question, current, onPick, onClose }: Props) {
  const pick = (w: World) => {
    try {
      navigator.vibrate?.(12)
    } catch {
      /* haptics are best-effort */
    }
    onPick(w)
  }

  return (
    <div className="picker" role="dialog" aria-label="Pick a world">
      <div className="picker-washes" aria-hidden>
        <span />
        <span />
        <span />
      </div>
      <button className="picker-close" onClick={onClose} aria-label="Back">
        ✕
      </button>
      <div className="picker-inner">
        <h2>Pick a world</h2>
        <p className="picker-sub">{question}</p>
        <div className="world-grid">
          {CATEGORIES.map((cat, i) => {
            const members = ANIMALS.filter((a) => a.category === cat.id)
            return (
              <button
                key={cat.id}
                className={current === cat.id ? 'world-card on' : 'world-card'}
                style={{ '--wc': cat.accent, '--d': `${i * 60}ms` } as CSSProperties}
                onClick={() => pick(cat.id)}
              >
                <span className="mascot" aria-hidden>
                  {cat.emoji}
                </span>
                <strong>{cat.name}</strong>
                <span className="peers" aria-hidden>
                  {members.slice(0, 3).map((a) => a.emoji).join(' ')}
                </span>
                <small>{cat.tagline}</small>
              </button>
            )
          })}
          <button
            className={current === 'all' ? 'world-card wide on' : 'world-card wide'}
            style={{ '--d': `${CATEGORIES.length * 60}ms` } as CSSProperties}
            onClick={() => pick('all')}
          >
            <span className="mascot" aria-hidden>
              🐾
            </span>
            <strong>All the animals!</strong>
            <small>{ANIMALS.length} friends are waiting</small>
          </button>
        </div>
      </div>
    </div>
  )
}
