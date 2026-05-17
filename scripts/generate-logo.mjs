/**
 * generate-logo.mjs — Icône Owoda, Variante C (Pièce de monnaie + aiguilles)
 *
 * Design :
 *   • Fond carré arrondi #00A86B (r=230 pour 1024px)
 *   • Cercle extérieur doré — stroke 35px, opacity 0.9
 *   • Cercle intérieur doré — stroke 15px, opacity 0.5
 *   • Remplissage doré — opacity 0.2 (lueur pièce)
 *   • Aiguille minute blanche — stroke 80px, 12h
 *   • Aiguille heure dorée  — stroke 60px, 2h (~60° depuis 12h)
 *   • Point central blanc   — radius 50px
 *   Flat design strict — aucun effet, aucune ombre
 *
 * Sorties :
 *   assets/icon.png           1024×1024   fond vert (Play Store)
 *   assets/adaptive-icon.png  1024×1024   fond transparent (Android adaptive)
 *   assets/favicon.png          32×32     favicon site web
 */

import sharp from 'sharp';
import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir  = dirname(fileURLToPath(import.meta.url));
const ASSETS = resolve(__dir, '../assets');

const GREEN = '#00A86B';
const GOLD  = '#D4AF37';
const WHITE = '#FFFFFF';

// ─── Géométrie — tout en pourcentage de S pour rester scalable ───────────────
function geom(S) {
  const cx = S / 2;
  const cy = S / 2;

  // Cercles de la pièce
  const R_outer = S * 0.371;   // rayon cercle extérieur
  const R_inner = S * 0.293;   // rayon cercle intérieur
  const R_fill  = S * 0.361;   // rayon du remplissage (légèrement < R_outer)

  // Épaisseurs de stroke
  const sw_outer = S * 0.034;  // ~35px @ 1024
  const sw_inner = S * 0.015;  // ~15px @ 1024

  // Aiguilles — partent du centre, légère extension en sens opposé (–8%)
  const min_len  = S * 0.318;  // longueur aiguille minute
  const min_tail = S * 0.050;  // queue aiguille minute (sens opposé)
  const min_sw   = S * 0.078;  // stroke ~80px @ 1024

  const hr_len   = S * 0.228;  // longueur aiguille heure
  const hr_tail  = S * 0.040;  // queue aiguille heure
  const hr_sw    = S * 0.059;  // stroke ~60px @ 1024

  // Point central
  const dot_r    = S * 0.049;  // ~50px @ 1024

  // Aiguille minute → 12h (angle −90° depuis est = angle 270° = droit vers le haut)
  const mAngle = -Math.PI / 2;
  const mTipX  = cx + Math.cos(mAngle) * min_len;
  const mTipY  = cy + Math.sin(mAngle) * min_len;
  const mTailX = cx - Math.cos(mAngle) * min_tail;
  const mTailY = cy - Math.sin(mAngle) * min_tail;

  // Aiguille heure → 2h (60° dans le sens horaire depuis 12h)
  // En SVG : angle = −90° + 60° = −30° depuis l'axe est
  const hAngle = -Math.PI / 2 + (Math.PI / 3);   // −90° + 60° = −30°
  const hTipX  = cx + Math.cos(hAngle) * hr_len;
  const hTipY  = cy + Math.sin(hAngle) * hr_len;
  const hTailX = cx - Math.cos(hAngle) * hr_tail;
  const hTailY = cy - Math.sin(hAngle) * hr_tail;

  return {
    cx, cy,
    R_outer, R_inner, R_fill,
    sw_outer, sw_inner,
    mTipX, mTipY, mTailX, mTailY, min_sw,
    hTipX, hTipY, hTailX, hTailY, hr_sw,
    dot_r,
  };
}

function f(n) { return n.toFixed(3); }

// ─── Couches communes (cercles + aiguilles) ───────────────────────────────────
function layers(g) {
  return `
  <!-- Remplissage intérieur doré — lueur pièce -->
  <circle cx="${f(g.cx)}" cy="${f(g.cy)}" r="${f(g.R_fill)}"
          fill="${GOLD}" opacity="0.2"/>

  <!-- Cercle extérieur (contour pièce) -->
  <circle cx="${f(g.cx)}" cy="${f(g.cy)}" r="${f(g.R_outer)}"
          fill="none" stroke="${GOLD}" stroke-width="${f(g.sw_outer)}" opacity="0.9"/>

  <!-- Cercle intérieur (détail pièce) -->
  <circle cx="${f(g.cx)}" cy="${f(g.cy)}" r="${f(g.R_inner)}"
          fill="none" stroke="${GOLD}" stroke-width="${f(g.sw_inner)}" opacity="0.5"/>

  <!-- Aiguille minute — blanche, 12h -->
  <line x1="${f(g.mTailX)}" y1="${f(g.mTailY)}"
        x2="${f(g.mTipX)}"  y2="${f(g.mTipY)}"
        stroke="${WHITE}" stroke-width="${f(g.min_sw)}" stroke-linecap="round"/>

  <!-- Aiguille heure — dorée, 2h -->
  <line x1="${f(g.hTailX)}" y1="${f(g.hTailY)}"
        x2="${f(g.hTipX)}"  y2="${f(g.hTipY)}"
        stroke="${GOLD}" stroke-width="${f(g.hr_sw)}" stroke-linecap="round"/>

  <!-- Point central blanc -->
  <circle cx="${f(g.cx)}" cy="${f(g.cy)}" r="${f(g.dot_r)}"
          fill="${WHITE}"/>`;
}

