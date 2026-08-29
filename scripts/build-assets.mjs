#!/usr/bin/env node
/**
 * Processes raw assets into app-ready files:
 *   assets-src/photos/<id>.<jpg|png|jpeg>  ->  public/animals/photos/<id>.webp  (1000x1000, ~85 quality)
 *   assets-src/sounds/<id>.<mp3|wav|ogg|m4a|flac|...> -> public/animals/sounds/<id>.mp3 (mono, 8s max, faded)
 *
 * Idempotent: skips outputs that are newer than their source.
 */
import { execFileSync } from 'node:child_process'
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
 * Trim silence from both ends (keeping a small natural pad), cap at 8s and
 * fade the tail so nothing ends abruptly.
 */
function soundFilterArgs() {
  const trimEnd = (keep) =>
    `silenceremove=start_periods=1:start_threshold=-45dB:start_silence=${keep}`
  const lead = trimEnd(0.05)
  const tail = `areverse,${trimEnd(0.2)},areverse`
  return ['-af', `${lead},${tail},afade=t=out:st=7.3:d=0.7`, '-t', '8']
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
    execFileSync('ffmpeg', [
      '-y',
      '-i', src,
      ...soundFilterArgs(),
      '-ar', '44100',
      '-ac', '1',
      '-b:a', '96k',
      '-map_metadata', '-1',
      dst
    ], { stdio: 'pipe' })
    console.log(`sound: ${id}.mp3`)
    sounds++
  }
}

console.log(`done: ${photos} photo(s), ${sounds} sound(s) processed`)
