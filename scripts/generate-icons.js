const fs = require('fs');
const path = require('path');
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.error('sharp is not installed. Run `npm install --save-dev sharp` and re-run this script.');
  process.exit(1);
}

const projectRoot = path.resolve(__dirname, '..');
const publicDir = path.join(projectRoot, 'public');
const inputSvg = path.join(publicDir, 'favicon.svg');
const inputIco = path.join(publicDir, 'favicon.ico');
const outputDir = path.join(publicDir, 'icons');

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

const sources = [];
if (fs.existsSync(inputSvg)) sources.push({ path: inputSvg, type: 'svg' });
if (fs.existsSync(inputIco)) sources.push({ path: inputIco, type: 'ico' });

if (sources.length === 0) {
  console.error('No source icon found. Place favicon.svg or favicon.ico in public/');
  process.exit(1);
}

const sizes = [
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 }
];

async function renderFrom(source) {
  for (const s of sizes) {
    const out = path.join(outputDir, s.name);
    try {
      await sharp(source.path)
        .resize(s.size, s.size, { fit: 'cover' })
        .png({ quality: 90 })
        .toFile(out);
      console.log('Wrote', out);
    } catch (err) {
      console.error('Failed to write', out, err.message || err);
    }
  }
}

(async () => {
  // prefer SVG if available
  const preferred = sources.find(s => s.type === 'svg') || sources[0];
  console.log('Generating icons from', preferred.path);
  await renderFrom(preferred);
  console.log('Icon generation complete.');
})();
