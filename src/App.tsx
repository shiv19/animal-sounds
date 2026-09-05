import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { worldAnimals } from './data/animals'
import type { World } from './data/animals'
import { engine } from './lib/audio'
import { useFavorites, useSettings } from './lib/storage'
import { isFullscreenActive, supportsFullscreen, toggleFullscreen } from './lib/voices'
import Home from './components/Home'
import CategoryPicker from './components/CategoryPicker'
import Slideshow from './components/Slideshow'
import MemoryGame from './components/MemoryGame'
import QuizGame from './components/QuizGame'
import Gallery from './components/Gallery'
import FindIt from './components/FindIt'

type Phase = 'home' | 'slideshow' | 'memory' | 'quiz' | 'gallery' | 'findit'
/** A playable mode — everything except the home screen. */
export type Mode = Exclude<Phase, 'home'>

/** The playful question each mode asks on the world picker. */
const PICKER_QUESTION: Record<Mode, string> = {
  slideshow: 'Who do you want to watch?',
  memory: 'Whose pairs will you find?',
  quiz: 'Who do you want to hear?',
  gallery: 'Who do you want to meet?',
  findit: 'Where should we look?'
}

export default function App() {
  const [phase, setPhase] = useState<Phase>('home')
  const [world, setWorld] = useState<World>('all')
  const [pickerMode, setPickerMode] = useState<Mode | null>(null)
  const [settings, setSettings] = useSettings()
  const [favorites, setFavorites] = useFavorites()

  // Runs inside the card tap gesture: unlocks audio + speech on iOS and goes
  // fullscreen for an immersive experience in every mode.
  const unlockAndImmerse = () => {
    engine.unlock()
    if (supportsFullscreen() && !isFullscreenActive()) void toggleFullscreen()
  }

  const preload = (w: World) => {
    const list = worldAnimals(w)
    engine.preload([...list.map((a) => a.sound), ...list.map((a) => a.recording ?? '')].filter(Boolean))
  }

  // Picking a world starts the mode. From home this is the entry gesture;
  // from an in-mode world chip the mode is already running and just refilters.
  const startMode = (mode: Mode, w: World) => {
    unlockAndImmerse()
    preload(w)
    setWorld(w)
    setPhase(mode)
    setPickerMode(null)
  }

  const changeWorld = (w: World) => {
    preload(w)
    setWorld(w)
    setPickerMode(null)
  }

  const goHome = () => {
    engine.stopAll()
    if (isFullscreenActive()) void toggleFullscreen()
    setPhase('home')
    setPickerMode(null)
  }

  // Desktop testing convenience: Esc leaves any mode (and the picker).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (pickerMode) setPickerMode(null)
      else if (phase !== 'home') goHome()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  let screen: ReactNode
  if (phase === 'home') {
    screen = <Home onPickMode={setPickerMode} />
  } else if (phase === 'findit') {
    screen = (
      <FindIt
        key={world}
        world={world}
        settings={settings}
        favorites={favorites}
        onPickWorld={() => setPickerMode('findit')}
        onHome={goHome}
      />
    )
  } else if (phase === 'gallery') {
    screen = (
      <Gallery
        key={world}
        world={world}
        settings={settings}
        onPickWorld={() => setPickerMode('gallery')}
        onHome={goHome}
      />
    )
  } else if (phase === 'memory') {
    screen = (
      <MemoryGame
        key={world}
        world={world}
        settings={settings}
        favorites={favorites}
        onPickWorld={() => setPickerMode('memory')}
        onHome={goHome}
      />
    )
  } else if (phase === 'quiz') {
    screen = (
      <QuizGame
        key={world}
        world={world}
        settings={settings}
        favorites={favorites}
        onPickWorld={() => setPickerMode('quiz')}
        onHome={goHome}
      />
    )
  } else {
    screen = (
      <Slideshow
        key={world}
        world={world}
        settings={settings}
        onSettingsChange={setSettings}
        favorites={favorites}
        onToggleFavorite={(id) =>
          setFavorites(favorites.includes(id) ? favorites.filter((f) => f !== id) : [...favorites, id])
        }
        onPickWorld={() => setPickerMode('slideshow')}
        onHome={goHome}
      />
    )
  }

  return (
    <>
      {screen}
      {pickerMode && (
        <CategoryPicker
          question={PICKER_QUESTION[pickerMode]}
          current={world}
          onPick={(w) => (phase === 'home' ? startMode(pickerMode, w) : changeWorld(w))}
          onClose={() => setPickerMode(null)}
        />
      )}
    </>
  )
}
