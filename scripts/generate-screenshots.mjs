/**
 * Owoda Play Store screenshot generator
 * Produces 4 PNG images (1080×1920) in store-assets/
 *
 * Run:  node scripts/generate-screenshots.mjs
 */

import sharp from 'sharp';
import { mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, '..', 'store-assets');
mkdirSync(OUT_DIR, { recursive: true });

/* ─── Canvas & geometry ───────────────────────────────────────────────────── */
const W = 1080;
const H = 1920;

// Phone body
const PX = 130;
const PY = 268;
const PW = 820;
const PH = 1384;
const PR = 88;     // corner radius

// Screen inside phone
const SX = PX + 22;
const SY = PY + 54;
const SW = PW - 44;
const SH = PH - 88;

/* ─── Colour palette ──────────────────────────────────────────────────────── */
const C = {
  emerald:     '#00A86B',
  darkGreen:   '#005C3A',
  white:       '#FFFFFF',
  gold:        '#D4AF37',
  phone:       '#111111',
  phoneBorder: '#2C2C2C',
  screen:      '#F5FAF8',
  card:        '#FFFFFF',
  primary:     '#00A86B',
  primaryTint: '#E8F8F2',
  textDark:    '#1A2E25',
  textMid:     '#4B7A62',
  textMuted:   '#8BA89A',
  divider:     '#E2EDE8',
};

const F = 'Arial, Helvetica, sans-serif';

/* ─── Shared SVG fragments ────────────────────────────────────────────────── */
function defs() {
  return `
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${C.emerald}"/>
      <stop offset="100%" stop-color="${C.darkGreen}"/>
    </linearGradient>
    <filter id="phoneShadow" x="-12%" y="-4%" width="124%" height="112%">
      <feDropShadow dx="0" dy="24" stdDeviation="44" flood-color="#000" flood-opacity="0.55"/>
    </filter>
    <filter id="cardShadow" x="-6%" y="-6%" width="112%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#000" flood-opacity="0.06"/>
    </filter>
    <clipPath id="screenClip">
      <rect x="${SX}" y="${SY}" width="${SW}" height="${SH}" rx="44" ry="44"/>
    </clipPath>
  </defs>`;
}

function background() {
  return `
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <circle cx="940" cy="220" r="280" fill="rgba(255,255,255,0.04)"/>
  <circle cx="90"  cy="1720" r="320" fill="rgba(255,255,255,0.03)"/>`;
}

function phoneBody() {
  // Body + subtle highlight ring
  return `
  <rect x="${PX}" y="${PY}" width="${PW}" height="${PH}" rx="${PR}"
    fill="${C.phone}" filter="url(#phoneShadow)"/>
  <rect x="${PX}" y="${PY}" width="${PW}" height="${PH}" rx="${PR}"
    fill="none" stroke="${C.phoneBorder}" stroke-width="2"/>
  <!-- Screen background -->
  <rect x="${SX}" y="${SY}" width="${SW}" height="${SH}" rx="44" fill="${C.screen}"/>
  <!-- Camera punch-hole -->
  <circle cx="${SX + SW / 2}" cy="${SY + 26}" r="11" fill="${C.phone}"/>
  <!-- Side buttons -->
  <rect x="${PX - 9}" y="${PY + 230}" width="9" height="84" rx="4.5" fill="${C.phoneBorder}"/>
  <rect x="${PX - 9}" y="${PY + 336}" width="9" height="84" rx="4.5" fill="${C.phoneBorder}"/>
  <rect x="${PX + PW}"  y="${PY + 290}" width="9" height="114" rx="4.5" fill="${C.phoneBorder}"/>
  <!-- Home indicator -->
  <rect x="${SX + SW / 2 - 66}" y="${SY + SH + 18}" width="132" height="6" rx="3"
    fill="rgba(255,255,255,0.18)"/>`;
}

