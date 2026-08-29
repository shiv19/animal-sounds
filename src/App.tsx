import { useEffect, useState } from 'react'
import { ANIMALS } from './data/animals'
import { engine } from './lib/audio'
import { useFavorites, useSettings } from './lib/storage'
import { isFullscreenActive, supportsFullscreen, toggleFullscreen } from './lib/voices'
import Home from './components/Home'
import Slideshow from './components/Slideshow'
import MemoryGame from './components/MemoryGame'
import QuizGame from './components/QuizGame'
import Gallery from './components/Gallery'

type Phase = 'home' | 'slideshow' | 'memory' | 'quiz' | 'gallery'

export default function App() {
  const [phase, setPhase] = useState<Phase>('home')
  const [settings, setSettings] = useSettings()
  const [favorites, setFavorites] = useFavorites()

  // Runs inside the card tap gesture: unlocks audio + speech on iOS and goes
  // fullscreen for an immersive experience in every mode.
  const enter = (next: Phase) => {
    engine.unlock()
    engine.preload(ANIMALS.map((a) => a.sound))
    if (supportsFullscreen() && !isFullscreenActive()) void toggleFullscreen()
    setPhase(next)
  }

  const goHome = () => {
    engine.stopAll()
    if (isFullscreenActive()) void toggleFullscreen()
    setPhase('home')
  }

  // Desktop testing convenience: Esc leaves any mode.
  useEffect(() => {
    if (phase === 'home') return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') goHome()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (phase === 'home') {
    return (
      <Home
        onSlideshow={() => enter('slideshow')}
        onMemory={() => enter('memory')}
        onQuiz={() => enter('quiz')}
        onGallery={() => enter('gallery')}
      />
    )
  }

  if (phase === 'gallery') {
    return <Gallery settings={settings} onHome={goHome} />
  }

  if (phase === 'memory') {
    return <MemoryGame settings={settings} favorites={favorites} onHome={goHome} />
  }

  if (phase === 'quiz') {
    return <QuizGame settings={settings} favorites={favorites} onHome={goHome} />
  }

  return (
    <Slideshow
      settings={settings}
      onSettingsChange={setSettings}
      favorites={favorites}
      onToggleFavorite={(id) =>
        setFavorites(favorites.includes(id) ? favorites.filter((f) => f !== id) : [...favorites, id])
      }
      onHome={goHome}
    />
  )
}
