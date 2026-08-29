export default function HomeButton({ onHome }: { onHome: () => void }) {
  return (
    <button className="home-btn" aria-label="Back to home" onClick={onHome}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M3.5 10.5 12 3.5l8.5 7" />
        <path d="M5.5 9.5V20h13V9.5" />
      </svg>
    </button>
  )
}
