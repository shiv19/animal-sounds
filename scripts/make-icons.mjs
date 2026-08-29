import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { Resvg } from '@resvg/resvg-js'

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="118" fill="#FBF3E4"/>
  <g fill="#A9805B">
    <ellipse cx="256" cy="330" rx="86" ry="70"/>
    <ellipse cx="150" cy="233" rx="38" ry="49" transform="rotate(-18 150 233)"/>
    <ellipse cx="215" cy="180" rx="38" ry="51" transform="rotate(-6 215 180)"/>
    <ellipse cx="297" cy="180" rx="38" ry="51" transform="rotate(6 297 180)"/>
    <ellipse cx="362" cy="233" rx="38" ry="49" transform="rotate(18 362 233)"/>
  </g>
</svg>`

const maskable = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#FBF3E4"/>
  <g fill="#A9805B" transform="translate(256 256) scale(0.72) translate(-256 -256)">
    <ellipse cx="256" cy="330" rx="86" ry="70"/>
    <ellipse cx="150" cy="233" rx="38" ry="49" transform="rotate(-18 150 233)"/>
    <ellipse cx="215" cy="180" rx="38" ry="51" transform="rotate(-6 215 180)"/>
    <ellipse cx="297" cy="180" rx="38" ry="51" transform="rotate(6 297 180)"/>
    <ellipse cx="362" cy="233" rx="38" ry="49" transform="rotate(18 362 233)"/>
  </g>
</svg>`

const outDir = join(process.cwd(), 'public', 'icons')
mkdirSync(outDir, { recursive: true })

const targets = [
  { name: 'icon-192.png', size: 192, art: svg },
  { name: 'icon-512.png', size: 512, art: svg },
  { name: 'icon-maskable-512.png', size: 512, art: maskable }
]

for (const t of targets) {
  const png = new Resvg(t.art, { fitTo: { mode: 'width', value: t.size } }).render().asPng()
  writeFileSync(join(outDir, t.name), png)
  console.log(`wrote public/icons/${t.name}`)
}
