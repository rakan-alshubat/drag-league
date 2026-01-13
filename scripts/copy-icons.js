const fs = require('fs')
const path = require('path')

const iconsDir = path.join(__dirname, '..', 'public', 'icons')
const destDir = path.join(__dirname, '..', 'public')

const filesToCopy = [
  'apple-touch-icon.png',
  'apple-touch-icon-120.png',
  'apple-touch-icon-152.png',
  'apple-touch-icon-167.png',
  'apple-touch-icon-180.png',
  'icon-192.png',
  'icon-512.png',
  'icon-512-maskable.png'
]

let failed = false

filesToCopy.forEach((file) => {
  const src = path.join(iconsDir, file)
  const dest = path.join(destDir, file)

  try {
    fs.copyFileSync(src, dest)
    console.log('Copied', src, '->', dest)
  } catch (err) {
    console.warn('Skipped (not found) or failed to copy:', src)
    failed = true
  }
})

if (failed) {
  process.exitCode = 1
} else {
  process.exitCode = 0
}