function statusBar() {
  const y = SY + 50;
  const rx = SX + SW - 24;
  return `
  <!-- Status bar -->
  <text x="${SX + 28}" y="${y}" fill="${C.textMuted}" font-size="22"
    font-family="${F}" font-weight="600">9:41</text>
  <!-- Signal bars -->
  <rect x="${rx - 88}" y="${y - 16}" width="6" height="10" rx="2" fill="${C.textMuted}" opacity="0.45"/>
  <rect x="${rx - 79}" y="${y - 20}" width="6" height="14" rx="2" fill="${C.textMuted}" opacity="0.7"/>
  <rect x="${rx - 70}" y="${y - 24}" width="6" height="18" rx="2" fill="${C.textMuted}"/>
  <!-- Battery -->
  <rect x="${rx - 58}" y="${y - 22}" width="36" height="18" rx="4"
    fill="none" stroke="${C.textMuted}" stroke-width="1.5"/>
  <rect x="${rx - 22}" y="${y - 18}" width="4" height="10" rx="2" fill="${C.textMuted}" opacity="0.5"/>
  <rect x="${rx - 56}" y="${y - 20}" width="28" height="14" rx="3" fill="${C.textMuted}" opacity="0.55"/>`;
}

function tabBar(activeTab) {
  // activeTab: 0=converter, 1=history, 2=dashboard, 3=settings
  const ty = SY + SH - 92;
  const tabs = [
    { label: 'Convertir',  xs: 0.10 },
    { label: 'Historique', xs: 0.36 },
    { label: 'Tableau',    xs: 0.62 },
    { label: 'Réglages',   xs: 0.87 },
  ];
  const icons = ['C', 'H', 'T', 'S'];  // placeholder glyphs (avoid emoji)
  const iconSymbols = ['⊙', '≡', '▦', '⚙'];

  let out = `
  <rect x="${SX}" y="${ty}" width="${SW}" height="92" fill="${C.card}"/>
  <rect x="${SX}" y="${ty}" width="${SW}" height="1" fill="${C.divider}"/>`;

  tabs.forEach((tab, i) => {
    const tx = SX + SW * tab.xs;
    const active = i === activeTab;
    const tc = active ? C.primary : C.textMuted;
    out += `
    <text x="${tx}" y="${ty + 36}" font-size="22" text-anchor="middle"
      fill="${tc}">${iconSymbols[i]}</text>
    <text x="${tx}" y="${ty + 60}" fill="${tc}" font-size="16"
      font-family="${F}" font-weight="${active ? '700' : '500'}"
      text-anchor="middle">${tab.label}</text>`;
    if (active) {
      out += `<rect x="${tx - 18}" y="${ty + 2}" width="36" height="4" rx="2" fill="${C.primary}"/>`;
    }
  });
  return out;
}

function owodaLogo() {
  const lx = W / 2;
  const ly = PY + PH + 80;
  return `
  <circle cx="${lx - 56}" cy="${ly}" r="28" fill="rgba(255,255,255,0.12)"
    stroke="rgba(255,255,255,0.25)" stroke-width="1.5"/>
  <text x="${lx - 56}" y="${ly + 9}" font-size="24" text-anchor="middle"
    fill="${C.white}">⊙</text>
  <text x="${lx + 6}" y="${ly + 10}" fill="${C.white}" font-size="30"
    font-family="${F}" font-weight="800">Owoda</text>`;
}

function taglines(line1, line2, sub) {
  const midY = PY - 90;
  return `
  <text x="${W / 2}" y="${midY - 50}" fill="${C.white}" font-size="72"
    font-family="${F}" font-weight="900" text-anchor="middle">${line1}</text>
  <text x="${W / 2}" y="${midY + 24}" fill="${C.gold}" font-size="72"
    font-family="${F}" font-weight="900" text-anchor="middle">${line2}</text>
  <text x="${W / 2}" y="${midY + 64}" fill="rgba(255,255,255,0.72)" font-size="28"
    font-family="${F}" font-weight="400" text-anchor="middle">${sub}</text>`;
}

