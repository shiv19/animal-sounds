export interface SpeechConfig {
  voiceURI: string | null
  rate: number
}

type Pending = {
  cleanup: () => void
  abort: () => void
}

/**
 * Tiny audio engine: bundled animal-sound clips via HTMLAudioElement plus
 * spoken names via the Web Speech API. All playback goes through here so a
 * recorded-voice provider can later replace speak() without touching the UI.
 */
class AudioEngine {
  private clips = new Map<string, HTMLAudioElement>()
  private pendingSound: Pending | null = null

  /** Must be called from a user gesture: unlocks audio + speech on iOS. */
  unlock() {
    try {
      const Ctx: typeof AudioContext | undefined =
        window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (Ctx) {
        const ctx = new Ctx()
        const buffer = ctx.createBuffer(1, 1, 22050)
        const src = ctx.createBufferSource()
        src.buffer = buffer
        src.connect(ctx.destination)
        src.start(0)
        void ctx.resume()
        window.setTimeout(() => void ctx.close().catch(() => {}), 800)
      }
    } catch {
      /* audio unlock is best-effort */
    }
    try {
      const warm = new SpeechSynthesisUtterance(' ')
      warm.volume = 0
      speechSynthesis.speak(warm)
    } catch {
      /* speech unsupported */
    }
  }

  /** Start fetching (and cache-bundle) the sound clips. */
  preload(paths: string[]) {
    for (const p of paths) this.clip(p)
  }

  private clip(src: string): HTMLAudioElement {
    let a = this.clips.get(src)
    if (!a) {
      a = new Audio()
      a.preload = 'auto'
      a.src = src
      this.clips.set(src, a)
    }
    return a
  }

  playSound(src: string): Promise<void> {
    this.stopSound()
    const a = this.clip(src)
    return new Promise<void>((resolve, reject) => {
      const cleanup = () => {
        a.removeEventListener('ended', onEnd)
        a.removeEventListener('error', onErr)
        if (this.pendingSound?.abort === abort) this.pendingSound = null
      }
      const onEnd = () => {
        cleanup()
        resolve()
      }
      const onErr = () => {
        cleanup()
        reject(new Error(`sound failed: ${src}`))
      }
      const abort = () => {
        cleanup()
        a.pause()
        reject(new Error('stopped'))
      }
      a.addEventListener('ended', onEnd)
      a.addEventListener('error', onErr)
      this.pendingSound = { cleanup, abort }
      a.currentTime = 0
      void a.play().catch(onErr)
    })
  }

  private stopSound() {
    this.pendingSound?.abort()
    this.pendingSound = null
  }

  speak(name: string, cfg: SpeechConfig): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      try {
        if (!('speechSynthesis' in window)) return reject(new Error('speech unsupported'))
        const u = new SpeechSynthesisUtterance(name)
        const voice = speechSynthesis.getVoices().find((v) => v.voiceURI === cfg.voiceURI)
        if (voice) {
          u.voice = voice
          u.lang = voice.lang
        } else {
          u.lang = 'en-US'
        }
        u.rate = cfg.rate
        u.pitch = 1.05
        u.onend = () => resolve()
        u.onerror = (e) => {
          if (e.error === 'interrupted' || e.error === 'canceled') reject(new Error('stopped'))
          else resolve() // speak anyway; a bad voice shouldn't break the slide
        }
        speechSynthesis.cancel()
        speechSynthesis.speak(u)
      } catch (err) {
        reject(err instanceof Error ? err : new Error('speech failed'))
      }
    })
  }

  stopAll() {
    this.stopSound()
    try {
      speechSynthesis.cancel()
    } catch {
      /* noop */
    }
  }
}

export const engine = new AudioEngine()

export const wait = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms))
