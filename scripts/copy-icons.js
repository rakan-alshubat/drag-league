const fs = require('fs')
const path = require('path')

const src = path.join(__dirname, '..', 'public', 'icons', 'apple-touch-icon.png')
const dest = path.join(__dirname, '..', 'public', 'apple-touch-icon.png')

fs.access(src, fs.constants.R_OK, (err) => {
  if (err) {
    console.error('Source icon not found:', src)
    process.exit(2)
  }

  fs.copyFile(src, dest, (copyErr) => {
    if (copyErr) {
      console.error('Failed to copy icon:', copyErr)
      process.exit(1)
    }
    console.log('Copied', src, 'to', dest)
  })
})
