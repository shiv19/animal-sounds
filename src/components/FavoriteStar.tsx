interface Props {
  active: boolean
  onToggle: () => void
}

export default function FavoriteStar({ active, onToggle }: Props) {
  return (
    <button
      className={active ? 'star on' : 'star'}
      onClick={onToggle}
      onPointerDown={(e) => e.stopPropagation()}
      aria-label={active ? 'Remove from favorites' : 'Add to favorites'}
      aria-pressed={active}
    >
      <StarIcon />
    </button>
  )
}

export function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinejoin="round"
        d="M12 3.6l2.5 5.1 5.6.8-4 4 .9 5.6-5-2.7-5 2.7.9-5.6-4-4 5.6-.8L12 3.6z"
      />
    </svg>
  )
}
