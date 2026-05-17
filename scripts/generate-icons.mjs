/**
 * Owoda icon generator
 * Produces: icon.png (1024), adaptive-icon.png (1024, transparent bg),
 *           favicon.png (64), splash.png (2048×2048)
 *
 * Design:
 *   • icon / splash   → emerald #00A86B background, white+gold artwork
 *   • adaptive-icon   → transparent background (Android provides the green via backgroundColor)
 */

import sharp from 'sharp';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ASSETS = resolve(__dirname, '..', 'assets');
mkdirSync(ASSETS, { recursive: true });

/* ─── Colour palette ────────────────────────────────────────────────────────── */
const C = {
  emerald : '#00A86B',
  white   : '#FFFFFF',
  gold    : '#D4AF37',
  goldDim : '#B8921E',
};

/* ─── SVG helpers ────────────────────────────────────────────────────────────── */

/**
 * Build the artwork SVG at a given size.
 * @param {number}  size        Canvas size in logical pixels
 * @param {boolean} transparent If true, omit the background rect (adaptive icon)
 */
function buildSVG(size, transparent = false) {
  const cx = size / 2;
  const cy = size / 2;

  // Clock outer ring radius — 36 % of half-size
  const R  = size * 0.36;   // clock face radius
  const rI = R * 0.88;      // inner track radius

  // Clock tick marks (12 positions, bigger at 12/3/6/9)
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const angle  = (i / 12) * Math.PI * 2 - Math.PI / 2;
    const major  = i % 3 === 0;
    const len    = major ? R * 0.14 : R * 0.08;
    const width  = major ? size * 0.025 : size * 0.015;
    const r0     = R * 0.82;
    const r1     = r0 - len;
    const x0 = cx + Math.cos(angle) * r0;
    const y0 = cy + Math.sin(angle) * r0;
    const x1 = cx + Math.cos(angle) * r1;
    const y1 = cy + Math.sin(angle) * r1;
    return `<line x1="${x0.toFixed(2)}" y1="${y0.toFixed(2)}"
                  x2="${x1.toFixed(2)}" y2="${y1.toFixed(2)}"
                  stroke="${C.white}" stroke-width="${width.toFixed(2)}"
                  stroke-linecap="round" opacity="0.90"/>`;
  }).join('\n');

  // Hour hand  — points to ~10 o'clock (stylised, balanced framing)
  const hourAngle   = (10 / 12) * Math.PI * 2 - Math.PI / 2;
  const hourLen     = R * 0.38;
  const hx = cx + Math.cos(hourAngle) * hourLen;
  const hy = cy + Math.sin(hourAngle) * hourLen;

  // Minute hand — points to ~2 o'clock
  const minAngle    = (2 / 12) * Math.PI * 2 - Math.PI / 2;
  const minLen      = R * 0.55;
  const mx = cx + Math.cos(minAngle) * minLen;
  const my = cy + Math.sin(minAngle) * minLen;

  const handWidth   = size * 0.038;
  const handCap     = 'round';

  // ── ₣ glyph — enlarged and centred below the pivot ──────────────────────
  // The glyph sits in the lower-centre of the clock face so it stays
  // readable even at small sizes and doesn't collide with the hands.
  const symSize = R * 0.90;           // overall glyph bounding height
  const stemW   = symSize * 0.155;    // vertical stroke thickness
  const barW    = symSize * 0.56;     // long bar width
  const barH    = stemW * 0.80;       // bar height

  // Anchor the glyph so its visual centre sits slightly below clock centre
  const glyphCX = cx;                 // horizontally centred on clock
  const glyphTY = cy - symSize * 0.46; // top of stem
  const glyphBY = cy + symSize * 0.46; // bottom of stem
  const bar1CY  = cy - symSize * 0.10; // upper bar centre-Y
  const bar2CY  = cy + symSize * 0.16; // lower bar centre-Y

  const glyph = `
    <!-- Drop shadow for depth -->
    <rect x="${(glyphCX - stemW / 2 + size * 0.004).toFixed(2)}"
          y="${(glyphTY + size * 0.004).toFixed(2)}"
          width="${stemW.toFixed(2)}"
          height="${(glyphBY - glyphTY).toFixed(2)}"
          rx="${(stemW / 2).toFixed(2)}"
          fill="#000" opacity="0.20"/>
    <!-- Vertical stem -->
    <rect x="${(glyphCX - stemW / 2).toFixed(2)}"
          y="${glyphTY.toFixed(2)}"
          width="${stemW.toFixed(2)}"
          height="${(glyphBY - glyphTY).toFixed(2)}"
          rx="${(stemW / 2).toFixed(2)}"
          fill="${C.gold}"/>
    <!-- Upper bar (longer) -->
    <rect x="${(glyphCX - stemW / 2).toFixed(2)}"
          y="${(bar1CY - barH / 2).toFixed(2)}"
          width="${barW.toFixed(2)}"
          height="${barH.toFixed(2)}"
          rx="${(barH / 2).toFixed(2)}"
          fill="${C.gold}"/>
    <!-- Lower bar (shorter — classic ₣ proportion) -->
    <rect x="${(glyphCX - stemW / 2).toFixed(2)}"
          y="${(bar2CY - barH / 2).toFixed(2)}"
          width="${(barW * 0.70).toFixed(2)}"
          height="${barH.toFixed(2)}"
          rx="${(barH / 2).toFixed(2)}"
          fill="${C.gold}"/>
  `;

  const bg = transparent ? '' : `
    <!-- Background -->
    <rect width="${size}" height="${size}" rx="${(size * 0.22).toFixed(2)}" fill="${C.emerald}"/>
  `;

  return `<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 ${size} ${size}"
     width="${size}" height="${size}">

  <defs>
    <!-- Subtle inner shadow on clock ring -->
    <filter id="ish" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="${(size * 0.012).toFixed(1)}"
                    flood-color="#000" flood-opacity="0.18"/>
    </filter>
    <!-- Glow on gold glyph -->
    <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="0" stdDeviation="${(size * 0.015).toFixed(1)}"
                    flood-color="${C.gold}" flood-opacity="0.55"/>
    </filter>
  </defs>

  ${bg}

  <!-- Clock face ring -->
  <circle cx="${cx}" cy="${cy}" r="${R.toFixed(2)}"
          fill="none"
          stroke="${C.white}" stroke-width="${(size * 0.030).toFixed(2)}"
          opacity="0.95"
          filter="url(#ish)"/>

  <!-- Inner subtle fill for clock face -->
  <circle cx="${cx}" cy="${cy}" r="${(R * 0.82).toFixed(2)}"
          fill="${C.white}" fill-opacity="0.07"/>

  <!-- Tick marks -->
  ${ticks}

  <!-- Currency glyph (behind hands) -->
  <g filter="url(#glow)">${glyph}</g>

  <!-- Hour hand -->
  <line x1="${cx.toFixed(2)}" y1="${cy.toFixed(2)}"
        x2="${hx.toFixed(2)}" y2="${hy.toFixed(2)}"
        stroke="${C.white}" stroke-width="${handWidth.toFixed(2)}"
        stroke-linecap="${handCap}" opacity="0.97"/>

  <!-- Minute hand -->
  <line x1="${cx.toFixed(2)}" y1="${cy.toFixed(2)}"
        x2="${mx.toFixed(2)}" y2="${my.toFixed(2)}"
        stroke="${C.white}" stroke-width="${(handWidth * 0.70).toFixed(2)}"
        stroke-linecap="${handCap}" opacity="0.97"/>

  <!-- Centre dot -->
  <circle cx="${cx}" cy="${cy}" r="${(size * 0.028).toFixed(2)}"
          fill="${C.gold}" stroke="${C.white}" stroke-width="${(size * 0.012).toFixed(2)}"/>
</svg>`;
}

