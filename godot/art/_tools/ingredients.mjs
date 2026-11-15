// Ingredient icons (full colour), jar emblems (ink silhouettes), bottles and precomposed jars.
import { P, svg, lin, rad, shade, tint, sparkle, out } from './lib.mjs';

// Mirrors INGS in src/logic.js (id, name, op, colour).
export const INGS = [
  ['dew', 'Dewdrop', '+', 1, '#7fc8e8'], ['bone', 'Bone dust', '+', 4, '#d9cfb8'],
  ['newt', 'Newt eye', '+', 6, '#8fd16a'], ['ember', 'Ember root', '+', 10, '#f08a4b'],
  ['salt', 'Shadow salt', '-', 3, '#9a8fd0'], ['frost', 'Frost leaf', '-', 7, '#a8e6e0'],
  ['moon', 'Moonwater', 'x', 2, '#cfc8ff'], ['dragon', 'Dragon pepper', 'x', 3, '#e2504a'],
  ['mist', 'Mist moss', '/', 2, '#a6c49f'], ['troll', 'Troll sweat', '-', 12, '#c9b45a'],
  ['star', 'Starflower', '/', 3, '#f5e27a'], ['gold', 'Goblin gold', '+', 25, '#e3b93f'],
  ['wyrm', 'Wyrm scale', 'x', 4, '#4fa38a'], ['tear', 'Hag’s tear', '-', 20, '#9fc3e8'],
  ['ash', 'Phoenix ash', '/', 5, '#c95b8f'], ['quick', 'Quicksilver', '/', 4, '#c8ccd4'],
].map(([id, name, op, v, color]) => ({ id, name, op, v, color }));