/* ─── Screen 1: Converter ─────────────────────────────────────────────────── */
function screen1() {
  const parts = [];

  parts.push(`<rect x="${SX}" y="${SY}" width="${SW}" height="${SH}" rx="44" fill="#F5FAF8"/>`);
  parts.push(statusBar());

  // App title
  parts.push(`
  <text x="${SX + SW / 2}" y="${SY + 108}" fill="${C.textDark}" font-size="34"
    font-family="${F}" font-weight="900" text-anchor="middle">Convertisseur</text>`);

  // Category chips
  const cats = ['Alimentaire', 'Transport', 'Logement'];
  let cx2 = SX + 24;
  const chY = SY + 132;
  cats.forEach((cat, i) => {
    const cw = cat.length * 13 + 36;
    const active = i === 0;
    parts.push(`
    <rect x="${cx2}" y="${chY}" width="${cw}" height="38" rx="19"
      fill="${active ? C.primaryTint : C.card}" stroke="${active ? C.primary : C.divider}"
      stroke-width="${active ? 2 : 1.5}"/>
    <text x="${cx2 + cw / 2}" y="${chY + 25}" fill="${active ? C.primary : C.textMid}"
      font-size="18" font-family="${F}" font-weight="${active ? '700' : '500'}"
      text-anchor="middle">${cat}</text>`);
    cx2 += cw + 10;
  });

  // Currency card
  const ccY = SY + 190;
  parts.push(`
  <rect x="${SX + 20}" y="${ccY}" width="${SW - 40}" height="88" rx="18"
    fill="${C.card}" stroke="${C.divider}" stroke-width="1.5" filter="url(#cardShadow)"/>
  <text x="${SX + 44}" y="${ccY + 30}" fill="${C.textMuted}" font-size="17"
    font-family="${F}" font-weight="600">Devise</text>
  <text x="${SX + 44}" y="${ccY + 62}" fill="${C.textDark}" font-size="24"
    font-family="${F}" font-weight="800">XOF — Franc CFA BCEAO</text>`);

  // Amount input
  const aiY = SY + 302;
  parts.push(`
  <rect x="${SX + 20}" y="${aiY}" width="${SW - 40}" height="102" rx="18"
    fill="${C.card}" stroke="${C.primary}" stroke-width="2.5" filter="url(#cardShadow)"/>
  <text x="${SX + 44}" y="${aiY + 30}" fill="${C.textMuted}" font-size="17"
    font-family="${F}" font-weight="600">Montant à convertir</text>
  <text x="${SX + 44}" y="${aiY + 76}" fill="${C.textDark}" font-size="44"
    font-family="${F}" font-weight="900">75 000</text>
  <text x="${SX + SW - 44}" y="${aiY + 76}" fill="${C.textMuted}" font-size="28"
    font-family="${F}" font-weight="700" text-anchor="end">XOF</text>`);

  // Result card
  const rcY = SY + 430;
  parts.push(`
  <rect x="${SX + 20}" y="${rcY}" width="${SW - 40}" height="210" rx="24"
    fill="${C.primary}"/>
  <text x="${SX + SW / 2}" y="${rcY + 50}" fill="rgba(255,255,255,0.72)" font-size="20"
    font-family="${F}" font-weight="600" text-anchor="middle">Équivaut à</text>
  <text x="${SX + SW / 2}" y="${rcY + 128}" fill="${C.white}" font-size="56"
    font-family="${F}" font-weight="900" text-anchor="middle">2 jours  6 h</text>
  <text x="${SX + SW / 2}" y="${rcY + 172}" fill="rgba(255,255,255,0.78)" font-size="22"
    font-family="${F}" font-weight="500" text-anchor="middle">de ton temps de travail</text>`);

  // Salary info
  const siY = SY + 666;
  parts.push(`
  <rect x="${SX + 20}" y="${siY}" width="${SW - 40}" height="68" rx="16"
    fill="${C.primaryTint}" stroke="${C.primary}28" stroke-width="1"/>
  <text x="${SX + 44}" y="${siY + 28}" fill="${C.textMid}" font-size="17"
    font-family="${F}" font-weight="500">Profil actif</text>
  <text x="${SX + 44}" y="${siY + 52}" fill="${C.primary}" font-size="19"
    font-family="${F}" font-weight="700">Mon profil · 150 000 XOF/mois · 35 h/sem</text>`);

  // Save button
  const sbY = SY + 762;
  parts.push(`
  <rect x="${SX + 20}" y="${sbY}" width="${SW - 40}" height="68" rx="18"
    fill="${C.primary}"/>
  <text x="${SX + SW / 2}" y="${sbY + 44}" fill="${C.white}" font-size="24"
    font-family="${F}" font-weight="800" text-anchor="middle">Enregistrer la conversion</text>`);

  // Recent entries title
  parts.push(`
  <text x="${SX + 24}" y="${SY + 876}" fill="${C.textMuted}" font-size="16"
    font-family="${F}" font-weight="700" letter-spacing="1">RÉCENT</text>`);

  // Recent entries
  const recentList = [
    { label: 'Courses marché',    dur: '45 min de travail',    amt: '18 000 XOF' },
    { label: 'Transport semaine', dur: '1 h 12 min de travail', amt: '5 000 XOF' },
  ];
  recentList.forEach((e, i) => {
    const ey = SY + 896 + i * 88;
    parts.push(`
    <rect x="${SX + 20}" y="${ey}" width="${SW - 40}" height="78" rx="16"
      fill="${C.card}" stroke="${C.divider}" stroke-width="1.5" filter="url(#cardShadow)"/>
    <rect x="${SX + 34}" y="${ey + 19}" width="40" height="40" rx="12" fill="${C.primaryTint}"/>
    <text x="${SX + 54}" y="${ey + 45}" font-size="20" text-anchor="middle">≡</text>
    <text x="${SX + 86}" y="${ey + 34}" fill="${C.textDark}" font-size="19"
      font-family="${F}" font-weight="600">${e.label}</text>
    <text x="${SX + 86}" y="${ey + 58}" fill="${C.primary}" font-size="17"
      font-family="${F}" font-weight="700">${e.dur}</text>
    <text x="${SX + SW - 40}" y="${ey + 44}" fill="${C.textMuted}" font-size="17"
      font-family="${F}" font-weight="500" text-anchor="end">${e.amt}</text>`);
  });

  parts.push(tabBar(0));
  return parts.join('\n');
}

