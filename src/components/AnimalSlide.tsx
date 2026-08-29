import type { CSSProperties } from 'react'
import type { AnimalAssets } from '../data/animals'

interface Props {
  animal: AnimalAssets
  direction: 'next' | 'prev'
  showWord: boolean
  pop: boolean
  onPopEnd: () => void
}

/** A slight, deterministic tilt so each page feels hand-placed, like a board book. */
function tiltFor(id: string): string {
  const sum = [...id].reduce((s, c) => s + c.charCodeAt(0), 0)
  return sum % 2 === 0 ? '-1.1deg' : '1.1deg'
}

export default function AnimalSlide({ animal, direction, showWord, pop, onPopEnd }: Props) {
  return (
    <div className={`slide ${direction === 'prev' ? 'dir-prev' : 'dir-next'}`}>
      <figure
        className={pop ? 'photo-card pop' : 'photo-card'}
        style={{ '--tilt': tiltFor(animal.id) } as CSSProperties}
      >
        <img src={animal.photo} alt={animal.name} draggable={false} onAnimationEnd={onPopEnd} />
      </figure>
      {showWord && <h1 className="word">{animal.name}</h1>}
    </div>
  )
}
