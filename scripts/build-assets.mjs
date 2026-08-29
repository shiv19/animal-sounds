#!/usr/bin/env node
/**
 * Processes raw assets into app-ready files:
 *   assets-src/photos/<id>.<jpg|png|jpeg>  ->  public/animals/photos/<id>.webp  (1000x1000, ~85 quality)
 *   assets-src/sounds/<id>.<mp3|wav|ogg|m4a|flac|...> -> public/animals/sounds/<id>.mp3 (mono, 8s max, faded)
 *
 * Idempotent: skips outputs that are newer than their source.
 */
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const srcPhotos = join(root, 'assets-src', 'photos')
const srcSounds = join(root, 'assets-src', 'sounds')
const outPhotos = join(root, 'public', 'animals', 'photos')
const outSounds = join(root, 'public', 'animals', 'sounds')

mkdirSync(outPhotos, { recursive: true })
mkdirSync(outSounds, { recursive: true })

const newer = (src, dst) => !existsSync(dst) || statSync(src).mtimeMs > statSync(dst).mtimeMs

/**
 * Long field recordings often start with silence. Find where the sound
 * actually begins so the 8s excerpt captures the good part.
 */
function detectSoundStart(src) {
  const res = spawnSync(
    'ffmpeg',
    ['-i', src, '-af', 'silencedetect=noise=-45dB:d=0.25', '-f', 'null', '-'],
    { encoding: 'utf8' }
  )
  const events = [...res.stderr.matchAll(/silence_(start|end): ([\d.]+)/g)]
  if (events.length > 0 && events[0][1] === 'start' && parseFloat(events[0][2]) < 0.5) {
    const end = events.find((e) => e[1] === 'end')
    if (end) return Math.max(0, parseFloat(end[2]) - 0.05)
  }
  return 0
}

let photos = 0
if (existsSync(srcPhotos)) {
  for (const file of readdirSync(srcPhotos)) {
    if (!/\.(jpe?g|png|webp)$/i.test(file)) continue
    const id = file.replace(/\.(jpe?g|png|webp)$/i, '')
    const src = join(srcPhotos, file)
    const dst = join(outPhotos, `${id}.webp`)
    if (!newer(src, dst)) continue
    execFileSync('magick', [
      src,
      '-auto-orient',
      '-resize', '1000x1000^',
      '-gravity', 'center',
      '-extent', '1000x1000',
      '-strip',
      '-quality', '84',
      dst
    ])
    console.log(`photo: ${id}.webp`)
    photos++
  }
}

let sounds = 0
if (existsSync(srcSounds)) {
  for (const file of readdirSync(srcSounds)) {
    if (!/\.(mp3|wav|ogg|oga|opus|m4a|aac|flac)$/i.test(file)) continue
    const id = file.replace(/\.(mp3|wav|ogg|oga|opus|m4a|aac|flac)$/i, '')
    const src = join(srcSounds, file)
    const dst = join(outSounds, `${id}.mp3`)
    if (!newer(src, dst)) continue
    const offset = detectSoundStart(src)
    const seek = offset > 0.1 ? ['-ss', offset.toFixed(2)] : []
    execFileSync('ffmpeg', [
      '-y',
      ...seek,
      '-i', src,
      '-t', '8',
      '-af', 'afade=t=out:st=7.3:d=0.7',
      '-ar', '44100',
      '-ac', '1',
      '-b:a', '96k',
      '-map_metadata', '-1',
      dst
    ], { stdio: 'pipe' })
    console.log(`sound: ${id}.mp3${offset > 0.1 ? ` (from ${offset.toFixed(1)}s)` : ''}`)
    sounds++
  }
}

console.log(`done: ${photos} photo(s), ${sounds} sound(s) processed`)
