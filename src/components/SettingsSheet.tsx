import { useEffect, useState } from 'react'
import { engine } from '../lib/audio'
import { isFullscreenActive, supportsFullscreen, toggleFullscreen } from '../lib/voices'
import type { Settings } from '../lib/storage'

interface Props {
  settings: Settings
  onChange: (patch: Partial<Settings>) => void
  voices: SpeechSynthesisVoice[]
  onClose: () => void
  onHome: () => void
}

export default function SettingsSheet({ settings, onChange, voices, onClose, onHome }: Props) {
  const englishVoices = voices.filter((v) => v.lang.toLowerCase().startsWith('en'))
  const testVoice = () => void engine.speak('Cow says moo', settings)
  const [isFullscreen, setIsFullscreen] = useState(isFullscreenActive)

  // Fullscreen can also change outside this sheet (e.g. the start tap), so
  // keep the toggle label in sync with the real state.
  useEffect(() => {
    const sync = () => setIsFullscreen(isFullscreenActive())
    document.addEventListener('fullscreenchange', sync)
    document.addEventListener('webkitfullscreenchange', sync)
    return () => {
      document.removeEventListener('fullscreenchange', sync)
      document.removeEventListener('webkitfullscreenchange', sync)
    }
  }, [])

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Parent settings">
        <div className="sheet-head">
          <h2>Grown-ups only</h2>
          <button className="sheet-close" onClick={onClose} aria-label="Close settings">
            ✕
          </button>
        </div>

        <div className="field">
          <label>How it plays</label>
          <Segment
            value={settings.mode}
            onChange={(mode) => onChange({ mode })}
            options={[
              { v: 'tap', label: 'Tap to advance' },
              { v: 'auto', label: 'Auto-advance' }
            ]}
          />
        </div>

        {settings.mode === 'auto' && (
          <div className="field">
            <label>Pause after each animal</label>
            <Segment
              value={String(settings.autoSeconds)}
              onChange={(v) => onChange({ autoSeconds: Number(v) })}
              options={[
                { v: '1', label: 'Short · 1s' },
                { v: '2', label: 'Normal · 2s' },
                { v: '4', label: 'Long · 4s' }
              ]}
            />
            <p className="field-note">
              The full sound and name always play first, then the slide waits this long before
              moving on.
            </p>
          </div>
        )}

        <div className="field">
          <label>Sound order</label>
          <Segment
            value={settings.sequence}
            onChange={(sequence) => onChange({ sequence })}
            options={[
              { v: 'sound-first', label: 'Sound, then name' },
              { v: 'name-first', label: 'Name, then sound' }
            ]}
          />
        </div>

        <div className="row">
          <span>Show the written word</span>
          <Switch checked={settings.showWord} onChange={(showWord) => onChange({ showWord })} />
        </div>

        <div className="row">
          <span>Play favorites only</span>
          <Switch checked={settings.favoritesOnly} onChange={(favoritesOnly) => onChange({ favoritesOnly })} />
        </div>

        <div className="field">
          <label>Voice</label>
          <div className="voice-row">
            <select
              value={settings.voiceURI ?? ''}
              onChange={(e) => onChange({ voiceURI: e.target.value || null })}
            >
              <option value="">Device default</option>
              {englishVoices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
            <button className="ghost-btn" onClick={testVoice}>
              Test
            </button>
          </div>
        </div>

        <div className="field">
          <label>Speaking speed</label>
          <input
            type="range"
            min={0.6}
            max={1.1}
            step={0.05}
            value={settings.rate}
            onChange={(e) => onChange({ rate: Number(e.target.value) })}
          />
        </div>

        {supportsFullscreen() && (
          <button className="primary-btn" onClick={() => void toggleFullscreen()}>
            {isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          </button>
        )}

        <button className="primary-btn" onClick={onHome}>
          Back to home
        </button>
      </div>
    </div>
  )
}

function Segment<T extends string>({
  value,
  onChange,
  options
}: {
  value: T
  onChange: (v: T) => void
  options: Array<{ v: T; label: string }>
}) {
  return (
    <div className="seg">
      {options.map((o) => (
        <button key={o.v} className={o.v === value ? 'on' : ''} onClick={() => onChange(o.v)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      className={checked ? 'switch on' : 'switch'}
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
    />
  )
}
