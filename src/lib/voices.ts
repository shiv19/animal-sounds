import { useEffect, useState } from 'react'

export function useVoices(): SpeechSynthesisVoice[] {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])

  useEffect(() => {
    if (!('speechSynthesis' in window)) return
    const load = () => {
      const list = speechSynthesis.getVoices()
      if (list.length) setVoices(list)
    }
    load()
    speechSynthesis.addEventListener('voiceschanged', load)
    // Safari sometimes needs a nudge after unlock
    const t = window.setTimeout(load, 600)
    return () => {
      speechSynthesis.removeEventListener('voiceschanged', load)
      window.clearTimeout(t)
    }
  }, [])

  return voices
}

export const supportsFullscreen = () =>
  typeof document !== 'undefined' &&
  ('requestFullscreen' in document.documentElement || 'webkitRequestFullscreen' in document.documentElement)

const doc = () =>
  document as Document & { webkitFullscreenElement?: Element | null }

export const isFullscreenActive = () =>
  !!(document.fullscreenElement || doc().webkitFullscreenElement)

export async function toggleFullscreen(): Promise<void> {
  const el = document.documentElement as HTMLElement & {
    webkitRequestFullscreen?: () => Promise<void>
  }
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen()
    } else if (el.requestFullscreen) {
      await el.requestFullscreen({ navigationUI: 'hide' })
    } else if (el.webkitRequestFullscreen) {
      await el.webkitRequestFullscreen()
    }
  } catch {
    /* iOS Safari on iPhone has no fullscreen API — ignore */
  }
}