/* ─── Splash SVG (2048 × 2048, full green bg + centred artwork) ─────────────── */
function buildSplashSVG(w, h) {
  const size   = Math.min(w, h) * 0.55; // artwork occupies 55 % of the shorter side
  const cx     = w / 2;
  const cy     = h / 2;
  // Reuse icon artwork but shift to centre of splash canvas
  const inner  = buildSVG(size, true)
    // Strip the outer <svg> wrapper — we'll embed as <g>
    .replace(/^<svg[^>]*>/, '')
    .replace(/<\/svg>$/, '');

  return `<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <rect width="${w}" height="${h}" fill="${C.emerald}"/>
  <g transform="translate(${cx - size / 2}, ${cy - size / 2})">${inner}</g>
</svg>`;
}

/* ─── PNG conversion via sharp ───────────────────────────────────────────────── */
async function svgToPng(svgString, outputPath, size) {
  const buf = Buffer.from(svgString);
  await sharp(buf)
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toFile(outputPath);
  console.log(`✓  ${outputPath.replace(process.cwd(), '.')}  (${size}×${size})`);
}

async function svgToPngRect(svgString, outputPath, w, h) {
  const buf = Buffer.from(svgString);
  await sharp(buf)
    .resize(w, h)
    .png({ compressionLevel: 9 })
    .toFile(outputPath);
  console.log(`✓  ${outputPath.replace(process.cwd(), '.')}  (${w}×${h})`);
}

/* ─── Main ───────────────────────────────────────────────────────────────────── */
(async () => {
  console.log('\n🎨  Generating Owoda app icons…\n');

  // 1. icon.png — 1024×1024, solid green bg (iOS + general)
  await svgToPng(
    buildSVG(1024, false),
    resolve(ASSETS, 'icon.png'),
    1024,
  );

  // 2. adaptive-icon.png — 1024×1024, TRANSPARENT bg
  //    Android renders the green via adaptiveIcon.backgroundColor in app.json
  await svgToPng(
    buildSVG(1024, true),
    resolve(ASSETS, 'adaptive-icon.png'),
    1024,
  );

  // 3. favicon.png — 64×64 (Expo web)
  await svgToPng(
    buildSVG(64, false),
    resolve(ASSETS, 'favicon.png'),
    64,
  );

  // 4. splash.png — 2048×2048 (Expo splash)
  await svgToPngRect(
    buildSplashSVG(2048, 2048),
    resolve(ASSETS, 'splash.png'),
    2048,
    2048,
  );

  console.log('\n✅  All icons generated successfully.\n');
})();