const W = '#ffffff';
// ---- full-colour icons, 96x96 ----------------------------------------------
const ICON = {
  dew: (c, d, l) => `
    <path d="M44 8C44 8 16 44 16 62a28 28 0 0 0 56 0C72 44 44 8 44 8Z" fill="${c}"/>
    <path d="M44 8C44 8 72 44 72 62a28 28 0 0 1-45 22c22 4 38-10 35-30C60 40 44 8 44 8Z" fill="${d}" fill-opacity=".6"/>
    <path d="M29 54c-3 9-1 18 5 24" stroke="${W}" stroke-opacity=".85" stroke-width="5" fill="none" stroke-linecap="round"/>
    <circle cx="37" cy="42" r="3" fill="${W}" fill-opacity=".85"/>
    <path d="M78 18c0 0-8 10-8 16a8 8 0 0 0 16 0c0-6-8-16-8-16Z" fill="${l}"/>
    <circle cx="75" cy="33" r="1.8" fill="${W}"/>`,
  bone: (c, d, l) => `
    <g transform="rotate(-38 48 46)">
      <circle cx="20" cy="37" r="11" fill="${c}"/><circle cx="20" cy="55" r="11" fill="${c}"/>
      <circle cx="76" cy="37" r="11" fill="${c}"/><circle cx="76" cy="55" r="11" fill="${c}"/>
      <rect x="20" y="37" width="56" height="18" fill="${c}"/>
      <path d="M12 60a11 11 0 0 0 18 2c2-2 4-4 8-4h20c4 0 6 2 8 4a11 11 0 0 0 18-2c-3 4-9 4-12 0-2-3-5-5-10-5H34c-5 0-8 2-10 5-3 4-9 4-12 0Z" fill="${d}" fill-opacity=".55"/>
      <path d="M16 31c2-3 6-4 9-2M30 41h34" stroke="${W}" stroke-opacity=".8" stroke-width="4" stroke-linecap="round" fill="none"/>
    </g>
    <circle cx="70" cy="78" r="4" fill="${l}"/><circle cx="82" cy="70" r="2.5" fill="${c}"/><circle cx="58" cy="86" r="2.5" fill="${c}"/><circle cx="84" cy="84" r="2" fill="${l}"/>`,
  newt: (c, d, l) => `
    <circle cx="48" cy="48" r="38" fill="#f4f1e4"/>
    <path d="M48 10a38 38 0 0 1 0 76c18-6 28-20 28-38S66 16 48 10Z" fill="${P.lilac}" fill-opacity=".45"/>
    <path d="M14 40c5 1 9 3 12 7M16 60c4-1 7-3 9-6" stroke="${P.coal}" stroke-opacity=".55" stroke-width="2" fill="none" stroke-linecap="round"/>
    <circle cx="48" cy="48" r="23" fill="${d}"/><circle cx="48" cy="48" r="20" fill="${c}"/>
    <circle cx="48" cy="48" r="20" fill="url(#g)"/>
    <ellipse cx="48" cy="48" rx="5.5" ry="16" fill="${P.ink}"/>
    <circle cx="38" cy="37" r="6.5" fill="${W}"/><circle cx="58" cy="60" r="2.6" fill="${W}" fill-opacity=".8"/>`,
  ember: (c, d, l) => `
    <path d="M40 30c10-6 22-2 26 8 3 8 0 16 6 24 5 6 13 8 12 16-1 9-12 10-18 4-4-4-7-2-8 3-2 9-13 10-15 1-2-8 3-14-1-23-4-9-14-11-15-20-1-6 5-10 13-13Z" fill="${d}"/>
    <path d="M42 34c8-4 17-1 20 6 3 7 0 14 5 22 4 6 11 8 11 13-1 5-7 5-11 1-5-5-11-3-13 4-1 5-6 6-8 1-2-6 3-12-1-21-4-9-12-11-13-17 0-4 4-7 10-9Z" fill="${c}"/>
    <path d="M44 42c4 4 5 10 4 16M56 48c-1 6 1 12 5 16M50 66c0 5-1 9-3 13" stroke="${P.flameHi}" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M38 32c-9-8-2-15 0-24 7 6 9 12 6 18 4-2 6-6 6-10 6 7 5 15-2 20Z" fill="${P.flame}"/>
    <path d="M40 30c-4-5-1-9 0-13 4 4 5 9 2 13Z" fill="${P.flameHi}"/>
    <path d="M30 58l-8 3M33 68l-7 6" stroke="${d}" stroke-width="3" stroke-linecap="round"/>`,
  salt: (c, d, l) => `
    <path d="M26 40 38 52 40 84H18l-6-26Z" fill="${c}"/><path d="M26 40 38 52 40 84H28Z" fill="${d}"/>
    <path d="M72 34 86 52 82 84H60V50Z" fill="${c}"/><path d="M72 34 86 52 82 84H72Z" fill="${d}"/><path d="M72 34 60 50h12Z" fill="${l}"/>
    <path d="M48 6 66 30 60 86H36L30 30Z" fill="${c}"/>
    <path d="M48 6 66 30 60 86H48Z" fill="${d}"/>
    <path d="M48 6 30 30h18Z" fill="${l}"/><path d="M48 6 66 30H48Z" fill="${c}"/>
    <path d="M30 30h36" stroke="${W}" stroke-opacity=".5" stroke-width="1.5"/>
    <path d="M37 38v30" stroke="${W}" stroke-opacity=".6" stroke-width="3" stroke-linecap="round"/>
    <path d="M10 86h76" stroke="${shade(c, .6)}" stroke-width="6" stroke-linecap="round"/>
    ${sparkle(80, 20, 8, W, .9)}${sparkle(16, 28, 5, W, .7)}`,
  frost: (c, d, l) => `
    <path d="M12 86C10 44 36 14 86 10c2 46-24 78-74 76Z" fill="${c}"/>
    <path d="M12 86 86 10c2 46-24 78-74 76Z" fill="${d}" fill-opacity=".5"/>
    <path d="M10 88 78 18" stroke="${W}" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M32 66V44M32 66h22M48 50V30M48 50h20M62 36V22M62 36h13" stroke="${W}" stroke-opacity=".8" stroke-width="2.5" stroke-linecap="round" fill="none"/>
    <path d="M86 10 80 8M86 22l6-2M80 44l7 2M66 66l6 5M44 82l3 7M20 60l-7-2M22 40l-7-4M40 22l-4-7M60 12l-2-7" stroke="${W}" stroke-width="2.5" stroke-linecap="round"/>
    ${sparkle(22, 20, 8, W, .95)}${sparkle(82, 78, 6, W, .8)}`,
  moon: (c, d, l) => `
    <path d="M56 6a36 36 0 1 0 30 56A30 30 0 0 1 56 6Z" fill="${c}"/>
    <path d="M30 22a36 36 0 0 0 56 40 32 32 0 0 1-50 6c-8-12-10-30-6-46Z" fill="${d}" fill-opacity=".45"/>
    <path d="M26 34c-3 9-2 18 3 26" stroke="${W}" stroke-opacity=".8" stroke-width="4" stroke-linecap="round" fill="none"/>
    <circle cx="44" cy="56" r="4" fill="${d}" fill-opacity=".35"/><circle cx="36" cy="40" r="2.5" fill="${d}" fill-opacity=".35"/>
    <path d="M16 84c8-4 16-4 24 0s16 4 24 0 12-3 18-1" stroke="${c}" stroke-width="4" stroke-linecap="round" fill="none"/>
    <path d="M30 92c6-2 12-2 18 0s10 2 16 0" stroke="${c}" stroke-opacity=".6" stroke-width="3" stroke-linecap="round" fill="none"/>
    ${sparkle(72, 26, 9, W, .95)}${sparkle(86, 44, 4, W, .8)}`,
  dragon: (c, d, l) => `
    <path d="M30 32c16-8 46-2 52 18 6 24-30 44-62 36 22-8 30-24 22-40-3-5-8-9-12-14Z" fill="${c}"/>
    <path d="M82 50c6 24-30 44-62 36 20 0 44-8 50-24 2-6 2-12 0-20 6 2 10 4 12 8Z" fill="${d}" fill-opacity=".55"/>
    <path d="M48 36c10-1 20 3 24 10" stroke="${W}" stroke-opacity=".7" stroke-width="4.5" stroke-linecap="round" fill="none"/>
    <path d="M26 36c6-8 14-8 20-2-6 0-12 2-16 6Z" fill="${P.mintLo}"/>
    <path d="M32 32c-2-10 2-18 14-24" stroke="${P.mintLo}" stroke-width="7" fill="none" stroke-linecap="round"/>
    <path d="M14 90c-6-4-4-10 0-14 0 4 3 5 4 8 2-3 2-6 0-10 8 4 10 12 4 18Z" fill="${P.flame}"/>`,
  mist: (c, d, l) => `
    <circle cx="30" cy="62" r="20" fill="${d}"/><circle cx="62" cy="56" r="24" fill="${d}"/><circle cx="54" cy="76" r="16" fill="${d}"/>
    <circle cx="30" cy="58" r="18" fill="${c}"/><circle cx="60" cy="52" r="22" fill="${c}"/><circle cx="52" cy="72" r="14" fill="${c}"/>
    <circle cx="24" cy="52" r="5" fill="${l}"/><circle cx="54" cy="42" r="7" fill="${l}"/><circle cx="68" cy="56" r="4" fill="${l}"/><circle cx="46" cy="70" r="4" fill="${l}"/><circle cx="36" cy="64" r="2.5" fill="${l}"/>
    <path d="M14 30c6-8 16-8 20-2s12 6 16 0 14-6 18 2" stroke="${W}" stroke-opacity=".75" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M36 14c5-5 12-5 16 0s10 5 14 0" stroke="${W}" stroke-opacity=".5" stroke-width="3.5" fill="none" stroke-linecap="round"/>`,
  troll: (c, d, l) => `
    <path d="M34 20C34 20 12 50 12 64a22 22 0 0 0 44 0C56 50 34 20 34 20Z" fill="${c}"/>
    <path d="M34 20s22 30 22 44a22 22 0 0 1-36 17c16 2 28-8 26-22-2-12-12-39-12-39Z" fill="${d}" fill-opacity=".6"/>
    <path d="M23 58c-2 7 0 13 4 17" stroke="${W}" stroke-opacity=".8" stroke-width="4" stroke-linecap="round" fill="none"/>
    <path d="M70 44s-13 17-13 26a13 13 0 0 0 26 0c0-9-13-26-13-26Z" fill="${c}"/>
    <path d="M70 44s13 17 13 26a13 13 0 0 1-21 10c9 1 16-5 15-13-1-8-7-23-7-23Z" fill="${d}" fill-opacity=".6"/>
    <path d="M54 8c-4 4 4 8 0 12s4 8 0 12M70 6c-4 4 4 8 0 12s4 8 0 12M84 12c-3 3 3 6 0 9s3 6 0 9" stroke="${P.mintLo}" stroke-opacity=".9" stroke-width="3" fill="none" stroke-linecap="round"/>`,
  star: (c, d, l) => `
    <path d="M50 60c-2 12-2 22 2 32" stroke="${P.mintLo}" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M52 80c8-10 18-12 28-8-6 10-16 14-28 8Z" fill="${P.mintLo}"/>
    <path d="M48 4l10 22 24 3-18 16 5 24-21-12-21 12 5-24L14 29l24-3Z" fill="${d}" stroke="${d}" stroke-width="6" stroke-linejoin="round"/>
    <path d="M48 4l10 22 24 3-18 16 5 24-21-12-21 12 5-24L14 29l24-3Z" fill="${c}" stroke="${c}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M48 16l6 14 15 2-11 10 3 15-13-8-13 8 3-15-11-10 15-2Z" fill="${l}"/>
    <circle cx="48" cy="38" r="8" fill="${P.ember}"/><circle cx="45" cy="35" r="2" fill="${P.flameHi}"/><circle cx="51" cy="40" r="1.6" fill="${P.flameHi}"/>`,
  gold: (c, d, l) => `
    ${[72, 58, 44].map((y) => `<path d="M12 ${y}v10c0 8 14 13 30 13s30-5 30-13V${y}Z" fill="${d}"/><ellipse cx="42" cy="${y}" rx="30" ry="12" fill="${c}"/><ellipse cx="42" cy="${y}" rx="22" ry="8" fill="${l}" fill-opacity=".55"/>`).join('')}
    <path d="M18 52v8M28 57v8M56 57v8M66 52v8M18 66v8M28 71v8M56 71v8M66 66v8M18 80v6M66 80v6" stroke="${shade(c, .55)}" stroke-opacity=".6" stroke-width="2" stroke-linecap="round"/>
    <path d="M34 44l-6-7 9 2 5-5 5 5 9-2-6 7Z" fill="${d}"/>
    <circle cx="74" cy="30" r="15" fill="${d}"/><circle cx="73" cy="28" r="14" fill="${c}"/><circle cx="73" cy="28" r="9" fill="${l}" fill-opacity=".6"/>
    ${sparkle(86, 12, 8, W, .95)}${sparkle(16, 30, 5, W, .8)}`,
  wyrm: (c, d, l) => `
    <path d="M48 6c24 6 38 26 34 52-3 18-18 28-34 32-16-4-31-14-34-32C10 32 24 12 48 6Z" fill="${d}"/>
    <path d="M48 6c24 6 36 24 32 48-3 17-17 26-32 30-15-4-29-13-32-30C12 30 24 12 48 6Z" fill="${c}"/>
    <path d="M48 6c24 6 36 24 32 48-3 17-17 26-32 30Z" fill="${d}" fill-opacity=".45"/>
    <path d="M26 44c2 14 10 24 22 28 12-4 20-14 22-28M32 30c2 12 8 20 16 24 8-4 14-12 16-24M38 20c2 6 5 10 10 13 5-3 8-7 10-13" stroke="${l}" stroke-opacity=".8" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M48 8v80" stroke="${shade(c, .5)}" stroke-opacity=".5" stroke-width="2"/>
    <path d="M24 34c2-8 7-14 14-18" stroke="${P.frost || '#a8e6e0'}" stroke-width="4" fill="none" stroke-linecap="round"/>`,
  tear: (c, d, l) => `
    <path d="M18 26Q48 2 78 26" stroke="${P.lilac}" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M24 20l-6-8M38 13l-3-9M58 13l3-9M72 20l6-8" stroke="${P.lilac}" stroke-width="4" stroke-linecap="round"/>
    <path d="M48 28C48 28 26 58 26 72a22 22 0 0 0 44 0C70 58 48 28 48 28Z" fill="${c}"/>
    <path d="M48 28s22 30 22 44a22 22 0 0 1-36 17c16 2 28-8 26-22-2-12-12-39-12-39Z" fill="${d}" fill-opacity=".6"/>
    <path d="M46 56c5 3-4 7 1 11s-3 7 1 11" stroke="${shade(c, .7)}" stroke-opacity=".7" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M36 66c-2 7 0 13 4 17" stroke="${W}" stroke-opacity=".85" stroke-width="4" stroke-linecap="round" fill="none"/>`,
  ash: (c, d, l) => `
    <path d="M84 8C42 12 18 42 18 78l-6 10 10-4c36 0 62-28 62-76Z" fill="${c}"/>
    <path d="M84 8C84 56 58 84 22 84L84 8Z" fill="${d}" fill-opacity=".5"/>
    <path d="M84 8C70 10 58 16 48 24l14 2 2 14c10-10 18-20 20-32Z" fill="${P.ember}"/>
    <path d="M84 8c-8 2-14 5-20 9l8 2 2 8c5-6 9-12 10-19Z" fill="${P.flameHi}"/>
    <path d="M18 82 76 18" stroke="${tint(c, .7)}" stroke-width="3" stroke-linecap="round"/>
    <path d="M32 44l8 16M26 60l6 8M46 34l6 12M60 52l-14-2M50 64l-14-2M40 74l-10-2" stroke="${shade(c, .5)}" stroke-opacity=".6" stroke-width="2.5" stroke-linecap="round"/>
    <circle cx="14" cy="60" r="2.5" fill="${P.lilac}"/><circle cx="22" cy="44" r="2" fill="${P.lilac}"/><circle cx="10" cy="74" r="1.8" fill="${P.lilac}"/><circle cx="70" cy="84" r="2.5" fill="${P.ember}"/><circle cx="82" cy="72" r="1.8" fill="${P.flame}"/>`,
  quick: (c, d, l) => `
    <path d="M20 42c0-18 18-28 32-24s28 8 28 26-10 16-6 30-12 18-26 14-28-4-28-22 0-12 0-24Z" fill="${c}"/>
    <path d="M80 44c0 18-10 16-6 30s-12 18-26 14-28-4-28-22c8 12 22 14 34 10s18-12 18-22c0-6 2-10 8-10Z" fill="${shade(c, .5)}" fill-opacity=".7"/>
    <path d="M30 40c2-9 10-14 20-13" stroke="${W}" stroke-width="6" stroke-linecap="round" fill="none"/>
    <circle cx="62" cy="34" r="4" fill="${W}"/><path d="M34 70c6 6 16 8 26 5" stroke="${W}" stroke-opacity=".7" stroke-width="3" stroke-linecap="round" fill="none"/>
    <circle cx="84" cy="80" r="7" fill="${c}"/><circle cx="82" cy="78" r="2.4" fill="${W}"/><circle cx="12" cy="82" r="4.5" fill="${c}"/><circle cx="11" cy="81" r="1.5" fill="${W}"/>`,
};