/* ─── Screen 2: Onboarding ────────────────────────────────────────────────── */
function screen2() {
  const parts = [];

  parts.push(`<rect x="${SX}" y="${SY}" width="${SW}" height="${SH}" rx="44" fill="${C.screen}"/>`);
  parts.push(statusBar());

  // Brand strip
  parts.push(`
  <text x="${SX + SW / 2}" y="${SY + 98}" fill="${C.primary}" font-size="28"
    font-family="${F}" font-weight="800" text-anchor="middle">⊙  Owoda</text>`);

  // Progress indicator
  [0, 1, 2].forEach((i) => {
    const dotX = SX + SW / 2 + (i - 1) * 22;
    const active = i === 1;
    parts.push(`<circle cx="${dotX}" cy="${SY + 128}" r="${active ? 7 : 5}"
      fill="${active ? C.primary : C.divider}"/>`);
  });

  // Title
  parts.push(`
  <text x="${SX + SW / 2}" y="${SY + 188}" fill="${C.textDark}" font-size="36"
    font-family="${F}" font-weight="900" text-anchor="middle">Choisis ta devise</text>
  <text x="${SX + SW / 2}" y="${SY + 226}" fill="${C.textMid}" font-size="21"
    font-family="${F}" font-weight="400" text-anchor="middle">Modifiable à tout moment dans les réglages</text>`);

  // Currency rows
  const currencies = [
    { code: 'XOF', name: 'Franc CFA BCEAO', region: 'Afrique de l\'Ouest', sel: true  },
    { code: 'XAF', name: 'Franc CFA BEAC',  region: 'Afrique Centrale',     sel: false },
    { code: 'NGN', name: 'Naira',            region: 'Nigéria',               sel: false },
    { code: 'MAD', name: 'Dirham',           region: 'Maroc',                 sel: false },
    { code: 'EUR', name: 'Euro',             region: 'Zone Euro',             sel: false },
    { code: 'USD', name: 'Dollar US',        region: 'États-Unis',            sel: false },
    { code: 'GBP', name: 'Livre Sterling',   region: 'Royaume-Uni',           sel: false },
  ];

  currencies.forEach((cur, i) => {
    const cy = SY + 260 + i * 82;
    const bg = cur.sel ? C.primaryTint : C.card;
    const border = cur.sel ? C.primary : C.divider;
    parts.push(`
    <rect x="${SX + 22}" y="${cy}" width="${SW - 44}" height="72" rx="18"
      fill="${bg}" stroke="${border}" stroke-width="${cur.sel ? 2 : 1.5}"/>
    <text x="${SX + 60}" y="${cy + 44}" font-size="28" text-anchor="middle">${
      cur.code === 'XOF' || cur.code === 'XAF' ? '◍' :
      cur.code === 'NGN' ? '●' :
      cur.code === 'MAD' ? '◆' :
      cur.code === 'EUR' ? '◉' :
      cur.code === 'USD' ? '○' : '◎'
    }</text>
    <text x="${SX + 92}" y="${cy + 30}" fill="${C.textDark}" font-size="21"
      font-family="${F}" font-weight="700">${cur.code}</text>
    <text x="${SX + 92}" y="${cy + 54}" fill="${C.textMid}" font-size="17"
      font-family="${F}" font-weight="400">${cur.name} · ${cur.region}</text>
    ${cur.sel
      ? `<circle cx="${SX + SW - 54}" cy="${cy + 36}" r="16" fill="${C.primary}"/>
         <text x="${SX + SW - 54}" y="${cy + 41}" font-size="16" text-anchor="middle"
           fill="white" font-weight="900">✓</text>`
      : `<circle cx="${SX + SW - 54}" cy="${cy + 36}" r="15" fill="none"
           stroke="${C.divider}" stroke-width="2"/>`}
    `);
  });

  // Continue button
  const btnY = SY + SH - 152;
  parts.push(`
  <rect x="${SX + 22}" y="${btnY}" width="${SW - 44}" height="70" rx="18"
    fill="${C.primary}"/>
  <text x="${SX + SW / 2}" y="${btnY + 45}" fill="${C.white}" font-size="26"
    font-family="${F}" font-weight="800" text-anchor="middle">Continuer</text>`);

  return parts.join('\n');
}

