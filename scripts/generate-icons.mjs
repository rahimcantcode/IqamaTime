/**
 * Generate PNG icons from public/icons/icon.svg
 * Run: node scripts/generate-icons.mjs
 * Requires: npm install -D sharp (add to devDependencies)
 */
import { createRequire } from 'module'
import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir   = join(__dirname, '..')

const require = createRequire(import.meta.url)
let sharp
try {
  sharp = require('sharp')
} catch {
  console.error('sharp not found. Run: npm install -D sharp')
  process.exit(1)
}

const svgPath  = join(rootDir, 'public', 'icons', 'icon.svg')
const svgBuffer = readFileSync(svgPath)

const SIZES = [72, 96, 128, 144, 152, 180, 192, 384, 512]

async function generate() {
  for (const size of SIZES) {
    const outPath = join(rootDir, 'public', 'icons', `icon-${size}.png`)
    await sharp(svgBuffer)
      .resize(size, size)
      .png({ quality: 95 })
      .toFile(outPath)
    console.log(`✓ icon-${size}.png`)
  }

  // Apple touch icon (180)
  const applePath = join(rootDir, 'public', 'icons', 'apple-icon-180.png')
  await sharp(svgBuffer).resize(180, 180).png({ quality: 95 }).toFile(applePath)
  console.log('✓ apple-icon-180.png')

  // Splash screens (dark background + centered icon)
  const splashConfigs = [
    { width: 390, height: 844, name: 'splash-390x844.png' },
    { width: 430, height: 932, name: 'splash-430x932.png' },
    { width: 375, height: 812, name: 'splash-375x812.png' },
    { width: 414, height: 896, name: 'splash-414x896.png' },
  ]

  for (const { width, height, name } of splashConfigs) {
    const iconSize = Math.floor(Math.min(width, height) * 0.30)
    const iconBuf  = await sharp(svgBuffer).resize(iconSize, iconSize).png().toBuffer()

    await sharp({
      create: {
        width,
        height,
        channels: 4,
        background: { r: 8, g: 8, b: 16, alpha: 1 },
      },
    })
      .composite([{
        input: iconBuf,
        left: Math.floor((width  - iconSize) / 2),
        top:  Math.floor((height - iconSize) / 2),
      }])
      .png()
      .toFile(join(rootDir, 'public', 'icons', name))
    console.log(`✓ ${name}`)
  }

  // Favicon
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(join(rootDir, 'public', 'favicon.ico'))
  console.log('✓ favicon.ico')

  console.log('\nAll icons generated!')
}

generate().catch(console.error)