// ---- jar emblems: 48x48 ink silhouettes (the web game's glyphs, redrawn at 2x) ----
const INK = P.ink, LT = '#fff6e2';
const EMBLEM = {
  dew: `<path d="M24 5C24 5 11 20 11 29a13 13 0 0 0 26 0C37 20 24 5 24 5Z" fill="${INK}"/><path d="M17 28c-1 4 0 8 3 10" stroke="${LT}" stroke-opacity=".6" stroke-width="2.4" stroke-linecap="round" fill="none"/>`,
  bone: `<g transform="rotate(-35 24 24)" fill="${INK}"><circle cx="10" cy="19" r="6"/><circle cx="10" cy="29" r="6"/><circle cx="38" cy="19" r="6"/><circle cx="38" cy="29" r="6"/><rect x="10" y="19" width="28" height="10"/></g>`,
  newt: `<path d="M3 24C10 12 38 12 45 24 38 36 10 36 3 24Z" fill="${INK}"/><circle cx="24" cy="24" r="8" fill="${LT}" fill-opacity=".85"/><ellipse cx="24" cy="24" rx="2.6" ry="7" fill="${INK}"/>`,
  ember: `<path d="M24 3c2 8 12 12 12 25a12 12 0 0 1-24 0c0-6 4-10 4-16 2 2 4 4 4 8 2-4 4-10 4-17Z" fill="${INK}"/><path d="M24 26c3 4 5 6 4 10a4 4 0 0 1-8 0c0-3 3-5 4-10Z" fill="${LT}" fill-opacity=".6"/>`,
  salt: `<path d="M24 3 38 20 24 45 10 20Z" fill="${INK}"/><path d="M10 20h28M24 3v42" stroke="${LT}" stroke-opacity=".45" stroke-width="2"/>`,
  frost: `<path d="M7 41C7 20 20 8 43 5c0 23-13 36-36 36Z" fill="${INK}"/><path d="M9 39 31 17M19 29v-9M19 29h9" stroke="${LT}" stroke-opacity=".6" stroke-width="2.4" stroke-linecap="round" fill="none"/>`,
  moon: `<path d="M30 5a19 19 0 1 0 13 32A17 17 0 0 1 30 5Z" fill="${INK}"/>`,
  dragon: `<path d="M14 16c8-4 22 0 24 10 2 12-14 20-28 16 10-4 14-12 10-20-2-2-4-4-6-6Z" fill="${INK}"/><path d="M16 16c0-4 2-8 8-11" stroke="${INK}" stroke-width="4" fill="none" stroke-linecap="round"/>`,
  mist: `<circle cx="15" cy="29" r="10" fill="${INK}"/><circle cx="30" cy="23" r="12" fill="${INK}"/><circle cx="28" cy="37" r="8" fill="${INK}"/><circle cx="27" cy="19" r="3" fill="${LT}" fill-opacity=".5"/><circle cx="14" cy="27" r="2" fill="${LT}" fill-opacity=".5"/>`,
  troll: `<path d="M16 7C16 7 7 18 7 25a9 9 0 0 0 18 0C25 18 16 7 16 7Z" fill="${INK}"/><path d="M33 18s-8 9-8 15a8 8 0 0 0 16 0c0-6-8-15-8-15Z" fill="${INK}"/>`,
  star: `<path d="M24 3l6 13 14 1.5-10.500 9.500 3 14L24 34l-12.500 7 3-14L4 17.500 18 16Z" fill="${INK}"/><circle cx="24" cy="23" r="4" fill="${LT}" fill-opacity=".6"/>`,
  gold: `<circle cx="24" cy="24" r="19" fill="${INK}"/><circle cx="24" cy="24" r="12" fill="${LT}" fill-opacity=".4"/><path d="M18 26l-3-5 5 1 4-4 4 4 5-1-3 5Z" fill="${INK}"/>`,
  wyrm: `<path d="M24 5c10 0 18 8 18 18-6-4-12-4-18 0-6-4-12-4-18 0C6 13 14 5 24 5Z" fill="${INK}"/><path d="M6 30c6-4 12-4 18 0 6-4 12-4 18 0-2 8-10 14-18 14S8 38 6 30Z" fill="${INK}"/>`,
  tear: `<path d="M24 43c-8 0-12-6-12-12 0-8 12-25 12-25s12 17 12 25c0 6-4 12-12 12Z" fill="${INK}"/><circle cx="20" cy="31" r="3.200" fill="${LT}" fill-opacity=".55"/>`,
  ash: `<path d="M41 5C20 7 9 22 9 39l-2 4 4-2c17 0 30-13 30-36Z" fill="${INK}"/><path d="M11 39 31 17" stroke="${LT}" stroke-opacity=".55" stroke-width="2.400" stroke-linecap="round"/>`,
  quick: `<path d="M12 20c0-8 8-12 14-10s12 4 12 12-4 8-2 14-6 8-12 6-12-2-12-10 0-6 0-12Z" fill="${INK}"/><path d="M17 20c1-4 5-6 9-5" stroke="${LT}" stroke-opacity=".7" stroke-width="2.600" stroke-linecap="round" fill="none"/><circle cx="41" cy="40" r="3" fill="${INK}"/>`,
};