/* ─── Screen 3: History ───────────────────────────────────────────────────── */
function screen3() {
  const parts = [];

  parts.push(`<rect x="${SX}" y="${SY}" width="${SW}" height="${SH}" rx="44" fill="#F5FAF8"/>`);
  parts.push(statusBar());

  // Header row
  parts.push(`
  <text x="${SX + 24}" y="${SY + 108}" fill="${C.textDark}" font-size="38"
    font-family="${F}" font-weight="900">Historique</text>
  <text x="${SX + SW - 24}" y="${SY + 108}" fill="${C.primary}" font-size="21"
    font-family="${F}" font-weight="700" text-anchor="end">↑ CSV  PRO</text>`);

  // Summary box
  const sumY = SY + 126;
  parts.push(`
  <rect x="${SX + 20}" y="${sumY}" width="${SW - 40}" height="62" rx="16"
    fill="${C.primaryTint}" stroke="${C.primary}30" stroke-width="1"/>
  <text x="${SX + 40}" y="${sumY + 38}" fill="${C.textMid}" font-size="19"
    font-family="${F}" font-weight="500">6 conversion(s)</text>
  <text x="${SX + SW - 40}" y="${sumY + 38}" fill="${C.primary}" font-size="19"
    font-family="${F}" font-weight="800" text-anchor="end">Total : 1 j 4 h 30 min</text>`);

  // Category chips
  const chips = ['Tout', 'Alimentaire', 'Transport'];
  let cx2 = SX + 20;
  const chY = sumY + 74;
  chips.forEach((chip, i) => {
    const cw = chip.length * 12 + 36;
    const active = i === 0;
    parts.push(`
    <rect x="${cx2}" y="${chY}" width="${cw}" height="36" rx="18"
      fill="${active ? C.primaryTint : C.card}" stroke="${active ? C.primary : C.divider}"
      stroke-width="${active ? 2 : 1.5}"/>
    <text x="${cx2 + cw / 2}" y="${chY + 24}" fill="${active ? C.primary : C.textMid}"
      font-size="17" font-family="${F}" font-weight="${active ? '700' : '500'}"
      text-anchor="middle">${chip}</text>`);
    cx2 += cw + 10;
  });

  // Date header + entries helper
  function renderDateSection(label, entries, startY) {
    parts.push(`
    <text x="${SX + 24}" y="${startY}" fill="${C.textMuted}" font-size="15"
      font-family="${F}" font-weight="700" letter-spacing="1">${label}</text>`);
    entries.forEach((e, i) => {
      const ey = startY + 14 + i * 86;
      parts.push(`
      <rect x="${SX + 20}" y="${ey}" width="${SW - 40}" height="76" rx="16"
        fill="${C.card}" stroke="${C.divider}" stroke-width="1.5" filter="url(#cardShadow)"/>
      <rect x="${SX + 34}" y="${ey + 18}" width="40" height="40" rx="12" fill="${C.primaryTint}"/>
      <text x="${SX + 54}" y="${ey + 44}" font-size="20" text-anchor="middle">${e.sym}</text>
      <text x="${SX + 86}" y="${ey + 33}" fill="${C.textDark}" font-size="19"
        font-family="${F}" font-weight="600">${e.label}</text>
      <text x="${SX + 86}" y="${ey + 57}" fill="${C.primary}" font-size="17"
        font-family="${F}" font-weight="700">${e.dur}</text>
      <text x="${SX + SW - 40}" y="${ey + 33}" fill="${C.textMuted}" font-size="17"
        font-family="${F}" font-weight="500" text-anchor="end">${e.amt}</text>
      <text x="${SX + SW - 40}" y="${ey + 57}" fill="${C.textMuted}" font-size="15"
        font-family="${F}" text-anchor="end">${e.time}</text>`);
    });
    return startY + 14 + entries.length * 86 + 22;
  }

  const todayEntries = [
    { sym: '▣', label: 'Courses marché', dur: '2 h 15 min', amt: '25 000 XOF', time: '14:32' },
    { sym: '⬡', label: 'Abonnement bus', dur: '1 h 12 min', amt: '14 000 XOF', time: '08:15' },
    { sym: '◈', label: 'Pharmacie',       dur: '48 min',     amt: '9 500 XOF',  time: '10:50' },
  ];
  const hierEntries = [
    { sym: '▲', label: 'Abonnement internet', dur: '3 h 30 min', amt: '39 000 XOF', time: '20:00' },
    { sym: '◉', label: 'Loyer mensuel',        dur: '8 h 45 min', amt: '100 000 XOF', time: '09:00' },
  ];

  let nextY = renderDateSection("AUJOURD'HUI", todayEntries, chY + 54);
  renderDateSection('HIER', hierEntries, nextY);

  parts.push(tabBar(1));
  return parts.join('\n');
}

