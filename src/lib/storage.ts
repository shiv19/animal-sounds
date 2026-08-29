import { useCallback, useEffect, useState } from 'react'
import type { SpeechConfig } from './audio'

export type PlayMode = 'tap' | 'auto'
export type Sequence = 'sound-first' | 'name-first'

export interface Settings extends SpeechConfig {
  mode: PlayMode
  /** Auto-advance delay in seconds */
  autoSeconds: number
  sequence: Sequence
  showWord: boolean
  favoritesOnly: boolean
}

export const DEFAULT_SETTINGS: Settings = {
  mode: 'tap',
  autoSeconds: 7,
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
export function useStoredState<T>(key: string, fallback: T): [T, (update: T) => void] {
  const [value, setValue] = useState<T>(() => read(key, fallback))

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
          setValue(JSON.parse(e.newValue) as T)
        } catch {
          /* ignore */
        }
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [key])

  return [value, set]
}

export const useSettings = () => useStoredState<Settings>('animal-sounds:settings', DEFAULT_SETTINGS)
export const useFavorites = () => useStoredState<string[]>('animal-sounds:favorites', [])
