import type { CSSProperties } from 'react'

interface Props {
  onSlideshow: () => void
  onMemory: () => void
  onQuiz: () => void
  onGallery: () => void
  onFindIt: () => void
}

export default function Home({ onSlideshow, onMemory, onQuiz, onGallery, onFindIt }: Props) {
  return (
    <div className="splash home">
      <div className="splash-washes" aria-hidden>
        <span />
        <span />
        <span />
      </div>
      <PawMark />
      <h1>
        Animal
        <br />
        Sounds
      </h1>
      <div className="home-menu">
        <button
          className="menu-card"
          style={{ '--card-accent': '#79a85b' } as CSSProperties}
          onClick={onSlideshow}
        >
          <span className="menu-icon">
            <PlayIcon />
          </span>
          <span className="menu-text">
            <strong>Slideshow</strong>
            <small>Watch and listen</small>
          </span>
        </button>
        <button
          className="menu-card"
          style={{ '--card-accent': '#6b9bd1' } as CSSProperties}
          onClick={onMemory}
        >
          <span className="menu-icon">
            <MemoryIcon />
          </span>
          <span className="menu-text">
            <strong>Memory match</strong>
            <small>Find the pairs</small>
          </span>
        </button>
        <button
          className="menu-card"
          style={{ '--card-accent': '#e8a13c' } as CSSProperties}
          onClick={onQuiz}
        >
          <span className="menu-icon">
            <QuizIcon />
          </span>
          <span className="menu-text">
            <strong>Guess who?</strong>
            <small>Scratch to reveal</small>
          </span>
        </button>
        <button
          className="menu-card"
          style={{ '--card-accent': '#5bafa0' } as CSSProperties}
          onClick={onGallery}
        >
          <span className="menu-icon">
            <GalleryIcon />
          </span>
          <span className="menu-text">
            <strong>Gallery</strong>
            <small>Explore all animals</small>
          </span>
        </button>
        <button
          className="menu-card"
          style={{ '--card-accent': '#a277c9' } as CSSProperties}
          onClick={onFindIt}
        >
          <span className="menu-icon">
            <FindIcon />
          </span>
          <span className="menu-text">
            <strong>Find it!</strong>
            <small>Where is it?</small>
          </span>
        </button>
      </div>
      <p className="hint">Best with the sound turned up</p>
      <p className="hint parent-hint">
        For parents: tap the ☆ to save favorites · press &amp; hold the gear (top-left) in the
        slideshow for settings
      </p>
    </div>
  )
}

export function PawMark() {
  return (
    <svg className="splash-paw" viewBox="0 0 64 64" aria-hidden>
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

export function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M8 5.5v13c0 .9 1 1.5 1.8 1L20 13a1.2 1.2 0 0 0 0-2L9.8 4.5C9 4 8 4.6 8 5.5Z" />
    </svg>
  )
}

export function MemoryIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <rect x="3" y="3" width="8" height="8" rx="2" />
      <rect x="13" y="3" width="8" height="8" rx="2" />
      <rect x="3" y="13" width="8" height="8" rx="2" />
      <rect x="13" y="13" width="8" height="8" rx="2" />
    </svg>
  )
}

export function QuizIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden>
      <path d="M8.8 9.2a3.2 3.2 0 1 1 5 2.7c-1.1.8-1.8 1.5-1.8 2.8" />
      <circle cx="12" cy="18.6" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="12" cy="18.6" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function GalleryIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3.5" y="4" width="17" height="16" rx="2.5" />
      <circle cx="9" cy="9.5" r="1.6" />
      <path d="M6 17.5l4.2-4.7 3.3 3.7 2.7-3 3.3 4" />
    </svg>
  )
}

export function FindIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m15.5 15.5 4.5 4.5" />
    </svg>
  )
}
