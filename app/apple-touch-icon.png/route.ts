import { readFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

export const dynamic = 'force-dynamic'

export async function GET() {
  const svgPath = path.join(process.cwd(), 'public', 'icons', 'icon.svg')
  const svg = await readFile(svgPath)
  const png = await sharp(svg)
    .resize(180, 180)
    .png({ quality: 100 })
    .toBuffer()

  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'no-store, max-age=0',
    },
  })
}
