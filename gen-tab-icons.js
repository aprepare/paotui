/**
 * 自动生成 TabBar 图标（压缩 + 灰色版）
 * 写入临时文件再重命名，避免 Vite 文件锁冲突
 */
const Jimp = require('jimp')
const path = require('path')
const fs = require('fs')

const TAB_DIR = path.join(__dirname, 'src/static/tab')
const MAX_BYTES = 40 * 1024
const icons = ['run', 'market', 'forum', 'team', 'mine']

function safeWrite(filePath, buffer) {
  const tmp = filePath + '.tmp'
  // Write to temp file first
  fs.writeFileSync(tmp, buffer)
  // Retry rename with backoff
  for (let i = 0; i < 5; i++) {
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
      fs.renameSync(tmp, filePath)
      return
    } catch (e) {
      if (i === 4) throw e
      // Wait a bit for file lock to release
      const wait = 200 * (i + 1)
      const start = Date.now()
      while (Date.now() - start < wait) {} // busy wait
    }
  }
}

async function writeImage(img, filePath) {
  const buf = await img.getBufferAsync(Jimp.MIME_PNG)
  safeWrite(filePath, buf)
  return fs.statSync(filePath).size
}

async function processIcon(name) {
  const activePath = path.join(TAB_DIR, `${name}-active.png`)
  const grayPath = path.join(TAB_DIR, `${name}.png`)

  if (!fs.existsSync(activePath)) {
    console.log(`skip ${name}: no active png`)
    return
  }

  let img = await Jimp.read(activePath)
  const origW = img.bitmap.width
  const origH = img.bitmap.height
  let fileSize = fs.statSync(activePath).size

  console.log(`\n${name}-active.png (${origW}x${origH}, ${(fileSize/1024).toFixed(1)}KB)`)

  // Shrink active if over 40KB
  if (fileSize > MAX_BYTES) {
    let scale = 0.9
    while (fileSize > MAX_BYTES && scale > 0.3) {
      const nw = Math.round(origW * scale)
      const nh = Math.round(origH * scale)
      img = await Jimp.read(activePath)
      img.resize(nw, nh, Jimp.RESIZE_LANCZOS)
      fileSize = await writeImage(img, activePath)
      if (fileSize <= MAX_BYTES) {
        console.log(`  active -> ${nw}x${nh} (${(fileSize/1024).toFixed(1)}KB)`)
        break
      }
      scale -= 0.05
    }
  } else {
    console.log(`  active OK`)
  }

  // Generate gray version
  let grayImg = await Jimp.read(activePath)
  grayImg.color([
    { apply: 'desaturate', params: [55] },
    { apply: 'brighten', params: [10] }
  ])
  grayImg.opacity(0.7)

  let graySize = await writeImage(grayImg, grayPath)

  // Shrink gray if over 40KB
  if (graySize > MAX_BYTES) {
    const gw = grayImg.bitmap.width
    const gh = grayImg.bitmap.height
    let gs = 0.9
    while (graySize > MAX_BYTES && gs > 0.3) {
      const nw = Math.round(gw * gs)
      const nh = Math.round(gh * gs)
      grayImg = await Jimp.read(grayPath)
      grayImg.resize(nw, nh, Jimp.RESIZE_LANCZOS)
      graySize = await writeImage(grayImg, grayPath)
      if (graySize <= MAX_BYTES) {
        console.log(`  gray -> ${nw}x${nh} (${(graySize/1024).toFixed(1)}KB)`)
        // Sync active to same size
        let activeImg = await Jimp.read(activePath)
        activeImg.resize(nw, nh, Jimp.RESIZE_LANCZOS)
        const as = await writeImage(activeImg, activePath)
        console.log(`  active synced -> ${nw}x${nh} (${(as/1024).toFixed(1)}KB)`)
        break
      }
      gs -= 0.05
    }
  } else {
    console.log(`  gray OK (${(graySize/1024).toFixed(1)}KB)`)
  }
}

async function main() {
  console.log('=== TabBar Icons ===\n')
  for (const name of icons) {
    await processIcon(name)
  }
  console.log('\nDone!')
}

main().catch(e => { console.error(e); process.exit(1) })