/* ─── Screen 4: Paywall ───────────────────────────────────────────────────── */
function screen4() {
  const parts = [];

  parts.push(`<rect x="${SX}" y="${SY}" width="${SW}" height="${SH}" rx="44" fill="${C.screen}"/>`);
  parts.push(statusBar());

  // Close
  parts.push(`
  <text x="${SX + SW - 34}" y="${SY + 106}" fill="${C.textMuted}" font-size="26"
    font-family="${F}" font-weight="600" text-anchor="middle">x</text>`);

  // Hero
  parts.push(`
  <text x="${SX + SW / 2}" y="${SY + 150}" fill="${C.primary}" font-size="50"
    text-anchor="middle" font-family="${F}">⊙</text>
  <text x="${SX + SW / 2}" y="${SY + 194}" fill="${C.textDark}" font-size="34"
    font-family="${F}" font-weight="900" text-anchor="middle">Owoda Premium</text>
  <text x="${SX + SW / 2}" y="${SY + 224}" fill="${C.textMid}" font-size="20"
    font-family="${F}" font-weight="400" text-anchor="middle">Débloquez toutes les fonctionnalités</text>`);

  // Features card
  const features = [
    'Scanner de prix (OCR)',
    'Widget écran d\'accueil',
    'Export CSV',
    'Tableau de bord analytique',
    'Historique illimité',
    'Profils multiples',
  ];
  const fCardY = SY + 248;
  const fRowH  = 60;
  parts.push(`
  <rect x="${SX + 20}" y="${fCardY}" width="${SW - 40}" height="${features.length * fRowH}" rx="20"
    fill="${C.card}" stroke="${C.divider}" stroke-width="1.5" filter="url(#cardShadow)"/>`);

  features.forEach((feat, i) => {
    const fy = fCardY + i * fRowH;
    parts.push(`
    <rect x="${SX + 34}" y="${fy + 12}" width="36" height="36" rx="10" fill="${C.primaryTint}"/>
    <text x="${SX + 78}" y="${fy + 36}" fill="${C.textDark}" font-size="19"
      font-family="${F}" font-weight="500">${feat}</text>
    <circle cx="${SX + SW - 52}" cy="${fy + 30}" r="12" fill="${C.primary}"/>
    <text x="${SX + SW - 52}" y="${fy + 35}" fill="${C.white}" font-size="14"
      text-anchor="middle" font-weight="900">✓</text>
    ${i < features.length - 1
      ? `<line x1="${SX + 30}" y1="${fy + fRowH}" x2="${SX + SW - 30}" y2="${fy + fRowH}"
           stroke="${C.divider}" stroke-width="1"/>`
      : ''}`);
  });

  // Pricing grid label
  const gridLabelY = fCardY + features.length * fRowH + 26;
  parts.push(`
  <text x="${SX + 24}" y="${gridLabelY}" fill="${C.textMuted}" font-size="15"
    font-family="${F}" font-weight="700" letter-spacing="1.5">TARIF ANNUEL</text>`);

  // Pricing cards (2 per row)
  const tiers = [
    { code: 'XOF', amt: '2 990 XOF', sel: true  },
    { code: 'XAF', amt: '2 990 XAF', sel: false },
    { code: 'EUR', amt: '4,99 EUR',   sel: false },
    { code: 'USD', amt: '$4.99',      sel: false },
    { code: 'NGN', amt: '₦ 2 500',   sel: false },
  ];

  const cW = (SW - 44 - 10) / 2;   // card width for 2-col layout
  const cH = 108;
  const gridY = gridLabelY + 14;

  tiers.forEach((tier, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const tx = SX + 22 + col * (cW + 10);
    const ty = gridY + row * (cH + 10);
    const bg     = tier.sel ? C.primaryTint : C.card;
    const border = tier.sel ? C.primary : '#DDD';

    // Last card (5th) spans full width
    const cardW = (i === 4) ? (SW - 44) : cW;

    parts.push(`
    <rect x="${tx}" y="${ty}" width="${cardW}" height="${cH}" rx="16"
      fill="${bg}" stroke="${border}" stroke-width="${tier.sel ? 2 : 1.5}"/>
    <text x="${tx + cardW / 2}" y="${ty + 32}" fill="${tier.sel ? C.primary : C.textMuted}"
      font-size="17" font-family="${F}" font-weight="700" text-anchor="middle">${tier.code}</text>
    <text x="${tx + cardW / 2}" y="${ty + 66}" fill="${tier.sel ? C.textDark : C.textDark}"
      font-size="22" font-family="${F}" font-weight="800" text-anchor="middle">${tier.amt}</text>
    <text x="${tx + cardW / 2}" y="${ty + 90}" fill="${tier.sel ? C.primary : C.textMuted}"
      font-size="15" font-family="${F}" text-anchor="middle">/an</text>
    ${tier.sel
      ? `<circle cx="${tx + cardW - 18}" cy="${ty + 18}" r="12" fill="${C.primary}"/>
         <text x="${tx + cardW - 18}" y="${ty + 23}" font-size="13" text-anchor="middle"
           fill="white" font-weight="900">✓</text>`
      : ''}`);
  });

  // CTA button
  const ctaY = gridY + 3 * (cH + 10) + 8;
  parts.push(`
  <rect x="${SX + 20}" y="${ctaY}" width="${SW - 40}" height="70" rx="18"
    fill="${C.primary}"/>
  <text x="${SX + SW / 2}" y="${ctaY + 40}" fill="${C.white}" font-size="25"
    font-family="${F}" font-weight="900" text-anchor="middle">Débloquer Premium</text>
  <text x="${SX + SW / 2}" y="${ctaY + 60}" fill="rgba(255,255,255,0.70)" font-size="15"
    font-family="${F}" text-anchor="middle">Abonnement annuel · Annulable à tout moment</text>`);

  // Restore
  const restY = ctaY + 84;
  parts.push(`
  <text x="${SX + SW / 2}" y="${restY}" fill="${C.textMuted}" font-size="17"
    font-family="${F}" font-weight="600" text-anchor="middle">Restaurer les achats</text>`);

  return parts.join('\n');
}

