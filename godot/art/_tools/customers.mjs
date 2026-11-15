// Customer busts, 256x256, three moods each. Order matches CUSTOMERS in src/data.js.
import { P, svg, shade, tint, mix, out } from './lib.mjs';

const INK = P.inkSoft, HAIR_DARK = '#231b2e', GREY = '#d8d2de';
export const MOODS = ['neutral', 'happy', 'upset'];

// ---- shared anatomy ---------------------------------------------------------
const shoulders = (c, k = 1) => {
  const g = k === 1 ? '' : ` transform="translate(${128 * (1 - k)} ${262 * (1 - k)}) scale(${k})"`;
  return `<g${g}><path d="M22 262C26 214 70 186 128 186s102 28 106 76Z" fill="${c}"/>
  <path d="M128 186c58 0 102 28 106 76h-70c14-26 4-58-36-76Z" fill="${P.night}" fill-opacity=".2"/></g>`;
};
const neck = (skin) => `<path d="M108 158h40v30c-12 12-28 12-40 0Z" fill="${mix(skin, '#7a3f3a', .28)}"/>`;
const head = (skin) => `
  <ellipse cx="128" cy="118" rx="49" ry="51" fill="${skin}"/>
  <path d="M128 67c30 0 49 24 49 51 0 28-21 51-49 51 22-8 34-27 34-51s-12-43-34-51Z" fill="${shade(skin, .3)}" fill-opacity=".5"/>
  <path d="M90 92c4-10 12-17 22-20" stroke="#fff6e2" stroke-opacity=".35" stroke-width="5" fill="none" stroke-linecap="round"/>`;
const ears = (skin) => `<circle cx="80" cy="124" r="10" fill="${skin}"/><circle cx="176" cy="124" r="10" fill="${shade(skin, .18)}"/>`;
const cheeks = (op = .3) => `<ellipse cx="98" cy="138" rx="10" ry="6.500" fill="${P.danger}" fill-opacity="${op}"/><ellipse cx="158" cy="138" rx="10" ry="6.500" fill="${P.danger}" fill-opacity="${op}"/>`;
const nose = (skin) => `<path d="M122 130q6 6 12 0" stroke="${shade(skin, .4)}" stroke-width="3.500" fill="none" stroke-linecap="round"/>`;

