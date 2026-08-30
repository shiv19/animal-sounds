# Animal Sounds

A fullscreen, installable PWA that teaches animal names and sounds — built for a
19-month-old. One animal per slide: tap the animal to replay its sound and name,
tap the screen edges or swipe to move on. Parents get a hold-to-open settings
gate; everything else is toddler-proof.

## Features

- **Slideshow** of 17 animals (farm first, then wild), shuffled each visit
- **Tap the animal** → plays the sound, then the spoken name (order and speed configurable)
- **Favorites** — tap the star; optional "favorites only" mode (stored per device)
- **Auto-advance mode** with speed setting, for wind-down time
- **Parent gate** — hold the gear for 2 seconds to open settings; settings let you
  pick speaking speed, sound order, word visibility, and fullscreen
- **Recorded voice** — all names and phrases ("Where is the cow?") play from
  ElevenLabs voice clips; browser TTS remains only as a fallback if a clip fails
- **Works offline** — the service worker precaches every photo, sound and voice
  clip; after the first visit it loads instantly with no network
- Recorded voice clips can replace TTS later without code changes (see below)

## Development

```bash
npm install
npm run dev        # serves at http://localhost:5173/animal-sounds/
npm run build      # typecheck + production build into dist/
npm run preview    # serve the production build locally
```

## Adding an animal

1. Drop a photo into `assets-src/photos/<id>.jpg` (≥800px, square-croppable)
2. Drop a sound into `assets-src/sounds/<id>.<mp3|ogg|wav|flac>` (1–15s ideal;
   silence at both ends is trimmed automatically, clips are capped at 8s with a fade)
3. Add an entry to `src/data/animals.ts` (id, name, category, accent color)
4. `npm run assets` — regenerates the optimized WebP photos and MP3 sounds
5. Add a credits line to `assets-src/PHOTO-CREDITS.md` / `SOUND-CREDITS.md`

## Voice recordings

Names and phrases are real recorded clips (ElevenLabs `eleven_multilingual_v2`,
the voice configured via `ELEVENLABS_VOICE_ID`), not live TTS. The tooling lives
in `localscripts/` (gitignored; needs `sag` and `ELEVENLABS_API_KEY` in the
environment):

- `gen-names.sh` — generates every name + phrase take into `localscripts/raw/`
  (`SEED=42 ./gen-names.sh` retakes with a different seed; existing takes are skipped)
- `process-names.sh` — trims silence, pads 60/150ms, and loudness-matches every
  clip to −15 LUFS (the animal-sound clips measure ≈ −14..−15.5), peaks capped
  at −1.5 dBTP; writes into `public/animals/{names,phrases}/`
- `qa-names.py` — transcribes every processed clip with whisper `small.en`
  (beam search, temperature 0; single greedy decodes flip vowels on sub-second
  words) and fails on any mismatch

`src/lib/audio.ts` plays `animal.recording` / `phraseClip(...)` when present and
falls back to browser TTS if a clip fails to load, so a missing file never
silences a mode.

## Deployment

Fully automatic: every push to `main` runs a GitHub Actions workflow that builds
the app and deploys it to GitHub Pages at https://shiv19.com/animal-sounds (the
Vite `base` and the service-worker scope are set to `/animal-sounds/`). Check
the repo's Actions tab for deploy status. Devices that already opened the app
pick up updates on their next visit or two (service-worker update cycle).

## Asset licenses

Photos and sounds were sourced from free-license platforms (Unsplash, Pexels,
Wikimedia Commons, Openverse, LibreShot). Attribution and license notes live in
`assets-src/PHOTO-CREDITS.md` and `assets-src/SOUND-CREDITS.md`. A few photo
licenses could not be fully verified from search-CDN URLs — swap in your own
photos by following "Adding an animal" if that matters to you.
