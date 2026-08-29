import { useState } from 'react'
import { ANIMALS } from './data/animals'
import { engine } from './lib/audio'
import { useFavorites, useSettings } from './lib/storage'
import { supportsFullscreen, toggleFullscreen } from './lib/voices'
import StartSplash from './components/StartSplash'
import Slideshow from './components/Slideshow'

export default function App() {
  const [started, setStarted] = useState(false)
  const [settings, setSettings] = useSettings()
  const [favorites, setFavorites] = useFavorites()

  const start = () => {
    // Must happen inside the tap gesture: unlocks audio + speech on iOS.
    engine.unlock()
    engine.preload(ANIMALS.map((a) => a.sound))
    if (supportsFullscreen()) void toggleFullscreen()
    setStarted(true)
  }

  if (!started) return <StartSplash onStart={start} />

  return (
    <Slideshow
      settings={settings}
      onSettingsChange={setSettings}
      favorites={favorites}
      onToggleFavorite={(id) =>
        setFavorites(favorites.includes(id) ? favorites.filter((f) => f !== id) : [...favorites, id])
      }
    />
  )
}