// ---- bottles: silhouette encodes the operation ------------------------------
// canvas 120x150, neck at top (cork sits on it), flat-ish base at y=146.
export const BOTTLE = {
  round: 'M46 14h28v20c20 8 34 26 34 50 0 34-20 62-48 62S12 118 12 84c0-24 14-42 34-50Z',
  cone: 'M48 14h24v30l34 76c6 14-2 26-17 26H31c-15 0-23-12-17-26l34-76Z',
  tall: 'M48 14h24v14c0 9 24 11 24 30v70c0 11-7 18-18 18H42c-11 0-18-7-18-18V58c0-19 24-21 24-30Z',
  gem: 'M46 14h28v16l28 16c5 3 8 8 8 14v42c0 7-3 12-8 16l-22 20c-5 5-11 8-18 8h-4c-7 0-13-3-18-8l-22-20c-5-4-8-9-8-16V60c0-6 3-11 8-14l28-16Z',
};
export const SHAPE_FOR_OP = { '+': 'round', '-': 'cone', 'x': 'tall', '/': 'gem' };
const LEVEL = { round: 62, cone: 76, tall: 64, gem: 62 };       // liquid surface y
const EMBLEM_AT = { round: [60, 102], cone: [60, 114], tall: [60, 104], gem: [60, 100] }; // emblem centre
const GLOSS = {
  round: 'M27 70c-6 12-6 30 0 44', cone: 'M44 78 27 118', tall: 'M34 62v58', gem: 'M22 64v36',
};