// ─── 1. icon.png — fond vert + coins arrondis ─────────────────────────────────
function buildIconSVG(S) {
  const r = Math.round(S * 0.2246); // 230px @ 1024
  const g = geom(S);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">

  <!-- Fond vert émeraude -->
  <rect width="${S}" height="${S}" fill="${GREEN}" rx="${r}" ry="${r}"/>
${layers(g)}

</svg>`;
}

// ─── 2. adaptive-icon.png — fond transparent ─────────────────────────────────
function buildAdaptiveSVG(S) {
  // Android adaptive safe zone = 66% → on réduit l'icône à 66% de S
  // pour qu'elle reste entièrement visible quelle que soit la forme du masque
  const scale = 0.66;
  const g = geom(S * scale);

  // Re-centrer dans le canvas 1024×1024
  const offset = (S - S * scale) / 2;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">

  <!-- Fond transparent — Android fournit #00A86B via backgroundColor -->
  <g transform="translate(${f(offset)}, ${f(offset)})">
${layers(g)}
  </g>

</svg>`;
}

// ─── 3. favicon.png — 32×32, proportions simplifiées ─────────────────────────
function buildFaviconSVG(S) {
  const r = Math.round(S * 0.22);
  const g = geom(S);
  // À 32px on supprime le cercle intérieur et la queue des aiguilles
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">

  <rect width="${S}" height="${S}" fill="${GREEN}" rx="${r}" ry="${r}"/>

  <!-- Remplissage doré -->
  <circle cx="${f(g.cx)}" cy="${f(g.cy)}" r="${f(g.R_fill)}" fill="${GOLD}" opacity="0.2"/>

  <!-- Cercle extérieur -->
  <circle cx="${f(g.cx)}" cy="${f(g.cy)}" r="${f(g.R_outer)}"
          fill="none" stroke="${GOLD}" stroke-width="${f(g.sw_outer)}" opacity="0.9"/>

  <!-- Aiguille minute -->
  <line x1="${f(g.cx)}" y1="${f(g.cy)}"
        x2="${f(g.mTipX)}" y2="${f(g.mTipY)}"
        stroke="${WHITE}" stroke-width="${f(g.min_sw)}" stroke-linecap="round"/>

  <!-- Aiguille heure -->
  <line x1="${f(g.cx)}" y1="${f(g.cy)}"
        x2="${f(g.hTipX)}" y2="${f(g.hTipY)}"
        stroke="${GOLD}" stroke-width="${f(g.hr_sw)}" stroke-linecap="round"/>

  <!-- Centre -->
  <circle cx="${f(g.cx)}" cy="${f(g.cy)}" r="${f(g.dot_r)}" fill="${WHITE}"/>

</svg>`;
}

// ─── Runner ───────────────────────────────────────────────────────────────────
async function run() {
  console.log('Génération — Variante C (Pièce + aiguilles)\n');

  // icon.png
  process.stdout.write('1/3  icon.png        (1024×1024)... ');
  const svgIcon = buildIconSVG(1024);
  writeFileSync(resolve(ASSETS, 'icon.svg'), svgIcon, 'utf8');
  await sharp(Buffer.from(svgIcon))
    .resize(1024, 1024)
    .png({ compressionLevel: 9 })
    .toFile(resolve(ASSETS, 'icon.png'));
  console.log('✓');

  // adaptive-icon.png
  process.stdout.write('2/3  adaptive-icon.png (1024×1024, transparent)... ');
  const svgAdaptive = buildAdaptiveSVG(1024);
  await sharp(Buffer.from(svgAdaptive))
    .resize(1024, 1024)
    .png({ compressionLevel: 9 })
    .toFile(resolve(ASSETS, 'adaptive-icon.png'));
  console.log('✓');

  // favicon.png
  process.stdout.write('3/3  favicon.png     (32×32)... ');
  const svgFavicon = buildFaviconSVG(32);
  await sharp(Buffer.from(svgFavicon))
    .resize(32, 32)
    .png({ compressionLevel: 9 })
    .toFile(resolve(ASSETS, 'favicon.png'));
  console.log('✓');

  console.log(`
✅  Icônes générées dans assets/

  icon.png           1024×1024   fond #00A86B, r=230 (Play Store)
  adaptive-icon.png  1024×1024   transparent, safe zone 66% (Android)
  favicon.png           32×32    simplifié (site web)
  icon.svg                        source SVG

app.json — chemins déjà corrects :
  "icon":        "./assets/icon.png"
  "foregroundImage": "./assets/adaptive-icon.png"
  "backgroundColor": "#00A86B"
  "favicon":     "./assets/favicon.png"
`);
}

run().catch(err => { console.error('Erreur :', err.message); process.exit(1); });
