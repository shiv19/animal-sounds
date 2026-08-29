import { useCallback, useEffect, useState } from 'react'
import type { SpeechConfig } from './audio'

export type PlayMode = 'tap' | 'auto'
export type Sequence = 'sound-first' | 'name-first'

export interface Settings extends SpeechConfig {
  mode: PlayMode
  /** Pause (seconds) after the sound + name finish, before auto-advancing */
  autoSeconds: number
  sequence: Sequence
  showWord: boolean
  favoritesOnly: boolean
}

export const AUTO_PAUSE_SECONDS = [1, 2, 4] as const

export const DEFAULT_SETTINGS: Settings = {
  mode: 'tap',
  autoSeconds: 2,
  sequence: 'sound-first',
  showWord: true,
  favoritesOnly: false,
  voiceURI: null,
  rate: 0.85
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as T
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
      ? { ...fallback, ...parsed }
      : parsed
  } catch {
    return fallback
  }
}

/** useState backed by localStorage; object values merge over defaults. */
export function useStoredState<T>(
  key: string,
  fallback: T,
  normalize: (v: T) => T = (v) => v
): [T, (update: T) => void] {
  const [value, setValue] = useState<T>(() => normalize(read(key, fallback)))

  const set = useCallback(
    (update: T) => {
      setValue(update)
      try {
        localStorage.setItem(key, JSON.stringify(update))
      } catch {
        /* private mode — keep playing without persistence */
      }
    },
    [key]
  )

  useEffect(() => {
    // Sync if another tab changed the value.
    const onStorage = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        try {
          setValue(normalize(JSON.parse(e.newValue) as T))
        } catch {
          /* ignore */
        }
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [key, normalize])

  return [value, set]
}

/** Old builds stored slide-length timers (4/7/10s); they are pauses now. */
function normalizeSettings(s: Settings): Settings {
  return (AUTO_PAUSE_SECONDS as readonly number[]).includes(s.autoSeconds)
    ? s
    : { ...s, autoSeconds: DEFAULT_SETTINGS.autoSeconds }
}

export const useSettings = () => useStoredState<Settings>('animal-sounds:settings', DEFAULT_SETTINGS, normalizeSettings)
export const useFavorites = () => useStoredState<string[]>('animal-sounds:favorites', [])
