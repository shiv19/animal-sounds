import { StarIcon } from './FavoriteStar'

export default function StartSplash({ onStart }: { onStart: () => void }) {
  return (
    <div className="splash">
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
      <p className="tagline">Tap an animal. Hear it roar.</p>
      <button className="play-btn" onClick={onStart}>
        <PlayIcon />
        Tap to play
      </button>
      <p className="hint">Best with the sound turned up</p>
      <p className="hint parent-hint">
        For parents: tap the ☆ to save favorites · press &amp; hold the gear (top-left) for settings
      </p>
    </div>
  )
}

function PawMark() {
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
