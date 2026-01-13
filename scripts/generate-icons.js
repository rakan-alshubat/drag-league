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
    // iOS home screen sizes
    { name: 'apple-touch-icon-120.png', size: 120 },
    { name: 'apple-touch-icon-152.png', size: 152 },
    { name: 'apple-touch-icon-167.png', size: 167 },
    { name: 'apple-touch-icon-180.png', size: 180 },
    // PWA / Android
    { name: 'icon-192.png', size: 192 },
    { name: 'icon-512.png', size: 512 },
    // maskable recommended
    { name: 'icon-512-maskable.png', size: 512 }
];

async function renderFrom(source) {
        for (const s of sizes) {
        const out = path.join(outputDir, s.name);
        try {
            let pipeline = sharp(source.path).resize(s.size, s.size, { fit: 'cover' });
            // for the maskable icon, ensure we keep alpha channel if source supports it
            if (s.name.includes('maskable')) {
                pipeline = pipeline.png({ quality: 90 });
            } else {
                pipeline = pipeline.png({ quality: 90 });
            }
            await pipeline.toFile(out);
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
