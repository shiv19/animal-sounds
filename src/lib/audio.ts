export interface SpeechConfig {
  voiceURI: string | null
  rate: number
}

type Pending = {
  cleanup: () => void
  abort: () => void
}

/**
 * Tiny audio engine: bundled clips via HTMLAudioElement plus spoken names
 * (recorded voice clip when available, browser TTS as fallback). All playback
 * goes through here so neither the UI nor the modes care which path ran.
 */
class AudioEngine {
  private clips = new Map<string, HTMLAudioElement>()
  private pendingSound: Pending | null = null
  private didUnlock = false

  /** Must be called from a user gesture: unlocks audio + speech on iOS. */
  unlock() {
    if (this.didUnlock) return
    this.didUnlock = true
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
      const warm = new SpeechSynthesisUtterance('hello')
      warm.volume = 0.05
      warm.rate = 2
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
    return this.playClip(src, 1)
  }

  /** All clips share one playback slot: starting a new one stops the previous. */
  private playClip(src: string, rate: number): Promise<void> {
    this.stopSound()
    const a = this.clip(src)
    a.playbackRate = rate
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

  /**
   * Speak a name or phrase. Prefers the recorded clip — one consistent voice
   * everywhere, no TTS engine flakiness — with the rate slider applied as
   * playbackRate (pitch-preserving). Falls back to browser TTS only when the
   * clip is missing or fails; a 'stopped' abort propagates so navigating
   * away never triggers the fallback.
   */
  speak(name: string, cfg: SpeechConfig, clip?: string): Promise<void> {
    if (!clip) return this.speakTTS(name, cfg)
    const rate = Math.min(Math.max(cfg.rate, 0.6), 1.2)
    return this.playClip(clip, rate).catch((err: unknown) => {
      if (err instanceof Error && err.message === 'stopped') throw err
      return this.speakTTS(name, cfg)
    })
  }

  private speakTTS(name: string, cfg: SpeechConfig): Promise<void> {
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

        let settled = false
        let started = false
        let watchdog = 0
        const settle = () => {
          if (settled) return
          settled = true
          window.clearTimeout(failsafe)
          window.clearTimeout(watchdog)
          resolve()
        }
        const stop = () => {
          if (settled) return
          settled = true
          window.clearTimeout(failsafe)
          window.clearTimeout(watchdog)
          reject(new Error('stopped'))
        }
        // Hard cap: some engines drop utterances without ever firing events,
        // and the flow must never wait on a voice that will not come.
        const failsafe = window.setTimeout(settle, 8000)
        u.onstart = () => {
          started = true
          window.clearTimeout(watchdog)
        }
        u.onend = settle
        u.onerror = (e) => {
          if (e.error === 'interrupted' || e.error === 'canceled') stop()
          else settle() // a bad voice shouldn't break the flow
        }

        // Engines are flaky in well-known ways: Chrome freezes its queue until
        // cancel()+resume(), and iOS can silently swallow a speak() that
        // follows a cancel. Clear the queue, nudge, and retry if the
        // utterance never actually started.
        const attempt = (tries: number) => {
          if (settled) return
          speechSynthesis.cancel()
          speechSynthesis.speak(u)
          speechSynthesis.resume()
          watchdog = window.setTimeout(() => {
            if (settled || started) return
            if (tries < 2) attempt(tries + 1)
            else settle() // silent failure beats stalling the flow
          }, 450)
        }
        attempt(0)
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
