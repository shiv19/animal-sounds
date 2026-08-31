import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react'
import { ANIMALS } from '../data/animals'
import type { AnimalAssets } from '../data/animals'
import { engine, wait } from '../lib/audio'
import { shuffled } from '../lib/shuffle'
import { useVoices } from '../lib/voices'
import type { Settings } from '../lib/storage'
import AnimalSlide from './AnimalSlide'
import FavoriteStar, { StarIcon } from './FavoriteStar'
import ParentGate from './ParentGate'
import SettingsSheet from './SettingsSheet'

interface Props {
  settings: Settings
  onSettingsChange: (s: Settings) => void
  favorites: string[]
  onToggleFavorite: (id: string) => void
  onHome: () => void
}

export default function Slideshow({ settings, onSettingsChange, favorites, onToggleFavorite, onHome }: Props) {
  // One shuffled deck per visit, so the order feels fresh without repeating.
  const orderRef = useRef<AnimalAssets[]>(shuffled(ANIMALS))
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState<'next' | 'prev'>('next')
  const [replayNonce, setReplayNonce] = useState(0)
  const [pop, setPop] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const voices = useVoices()
  const [introDone, setIntroDone] = useState(false)
  const [pageVisible, setPageVisible] = useState(() => !document.hidden)

  const favoritesSet = useMemo(() => new Set(favorites), [favorites])
  const deck = useMemo(
    () => (settings.favoritesOnly ? orderRef.current.filter((a) => favoritesSet.has(a.id)) : orderRef.current),
    [settings.favoritesOnly, favoritesSet]
  )

  const go = useCallback(
    (dir: 1 | -1) => {
      setDirection(dir === 1 ? 'next' : 'prev')
      setIndex((i) => (i + dir + deck.length) % deck.length)
    },
    [deck.length]
  )

  const replay = useCallback(() => {
    setPop(true)
    setReplayNonce((n) => n + 1)
  }, [])

  // Guard against the deck shrinking (favorites-only toggled or favorite removed).
  useEffect(() => {
    if (index >= deck.length) setIndex(0)
  }, [deck.length, index])

  const current = deck[Math.min(index, deck.length - 1)]

  // Play the sound, then the name (order per settings). A token guards against
  // navigating mid-sequence: stale runs bail out and stop the engine.
  useEffect(() => {
    if (!current) return
    let cancelled = false
    setIntroDone(false)
    const run = async () => {
      engine.stopAll()
      try {
        if (settings.sequence === 'name-first') {
          await engine.speak(current.name, settings, current.recording)
          if (cancelled) return
          await wait(250)
          if (cancelled) return
          await engine.playSound(current.sound)
        } else {
          await engine.playSound(current.sound)
          if (cancelled) return
          await wait(300)
          if (cancelled) return
          await engine.speak(current.name, settings, current.recording)
        }
      } catch {
        /* aborted by navigation or a missing clip — stay quiet on this slide */
      }
      if (!cancelled) setIntroDone(true)
    }
    void run()
    return () => {
      cancelled = true
      engine.stopAll()
    }
  }, [current, replayNonce, settings.sequence, settings.rate, settings.voiceURI])

  // Auto-advance: play the full sound + name, pause for the configured gap,
  // then move on. Paused while settings are open or the app is hidden.
  useEffect(() => {
    if (settings.mode !== 'auto' || settingsOpen || !pageVisible || !current || !introDone) return
    const t = window.setTimeout(() => go(1), settings.autoSeconds * 1000)
    return () => window.clearTimeout(t)
  }, [index, replayNonce, introDone, settings.mode, settings.autoSeconds, settingsOpen, pageVisible, go, current])

  // Keep the screen on while he's watching (e.g. propped up during a feed).
  // Browsers auto-release the lock when the tab hides, so re-acquire on return.
  useEffect(() => {
    let lock: WakeLockSentinel | null = null
    const acquire = async () => {
      try {
        if ('wakeLock' in navigator && !lock) lock = await navigator.wakeLock.request('screen')
      } catch {
        /* denied or unsupported — screen just sleeps normally */
      }
    }
    const onVisibility = () => {
      if (document.hidden) {
        lock = null
      } else {
        void acquire()
      }
    }
    void acquire()
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      void lock?.release()
      lock = null
    }
  }, [])

  // Silence + pause when the app goes to the background.
  useEffect(() => {
    const onVisibility = () => {
      setPageVisible(!document.hidden)
      if (document.hidden) engine.stopAll()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  // Desktop convenience while testing: arrows navigate, space replays.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (settingsOpen) return
      if (e.key === 'ArrowRight') go(1)
      else if (e.key === 'ArrowLeft') go(-1)
      else if (e.key === ' ') replay()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, replay, settingsOpen])

  const downRef = useRef<{ x: number; y: number } | null>(null)
  const onPointerDown = (e: ReactPointerEvent) => {
    downRef.current = { x: e.clientX, y: e.clientY }
  }
  const onPointerUp = (e: ReactPointerEvent) => {
    const down = downRef.current
    downRef.current = null
    if (!down || settingsOpen) return
    const dx = e.clientX - down.x
    const dy = e.clientY - down.y
    // Swipe navigates…
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.3) {
      go(dx < 0 ? 1 : -1)
      return
    }
    // …and taps: left edge = previous, right edge = next, anywhere else = replay.
    const x = e.clientX / window.innerWidth
    if (x < 0.2) go(-1)
    else if (x > 0.8) go(1)
    else replay()
  }

  if (!current) {
    return (
      <div className="stage">
        <div className="empty">
          <StarIcon />
          <p>No favorites yet! Tap the star on an animal you love, and it will live here.</p>
          <button onClick={() => onSettingsChange({ ...settings, favoritesOnly: false })}>
            Show all animals
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="stage"
      style={{ '--accent': current.accent } as CSSProperties}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="wash wash-a" aria-hidden />
      <div className="wash wash-b" aria-hidden />

      <AnimalSlide
        key={current.id}
        animal={current}
        direction={direction}
        showWord={settings.showWord}
        pop={pop}
        onPopEnd={() => setPop(false)}
      />

      <FavoriteStar active={favoritesSet.has(current.id)} onToggle={() => onToggleFavorite(current.id)} />
      <ParentGate onOpen={() => {
        engine.stopAll()
        setSettingsOpen(true)
      }} />

      <div className="dots" aria-hidden>
        {deck.map((a, i) => (
          <span key={a.id} className={i === index ? 'dot on' : 'dot'} />
        ))}
      </div>

      {settingsOpen && (
        <SettingsSheet
          settings={settings}
          onChange={(patch) => onSettingsChange({ ...settings, ...patch })}
          voices={voices}
          onClose={() => setSettingsOpen(false)}
          onHome={onHome}
        />
      )}
    </div>
  )
}