const eye = (x, y, r = 1) => `<ellipse cx="${x}" cy="${y}" rx="${5.5 * r}" ry="${6.8 * r}" fill="${INK}"/><circle cx="${x - 1.8 * r}" cy="${y - 2.6 * r}" r="${2 * r}" fill="#fff"/>`;
const eyes = (mood, o = {}) => {
  const r = o.eye || 1, lx = 108, rx = 148, y = 118;
  let s = '';
  if (mood === 'happy') s = `<path d="M${lx - 8} ${y + 2}q8-11 16 0M${rx - 8} ${y + 2}q8-11 16 0" stroke="${INK}" stroke-width="4.500" fill="none" stroke-linecap="round"/>`;
  else s = (o.patch ? '' : eye(rx, y, r)) + eye(lx, y, r);
  if (o.patch) s = s.replace(`M${rx - 8} ${y + 2}q8-11 16 0`, '');
  const bc = o.brow || INK, bw = o.browW || 4.5;
  if (mood === 'upset') s += `<path d="M${lx - 11} ${y - 17}l19 7M${rx + 11} ${y - 17}l-19 7" stroke="${bc}" stroke-width="${bw}" stroke-linecap="round"/>`;
  else if (o.worried) s += `<path d="M${lx - 10} ${y - 12}l17-6M${rx + 10} ${y - 12}l-17-6" stroke="${bc}" stroke-width="${bw}" stroke-linecap="round"/>`;
  else if (o.brow) s += `<path d="M${lx - 10} ${y - 15}q9-5 18 0M${rx - 8} ${y - 15}q9-5 18 0" stroke="${bc}" stroke-width="${bw}" stroke-linecap="round" fill="none"/>`;
  else if (mood === 'happy') s += `<path d="M${lx - 9} ${y - 16}q8-4 16 0M${rx - 7} ${y - 16}q8-4 16 0" stroke="${INK}" stroke-opacity=".55" stroke-width="3" stroke-linecap="round" fill="none"/>`;
  return s;
};
const mouth = (mood, o = {}) => {
  const y = o.mouthY || 147;
  if (mood === 'happy') return `<path d="M112 ${y - 5}q16 5 32 0c0 12-7 19-16 19s-16-7-16-19Z" fill="#3a1f2b"/><path d="M119 ${y + 8}q9-6 18 0c-2 4-5 6-9 6s-7-2-9-6Z" fill="${P.danger}"/>${o.gap ? `<path d="M121 ${y - 3.500}h6v5h-6ZM129 ${y - 3.500}h6v5h-6Z" fill="#fff"/>` : `<path d="M116 ${y - 4}q12 3.500 24 0v3q-12 3-24 0Z" fill="#fff" fill-opacity=".9"/>`}`;
  if (mood === 'upset') return o.wobble
    ? `<path d="M112 ${y + 3}q4-6 8 0t8 0 8 0 8 0" stroke="${INK}" stroke-width="4" fill="none" stroke-linecap="round"/>`
    : `<path d="M114 ${y + 6}q14-13 28 0" stroke="${INK}" stroke-width="4.500" fill="none" stroke-linecap="round"/>`;
  return o.smirk
    ? `<path d="M116 ${y}q12 6 26-4" stroke="${INK}" stroke-width="4" fill="none" stroke-linecap="round"/>`
    : `<path d="M116 ${y - 1}q12 6 24 0" stroke="${INK}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
};

// ---- the cast ---------------------------------------------------------------
// Each entry: colours from data.js plus layers: back (behind head), torso (over shoulders),
// face (over skin, under mouth), front (hat, hair, props over everything).
const CAST = [
  { id: 'wren', skin: '#e8b892', cloak: '#3f7a6a', hat: '#7a4a2a',
    back: (c) => `<ellipse cx="128" cy="112" rx="54" ry="50" fill="#5a3a2a"/>`,
    torso: (c) => `<path d="M100 190q28 22 56 0l8 10q-36 30-72 0Z" fill="${tint(c.cloak, .25)}"/>
      <path d="M64 204l22-12 96 70h-40Z" fill="#b89a5a"/><path d="M64 204l22-12 8 6-22 12Z" fill="#fff6e2" fill-opacity=".25"/>
      <rect x="112" y="222" width="20" height="16" rx="3" transform="rotate(36 122 230)" fill="none" stroke="${P.brassHi}" stroke-width="4"/>`,
    front: (c) => `<g transform="translate(0 -17)"><path d="M78 102c-4-40 20-58 50-58s54 18 50 58Z" fill="${c.hat}"/>
      <path d="M128 44c30 0 54 18 50 58h-22c4-28-6-50-28-58Z" fill="${P.night}" fill-opacity=".22"/>
      <path d="M76 96h104v11H76Z" fill="${shade(c.hat, .35)}"/>
      <path d="M72 104q56-16 112 0c-10 14-34 20-56 20s-46-6-56-20Z" fill="${shade(c.hat, .2)}"/>
      <path d="M80 104q48-10 96 0" stroke="${tint(c.hat, .3)}" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M168 86c8-30 24-46 46-54 0 26-12 48-36 62Z" fill="${P.parchment}"/><path d="M170 90 208 40" stroke="${P.parchmentEdge}" stroke-width="2.500" stroke-linecap="round"/>
      <path d="M190 52l10 2M184 62l12 3M178 72l12 4" stroke="${P.parchmentEdge}" stroke-width="2" stroke-linecap="round"/>
      <circle cx="128" cy="101" r="5" fill="${P.brassHi}"/></g>` },
  { id: 'marrow', skin: '#c99272', cloak: '#5a4a7a', opts: { brow: GREY, browW: 7 },
    back: (c) => `<path d="M58 156C44 92 76 38 128 38s84 54 70 118c-6 30-28 44-70 44s-64-14-70-44Z" fill="${c.cloak}"/>
      <ellipse cx="128" cy="122" rx="57" ry="62" fill="${shade(c.cloak, .55)}"/>`,
    face: (c) => `<path d="M82 138c0 40 18 74 46 84 28-10 46-44 46-84-8 14-24 20-46 20s-38-6-46-20Z" fill="${GREY}"/>
      <path d="M128 222c28-10 46-44 46-84-4 8-10 13-18 16 0 30-10 54-28 68Z" fill="${P.lilac}" fill-opacity=".5"/>
      <path d="M100 176q4 14 10 22M128 180v26M156 176q-4 14-10 22" stroke="${P.lilac}" stroke-width="3" stroke-linecap="round" fill="none"/>
      <path d="M128 136c-10-6-26-2-30 10 10 4 22 2 30-4 8 6 20 8 30 4-4-12-20-16-30-10Z" fill="#f1eef4"/>`,
    front: (c) => `<path d="M70 110c2-46 28-64 58-64s56 18 58 64c-14-26-34-36-58-36s-44 10-58 36Z" fill="${c.cloak}"/>
      <path d="M128 46c30 0 56 18 58 64-10-18-22-28-36-33 0-12-8-24-22-31Z" fill="${P.night}" fill-opacity=".22"/>
      <path d="M84 84c8-16 22-26 40-28" stroke="${tint(c.cloak, .3)}" stroke-width="4" fill="none" stroke-linecap="round"/>`,
    opts2: { mouthY: 150 } },
  { id: 'pell', skin: '#f0cfb0', cloak: '#2f3d66', hat: '#1f2a4a',
    back: (c) => `<path d="M72 156c-10-62 16-98 56-98s66 36 56 98c-4 12-108 12-112 0Z" fill="${HAIR_DARK}"/>`,
    torso: (c) => `<path d="M92 188q36 30 72 0l10 14q-46 34-92 0Z" fill="${P.parchment}"/><path d="M128 210l-8 12 8 12 8-12Z" fill="${P.brass}"/>`,
    face: () => `<circle cx="108" cy="118" r="15" fill="#fff" fill-opacity=".14" stroke="${P.brass}" stroke-width="3.500"/><circle cx="148" cy="118" r="15" fill="#fff" fill-opacity=".14" stroke="${P.brass}" stroke-width="3.500"/><path d="M123 116q5-4 10 0" stroke="${P.brass}" stroke-width="3.500" fill="none"/>`,
    front: (c) => `<path d="M80 100q48-18 96 0-8-14-24-18H104q-16 4-24 18Z" fill="${HAIR_DARK}"/>
      <path d="M84 84C96 50 118 18 156 2c-4 30 12 56 20 82Z" fill="${c.hat}"/>
      <path d="M156 2c-4 30 12 56 20 82h-30c2-30 0-58 10-82Z" fill="${P.night}" fill-opacity=".35"/>
      <ellipse cx="128" cy="86" rx="80" ry="15" fill="${c.hat}"/><path d="M48 86a80 15 0 0 0 160 0 80 12 0 0 1-160 0Z" fill="${P.night}" fill-opacity=".35"/>
      <path d="M88 72q40 12 84 0l3 10q-46 12-90 0Z" fill="${P.brass}"/><rect x="118" y="68" width="20" height="18" rx="3" fill="none" stroke="${P.brassHi}" stroke-width="4"/>
      <path d="M100 56c6-12 14-22 24-30" stroke="${tint(c.hat, .25)}" stroke-width="4" fill="none" stroke-linecap="round"/>` },
  { id: 'tobble', skin: '#a8d08a', cloak: '#8a5a2a', hat: '#3a5a2a', opts: { smirk: true },
    back: (c) => `<path d="M86 104 22 84l56 60Z" fill="${c.skin}"/><path d="M82 112 40 96l40 36Z" fill="${shade(c.skin, .35)}"/>
      <path d="M170 104l64-20-56 60Z" fill="${shade(c.skin, .15)}"/><path d="M174 112l42-16-40 36Z" fill="${shade(c.skin, .4)}"/>`,
    torso: (c) => `<path d="M96 190q32 26 64 0l6 12q-38 28-76 0Z" fill="${shade(c.cloak, .3)}"/>
      <rect x="150" y="214" width="26" height="24" rx="3" fill="${tint(c.cloak, .3)}"/><path d="M154 220h18M154 232h18M156 216v20M170 216v20" stroke="${P.parchment}" stroke-opacity=".7" stroke-width="2" stroke-dasharray="3 3"/>`,
    face: (c) => `<ellipse cx="128" cy="132" rx="11" ry="8" fill="${shade(c.skin, .25)}"/><circle cx="124" cy="129" r="2.500" fill="#fff" fill-opacity=".35"/>
      <circle cx="92" cy="104" r="3" fill="${shade(c.skin, .3)}"/><circle cx="164" cy="150" r="2.500" fill="${shade(c.skin, .3)}"/>`,
    front: (c) => `<path d="M90 86l8-30 14 20 14-34 12 32 16-22 6 34q-34-16-70 0Z" fill="${c.hat}"/>
      <path d="M126 42l12 32 16-22 6 34q-16-8-34-10Z" fill="${P.night}" fill-opacity=".25"/>`,
    extra: (mood) => mood === 'happy' ? '' : `<path d="M133 ${mood === 'upset' ? 147 : 150}l4 9 4-10Z" fill="#fff"/>` },
  { id: 'isolde', skin: '#8a5a3c', cloak: '#9a2f2f', hat: '#c9a24a', opts: { patch: true },
    back: (c) => [[76, 108, 20], [70, 134, 18], [78, 158, 16], [180, 108, 20], [186, 134, 18], [178, 158, 16], [128, 84, 30]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${HAIR_DARK}"/>`).join(''),
    torso: (c) => `<path d="M128 262l-34-66 12-8 22 30 22-30 12 8Z" fill="${shade(c.cloak, .35)}"/><path d="M106 190l22 28 22-28q-22 14-44 0Z" fill="${P.parchment}"/>
      <ellipse cx="56" cy="214" rx="30" ry="13" transform="rotate(-24 56 214)" fill="${c.hat}"/><ellipse cx="200" cy="214" rx="30" ry="13" transform="rotate(24 200 214)" fill="${shade(c.hat, .2)}"/>
      <path d="M34 226l-4 14M46 232l-3 14M58 234v14M222 226l4 14M210 232l3 14M198 234v14" stroke="${c.hat}" stroke-width="5" stroke-linecap="round"/>
      <circle cx="110" cy="240" r="5" fill="${P.brassHi}"/><circle cx="146" cy="240" r="5" fill="${P.brassHi}"/>`,
    face: (c) => `<path d="M82 92 176 124" stroke="${P.ink}" stroke-width="4"/><path d="M134 110q14-8 28 2 2 14-12 20-14-4-16-22Z" fill="${P.ink}"/>
      <circle cx="80" cy="140" r="6" fill="none" stroke="${P.brassHi}" stroke-width="3.500"/>
      <path d="M92 132l10 8" stroke="${shade(c.skin, .4)}" stroke-width="3" stroke-linecap="round"/>`,
    front: (c) => `<path d="M94 70c2-30 66-30 68 0Z" fill="#43346a"/>
      <path d="M44 92C70 66 98 56 128 56s58 10 84 36c-26-10-54-14-84-14s-58 4-84 14Z" fill="#43346a"/>
      <path d="M44 92c26-10 54-14 84-14s58 4 84 14" stroke="${c.hat}" stroke-width="7" fill="none" stroke-linecap="round"/>
      <circle cx="128" cy="66" r="10" fill="${c.hat}"/><circle cx="128" cy="66" r="4.500" fill="${P.coal}"/>
      <path d="M100 58c6-8 14-12 24-13" stroke="#fff6e2" stroke-opacity=".25" stroke-width="4" fill="none" stroke-linecap="round"/>` },
  { id: 'fennick', skin: '#e0a888', cloak: '#6a7a3a', hat: '#d06a2a', opts: { smirk: true },
    back: (c) => `<ellipse cx="128" cy="110" rx="56" ry="52" fill="${shade(c.hat, .25)}"/>`,
    torso: (c) => `<path d="M82 190q46 30 92 0l6 20q-52 32-104 0Z" fill="${P.brass}"/><path d="M128 205c20 0 36-6 46-15l6 20c-14 8-32 13-52 13Z" fill="${P.brassLo}" fill-opacity=".5"/>
      <path d="M150 214l10 44h-26l4-40Z" fill="${P.brass}"/><path d="M140 250h18M142 240h14" stroke="${P.brassLo}" stroke-width="3"/>`,
    face: (c) => [[92, 128], [100, 133], [94, 138], [156, 133], [164, 128], [162, 138]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.800" fill="${shade(c.hat, .1)}" fill-opacity=".8"/>`).join(''),
    front: (c) => `<path d="M76 118c-10-48 18-74 54-74 34 0 60 26 50 74-6-20-16-30-30-34-18 16-44 18-64 12-4 8-8 14-10 22Z" fill="${c.hat}"/>
      <path d="M130 44c34 0 60 26 50 74-6-20-16-30-30-34 4-16-4-32-20-40Z" fill="${P.night}" fill-opacity=".2"/>
      <path d="M120 46c-6-14 2-24 14-28-4 10 0 18 8 26Z" fill="${c.hat}"/>
      <path d="M92 72c8-10 20-16 34-16" stroke="${tint(c.hat, .45)}" stroke-width="4.500" fill="none" stroke-linecap="round"/>`,
    browFor: (mood) => mood === 'neutral' ? `<path d="M98 104q9-5 18 0M140 98q9-6 18-1" stroke="${shade('#d06a2a', .3)}" stroke-width="4.500" stroke-linecap="round" fill="none"/>` : '' },
  { id: 'mags', skin: '#d9a07c', cloak: '#b89a5a',
    back: (c) => `<path d="M58 152C46 92 78 42 128 42s82 50 70 110c-6 28-28 42-70 42s-64-14-70-42Z" fill="${c.cloak}"/>
      <ellipse cx="128" cy="122" rx="56" ry="60" fill="${shade(c.cloak, .5)}"/>`,
    torso: (c) => `<path d="M94 262l6-58h56l6 58Z" fill="${P.parchment}"/><path d="M128 204h28l6 58h-34Z" fill="${P.parchmentLo}"/>
      <path d="M100 206 84 190M156 206l16-16" stroke="${P.parchment}" stroke-width="7" stroke-linecap="round"/>
      <path d="M112 196q16 12 32 0l-6 14h-20Z" fill="${shade(c.cloak, .25)}"/>
      <path d="M110 232c6-4 10 2 6 6M144 240c5-2 7 3 3 5" stroke="${P.parchmentEdge}" stroke-width="3" fill="none" stroke-linecap="round"/>`,
    face: (c) => `<ellipse cx="160" cy="130" rx="11" ry="6" transform="rotate(-20 160 130)" fill="#fff" fill-opacity=".75"/><circle cx="148" cy="96" r="4" fill="#fff" fill-opacity=".6"/>`,
    front: (c) => `<path d="M70 112c2-46 28-62 58-62s56 16 58 62c-14-24-34-34-58-34s-44 10-58 34Z" fill="${c.cloak}"/>
      <path d="M128 50c30 0 56 16 58 62-10-16-22-26-36-31 0-12-8-24-22-31Z" fill="${P.night}" fill-opacity=".2"/>
      <path d="M88 100q20-22 44-20 24-2 40 20-18-12-40-12t-44 12Z" fill="#8a6a52"/>
      <path d="M84 86c8-14 20-22 36-25" stroke="${tint(c.cloak, .45)}" stroke-width="4" fill="none" stroke-linecap="round"/>
      <ellipse cx="96" cy="66" rx="9" ry="4" transform="rotate(-30 96 66)" fill="#fff" fill-opacity=".6"/>`,
    cheek: .5 },
  { id: 'knight', skin: '#f2c9a8', cloak: '#7a8a9a', hat: '#a9b4c0', opts: { worried: true, wobble: true },
    back: (c) => `<path d="M128 44c-12-30 20-46 50-34-16 8-24 22-26 40Z" fill="${P.coal}"/><path d="M152 50c2-18 10-32 26-40-8 14-10 26-10 42Z" fill="${P.night}" fill-opacity=".25"/>`,
    torso: (c) => `<path d="M88 192q40 28 80 0l8 16q-48 30-96 0Z" fill="${c.hat}"/><path d="M128 208c16 0 30-6 40-16l8 16c-12 9-30 14-48 14Z" fill="${P.night}" fill-opacity=".25"/>
      <ellipse cx="52" cy="226" rx="34" ry="24" fill="${c.hat}"/><ellipse cx="204" cy="226" rx="34" ry="24" fill="${shade(c.hat, .25)}"/>
      <path d="M30 216c6-8 16-12 26-12" stroke="#fff" stroke-opacity=".6" stroke-width="4" fill="none" stroke-linecap="round"/>
      <circle cx="128" cy="240" r="6" fill="${P.brass}"/>`,
    front: (c) => `<path d="M74 124c-6-52 20-80 54-80s60 28 54 80v30c0 12-12 16-20 8v-56q-34-14-68 0v56c-8 8-20 4-20-8Z" fill="${c.hat}"/>
      <path d="M128 44c34 0 60 28 54 80v30c0 12-12 16-20 8v-56c-10-4-22-6-34-6Z" fill="${P.night}" fill-opacity=".25"/>
      <path d="M82 100q46-30 92 0V78q-46-30-92 0Z" fill="${shade(c.hat, .3)}"/>
      <path d="M96 84q32-14 64 0M100 94q28-10 56 0" stroke="${P.ink}" stroke-opacity=".7" stroke-width="3" fill="none" stroke-linecap="round"/>
      <circle cx="84" cy="104" r="5" fill="${P.brass}"/><circle cx="172" cy="104" r="5" fill="${P.brassLo}"/>
      <path d="M86 78c6-14 18-24 32-27" stroke="#fff" stroke-opacity=".65" stroke-width="4.500" fill="none" stroke-linecap="round"/>`,
    extra: (mood) => mood === 'happy' ? '' : `<path d="M170 122c0 0-7 9-7 14a7 7 0 0 0 14 0c0-5-7-14-7-14Z" fill="#9fd6ee"/><circle cx="168" cy="136" r="1.800" fill="#fff"/>` },
  { id: 'hask', skin: '#e6c2a2', cloak: '#4a2f4a', hat: '#3b2742', opts: { eye: .8, brow: GREY, browW: 5 },
    back: (c) => `<ellipse cx="128" cy="116" rx="56" ry="50" fill="${GREY}"/><circle cx="72" cy="132" r="19" fill="${GREY}"/><circle cx="184" cy="132" r="19" fill="${shade(GREY, .2)}"/>
      <path d="M62 128q10-8 20 0M174 128q10-8 20 0" stroke="${P.lilac}" stroke-width="3" fill="none" stroke-linecap="round"/>`,
    torso: (c) => `<path d="M34 262c8-40 44-70 94-52 50-18 86 12 94 52Z" fill="${shade(c.cloak, .3)}"/>
      <path d="M52 250l8-10 8 10 8-10 8 10M172 250l8-10 8 10 8-10 8 10" stroke="${tint(c.cloak, .3)}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="128" cy="214" r="11" fill="${P.brass}"/><circle cx="128" cy="214" r="6.500" fill="${P.mint}"/><circle cx="126" cy="212" r="2" fill="#fff"/>`,
    face: (c) => `<path d="M90 126l-8 4M90 132l-7 7M166 126l8 4M166 132l7 7M112 100q16-5 32 0" stroke="${shade(c.skin, .35)}" stroke-width="2.500" fill="none" stroke-linecap="round"/>
      <circle cx="150" cy="152" r="3.500" fill="${shade(c.skin, .5)}"/>`,
    front: (c) => `<path d="M82 86c8-30 22-52 44-64 16-8 38-4 54-16-4 18-18 24-24 36 8 14 16 28 18 44Z" fill="${c.hat}"/>
      <path d="M156 42c8 14 16 28 18 44h-34c6-14 10-28 16-44Z" fill="#000" fill-opacity=".3"/>
      <ellipse cx="128" cy="88" rx="82" ry="15" fill="${c.hat}"/><path d="M46 88a82 15 0 0 0 164 0 82 12 0 0 1-164 0Z" fill="#000" fill-opacity=".3"/>
      <path d="M86 74q42 12 86 0l3 10q-46 12-92 0Z" fill="${tint(c.cloak, .2)}"/>
      <rect x="104" y="40" width="20" height="18" rx="2" transform="rotate(-14 114 49)" fill="${P.mintLo}"/><path d="M103 46l4-6M124 40l3 5M108 60l-4-4M127 54l-3 5" stroke="${P.parchment}" stroke-width="2" stroke-linecap="round"/>
      <path d="M98 66c6-14 14-24 26-32" stroke="#fff6e2" stroke-opacity=".2" stroke-width="4" fill="none" stroke-linecap="round"/>` },
  { id: 'pim', skin: '#f5d0b0', cloak: '#d07a9a', hat: '#5a3a2a', opts: { eye: 1.25, gap: true }, body: .82,
    back: (c) => `<circle cx="58" cy="126" r="24" fill="${c.hat}"/><circle cx="198" cy="126" r="24" fill="${shade(c.hat, .25)}"/><ellipse cx="128" cy="110" rx="56" ry="52" fill="${c.hat}"/>
      <path d="M68 104l-16-12v24ZM68 104l12-14v28Z" fill="${P.mint}"/><path d="M188 104l16-12v24ZM188 104l-12-14v28Z" fill="${P.mintLo}"/>`,
    torso: (c) => `<path d="M94 196q34 26 68 0l10 12q-22 20-44 6-22 14-44-6Z" fill="${P.parchment}"/><circle cx="128" cy="232" r="5" fill="${P.parchment}"/>`,
    face: (c) => [[94, 132], [102, 136], [154, 136], [162, 132], [128, 126]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.800" fill="${shade(c.skin, .45)}" fill-opacity=".7"/>`).join(''),
    front: (c) => `<path d="M78 112c-6-42 18-66 50-66s56 24 50 66c-8-16-18-24-30-26-4 8-12 12-22 12 4-4 6-8 6-12-18 2-40 8-54 26Z" fill="${c.hat}"/>
      <path d="M128 46c32 0 56 24 50 66-8-16-18-24-30-26 2-16-6-32-20-40Z" fill="${P.night}" fill-opacity=".2"/>
      <path d="M92 76c8-10 18-16 30-17" stroke="${tint(c.hat, .35)}" stroke-width="4.500" fill="none" stroke-linecap="round"/>` },
];
export const CAST_IDS = CAST.map((c) => c.id);

export function buildCustomers() {
  CAST.forEach((c, i) => {
    const o = { ...(c.opts || {}), ...(c.opts2 || {}) };
    for (const mood of MOODS) {
      const m = mood === 'happy' ? Math.max(.45, c.cheek || 0) : (c.cheek || .28);
      let brows = c.browFor ? c.browFor(mood) : '';
      const body = `
  ${c.back ? c.back(c) : ''}
  ${shoulders(c.cloak, c.body || 1)}${neck(c.skin)}
  ${c.torso ? c.torso(c) : ''}
  ${c.id === 'tobble' ? '' : ears(c.skin)}${head(c.skin)}${cheeks(m)}
  ${c.face ? c.face(c) : ''}
  ${c.id === 'tobble' ? '' : nose(c.skin)}${eyes(mood, o)}${brows}${mouth(mood, o)}${c.extra ? c.extra(mood) : ''}
  ${c.front ? c.front(c) : ''}`;
      out(`customers/customer_${i}_${c.id}_${mood}.svg`, svg(256, 256, `<clipPath id="f"><rect width="256" height="256"/></clipPath><g clip-path="url(#f)">${body}</g>`));
    }
  });
}