const liquidShape = (s) => { const y = LEVEL[s]; return `M0 ${y}q30-5 60 0t60 0V150H0Z`; };
const glass = (s) => `<path d="${BOTTLE[s]}" fill="#ffffff" fill-opacity=".13"/>`;
const front = (s) => `
  <clipPath id="b"><path d="${BOTTLE[s]}"/></clipPath>
  <g clip-path="url(#b)">
    <rect x="0" y="96" width="120" height="54" fill="url(#sh)"/>
    <path d="M0 ${LEVEL[s]}q30-5 60 0t60 0" stroke="#ffffff" stroke-opacity=".55" stroke-width="2.500" fill="none"/>
    <path d="M70 14v136h50V14Z" fill="${P.night}" fill-opacity=".05"/>
  </g>
  <path d="${BOTTLE[s]}" fill="none" stroke="${P.parchment}" stroke-opacity=".42" stroke-width="2.500" stroke-linejoin="round"/>
  <path d="${GLOSS[s]}" stroke="#ffffff" stroke-opacity=".6" stroke-width="5" fill="none" stroke-linecap="round"/>
  <path d="M52 20v10" stroke="#ffffff" stroke-opacity=".5" stroke-width="3" stroke-linecap="round"/>
  <rect x="41" y="10" width="38" height="9" rx="4.500" fill="${P.parchment}" fill-opacity=".5"/>
  <rect x="41" y="10" width="38" height="4" rx="2" fill="#ffffff" fill-opacity=".35"/>`;
