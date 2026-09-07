import { createRequire } from 'node:module'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const packageRoot = process.env.RADAR_NODE_MODULES
if (!packageRoot) throw new Error('RADAR_NODE_MODULES is required')
const require = createRequire(import.meta.url)
const { chromium } = require(path.join(packageRoot, 'playwright'))

const target = process.env.RADAR_URL || 'http://127.0.0.1:5173/'
const reviewDir = path.resolve('.impeccable/review')
await mkdir(reviewDir, { recursive: true })

const browser = await chromium.launch({ headless: true })
for (const viewport of [
  { name: 'desktop', width: 1536, height: 1024 },
  { name: 'mobile', width: 390, height: 844 },
]) {
  const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height }, deviceScaleFactor: 1 })
  await page.goto(target, { waitUntil: 'networkidle' })
  await page.screenshot({ path: path.join(reviewDir, `${viewport.name}.png`), fullPage: true })
  console.log(`${viewport.name}: ${await page.title()} · ${await page.locator('.opportunity-row').count()} opportunities visible`)
  await page.close()
}
await browser.close()