/* ─── Assemble full screenshot SVG ───────────────────────────────────────── */
function buildScreenshot(line1, line2, sub, screenFn) {
  return `<svg xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  ${defs()}
  ${background()}
  ${taglines(line1, line2, sub)}
  ${phoneBody()}
  <g clip-path="url(#screenClip)">
    ${screenFn()}
  </g>
  ${owodaLogo()}
</svg>`;
}

/* ─── PNG export ──────────────────────────────────────────────────────────── */
async function savePng(svgStr, filename) {
  const outPath = resolve(OUT_DIR, filename);
  await sharp(Buffer.from(svgStr))
    .resize(W, H)
    .png({ compressionLevel: 9 })
    .toFile(outPath);
  console.log(`  ✓  store-assets/${filename}  (${W}×${H})`);
}

/* ─── Main ────────────────────────────────────────────────────────────────── */
(async () => {
  console.log('\n📱  Generating Owoda Play Store screenshots…\n');

  await savePng(
    buildScreenshot(
      'Connais la vraie',
      'valeur de ton argent',
      '75 000 XOF = 2 jours 6 h de travail',
      screen1,
    ),
    'screenshot_01_converter.png',
  );

  await savePng(
    buildScreenshot(
      'Conçu pour',
      "l'Afrique",
      'XOF · XAF · NGN · MAD et plus',
      screen2,
    ),
    'screenshot_02_onboarding.png',
  );

  await savePng(
    buildScreenshot(
      'Suis chaque dépense',
      'en temps réel',
      'Filtre, exporte, analyse',
      screen3,
    ),
    'screenshot_03_history.png',
  );

  await savePng(
    buildScreenshot(
      "2 990 XOF/an.",
      "Le prix d'un Fanta.",
      "L'économie d'une vie.",
      screen4,
    ),
    'screenshot_04_paywall.png',
  );

  console.log('\n✅  All screenshots generated in store-assets/\n');
})();