const frontDefs = lin('sh', [[0, P.night, 0], [1, P.night, 0.38]]);

export function buildIngredients() {
  for (const g of INGS) {
    const c = g.color, d = shade(c, 0.4), l = tint(c, 0.55);
    const defs = g.id === 'newt' ? rad('g', [[0, tint(c, .5), .9], [.6, c, 0], [1, shade(c, .5), .7]]) : '';
    out(`ingredients/ingredient_${g.id}.svg`, svg(96, 96, ICON[g.id](c, d, l), defs));
    out(`ingredients/emblem_${g.id}.svg`, svg(48, 48, EMBLEM[g.id]));

    const s = SHAPE_FOR_OP[g.op], [ex, ey] = EMBLEM_AT[s];
    out(`ingredients/jar_${g.id}.svg`, svg(120, 150, `
  ${glass(s)}
  <g clip-path="url(#b)"><path d="${liquidShape(s)}" fill="url(#lq)"/>
    <circle cx="${ex - 22}" cy="${ey + 26}" r="3" fill="#fff" fill-opacity=".35"/><circle cx="${ex + 20}" cy="${ey + 18}" r="2" fill="#fff" fill-opacity=".35"/><circle cx="${ex + 14}" cy="${ey - 26}" r="2.500" fill="#fff" fill-opacity=".3"/>
  </g>
  <g transform="translate(${ex - 21} ${ey - 21}) scale(.875)" opacity=".68">${EMBLEM[g.id]}</g>
  ${front(s)}`, frontDefs + lin('lq', [[0, tint(c, .22)], [.55, c], [1, shade(c, .22)]])));
  }
  for (const s of Object.keys(BOTTLE)) {
    out(`ingredients/bottle_${s}_glass.svg`, svg(120, 150, glass(s)));
    out(`ingredients/bottle_${s}_liquid.svg`, svg(120, 150, `<clipPath id="b"><path d="${BOTTLE[s]}"/></clipPath><path d="${liquidShape(s)}" fill="#ffffff" clip-path="url(#b)"/>`));
    out(`ingredients/bottle_${s}_front.svg`, svg(120, 150, front(s), frontDefs));
  }
  // cork: its own sprite so it can pop off mid-pour. Sits at (42,-12) on the 120x150 bottle canvas.
  out('ingredients/cork.svg', svg(36, 28, `
  <path d="M3 4c0-2 2-3 4-3h22c2 0 4 1 4 3l-3 20c0 2-2 3-4 3H10c-2 0-4-1-4-3Z" fill="${P.cork}"/>
  <path d="M18 1h11c2 0 4 1 4 3l-3 20c0 2-2 3-4 3h-8Z" fill="${P.wood}" fill-opacity=".35"/>
  <path d="M5 6h26" stroke="${P.corkHi}" stroke-width="3" stroke-linecap="round"/>
  <circle cx="12" cy="14" r="1.500" fill="${P.wood}" fill-opacity=".6"/><circle cx="22" cy="19" r="1.200" fill="${P.wood}" fill-opacity=".6"/><circle cx="17" cy="11" r="1" fill="${P.wood}" fill-opacity=".6"/>`));
}
