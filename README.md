# Animal Sounds

A fullscreen, installable PWA that teaches animal names and sounds — built for a
19-month-old. One animal per slide: tap the animal to replay its sound and name,
tap the screen edges or swipe to move on. Parents get a hold-to-open settings
gate; everything else is toddler-proof.

## Features

- **Slideshow** of 17 animals (farm first, then wild), shuffled each visit
- **Tap the animal** → plays the sound, then the spoken name (order and voice configurable)
- **Favorites** — tap the star; optional "favorites only" mode (stored per device)
- **Auto-advance mode** with speed setting, for wind-down time
- **Parent gate** — hold the gear for 2 seconds to open settings; settings let you
  pick the TTS voice, speaking speed, sound order, word visibility, and fullscreen
- **Works offline** — the service worker precaches every photo and sound (~3.5 MB);
  after the first visit it loads instantly with no network
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

## Using a recorded voice instead of TTS

Recorded names beat synthetic speech for little ears. To add them later:

1. Record ~1s clips of each name ("Cow!") as `public/animals/voices/<id>.mp3`
2. Set `recording` on the animal in `src/data/animals.ts`
3. Play it in `src/lib/audio.ts` from `playIntro` when `animal.recording` exists —
   all playback already goes through the `AudioEngine`, so it's a small change.

## Deployment

The app is built to live under `shiv19.com/animal-sounds` (the Vite `base` and the
service-worker scope are already set to `/animal-sounds/`).

```bash
npm run build      # outputs dist/
# copy the contents of dist/ to your blog's /animal-sounds/ directory
```

- All asset URLs are relative to `/animal-sounds/`, so no other config is needed.
- The service worker is scoped to `/animal-sounds/`, so it won't interfere with
  the rest of your site (even if the blog has its own service worker).
- First visit needs network; every visit after that is fully offline.

## Asset licenses

Photos and sounds were sourced from free-license platforms (Unsplash, Pexels,
Wikimedia Commons, Openverse, LibreShot). Attribution and license notes live in
`assets-src/PHOTO-CREDITS.md` and `assets-src/SOUND-CREDITS.md`. A few photo
licenses could not be fully verified from search-CDN URLs — swap in your own
photos by following "Adding an animal" if that matters to you.
