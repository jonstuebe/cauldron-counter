// Shop interior at night, in parallax layers. Every layer is 1600x900 and is centred on the
// 1280x720 viewport (160px / 90px of bleed on each side for parallax and aspect-expand).
import { P, svg, lin, rad, shade, tint, mix, sparkle, out } from './lib.mjs';

const W = 1600, H = 900;
// deterministic pseudo-random so rebuilds are stable
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

const bottle = (x, y, kind, c) => {
  // silhouettes standing on a shelf whose top is at y
  if (kind === 0) return `<path d="M${x - 5} ${y - 46}h10v10c9 3 13 10 13 18 0 10-7 18-18 18s-18-8-18-18c0-8 4-15 13-18Z" fill="${c}"/>`;
  if (kind === 1) return `<path d="M${x - 4} ${y - 56}h8v14l12 30c2 6-1 12-8 12h-16c-7 0-10-6-8-12l12-30Z" fill="${c}"/>`;
  if (kind === 2) return `<path d="M${x - 5} ${y - 62}h10v10c0 5 9 6 9 14v30c0 5-3 8-8 8h-12c-5 0-8-3-8-8v-30c0-8 9-9 9-14Z" fill="${c}"/>`;
  if (kind === 3) return `<rect x="${x - 15}" y="${y - 34}" width="30" height="34" rx="5" fill="${c}"/><rect x="${x - 17}" y="${y - 40}" width="34" height="8" rx="3" fill="${c}"/>`;
  return `<path d="M${x - 22} ${y}v-44h9v44ZM${x - 11} ${y}v-52h10v52ZM${x + 1} ${y}v-40h8v40ZM${x + 10} ${y}l8-44 9 2-8 42Z" fill="${c}"/>`; // books
};

function shelfRun(x0, x1, y, tone, glowTone) {
  let s = `<rect x="${x0}" y="${y}" width="${x1 - x0}" height="12" rx="3" fill="${P.wood}"/><rect x="${x0}" y="${y}" width="${x1 - x0}" height="4" rx="2" fill="${P.woodHi}"/>
  <rect x="${x0 + 6}" y="${y + 12}" width="${x1 - x0 - 12}" height="10" fill="${P.void}" fill-opacity=".3"/>
  <path d="M${x0 + 26} ${y + 12}v26l-18-26ZM${x1 - 26} ${y + 12}v26l18-26Z" fill="${P.woodLo}"/>`;
  for (let x = x0 + 36; x < x1 - 30; x += 44 + rnd() * 26) {
    const k = Math.floor(rnd() * 5), lit = rnd() < .22;
    s += bottle(Math.round(x), y, k, lit ? glowTone : tone);
    if (lit && k < 3) s += `<circle cx="${Math.round(x)}" cy="${y - 16}" r="5" fill="#fff" fill-opacity=".25"/>`;
  }
  return s;
}

export function buildBackground() {
  // ---- back wall + window ----
  seed = 11;
  let stones = '';
  for (let r = 0; r < 9; r++) for (let x = (r % 2) * -90; x < W; x += 180) {
    if (rnd() < .55) continue;
    stones += `<rect x="${x + 6}" y="${r * 100 + 6}" width="168" height="88" rx="10" fill="${rnd() < .5 ? P.panel : P.night}" fill-opacity="${(.12 + rnd() * .16).toFixed(2)}"/>`;
  }
  let stars = '';
  for (let i = 0; i < 46; i++) { const x = 640 + rnd() * 320, y = 130 + rnd() * 250; stars += rnd() < .2 ? sparkle(Math.round(x), Math.round(y), Math.round(4 + rnd() * 5), P.moonHi, .9) : `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(0.8 + rnd() * 1.4).toFixed(1)}" fill="${P.moonHi}" fill-opacity="${(.4 + rnd() * .5).toFixed(2)}"/>`; }
  const ARCH = 'M640 520V280a160 160 0 0 1 320 0v240Z';
  out('background/bg_back.svg', svg(W, H, `
  <rect width="${W}" height="${H}" fill="url(#wall)"/>
  ${stones}
  <path d="M618 540V280a182 182 0 0 1 364 0v260Z" fill="${P.woodLo}"/>
  <path d="${ARCH}" fill="url(#sky)"/>
  <clipPath id="w"><path d="${ARCH}"/></clipPath>
  <g clip-path="url(#w)">
    ${stars}
    <circle cx="884" cy="226" r="70" fill="url(#moonglow)"/>
    <path d="M896 190a40 40 0 1 0 30 62 33 33 0 0 1-30-62Z" fill="${P.brassHi}"/>
    <path d="M640 520v-58l30-26 26 22v-40l22-30 22 30v54l34-30 30 26v-60h36v52l28-22 28 26v-70l20-36 20 36v60l24-20v86Z" fill="${P.night}"/>
    <rect x="708" y="446" width="8" height="12" fill="${P.flame}" fill-opacity=".8"/><rect x="852" y="470" width="8" height="10" fill="${P.flame}" fill-opacity=".7"/><rect x="930" y="430" width="7" height="11" fill="${P.flame}" fill-opacity=".6"/>
    <path d="M640 120h320v400H640Z" fill="url(#pane)"/>
  </g>
  <path d="M800 120v400M640 300h320M640 410h320" stroke="${P.woodLo}" stroke-width="10"/>
  <path d="M800 120v400M640 300h320M640 410h320" stroke="${P.wood}" stroke-width="3"/>
  <path d="${ARCH}" fill="none" stroke="${P.wood}" stroke-width="12"/>
  <path d="M646 280a154 154 0 0 1 150-154" fill="none" stroke="${P.woodHi}" stroke-width="3" stroke-linecap="round"/>
  <rect x="600" y="520" width="400" height="26" rx="6" fill="${P.wood}"/><rect x="600" y="520" width="400" height="8" rx="4" fill="${P.woodHi}"/>
  <rect x="610" y="546" width="380" height="12" fill="${P.void}" fill-opacity=".35"/>
  <rect width="${W}" height="${H}" fill="url(#floorfade)"/>`,
    lin('wall', [[0, '#1a1429'], [.5, P.dusk], [1, '#231b38']]) +
    lin('sky', [[0, '#0d0a1c'], [.6, '#241c48'], [1, '#3a2f66']]) +
    rad('moonglow', [[0, P.moon, .35], [1, P.moon, 0]]) +
    lin('pane', [[0, '#fff', .07], [.5, '#fff', 0], [1, '#fff', .04]], 0, 0, 1, 1) +
    lin('floorfade', [[0, P.void, .35], [.25, P.void, 0], [.8, P.void, 0], [1, P.void, .45]])));

  // ---- shelves, beam, hanging herbs ----
  seed = 23;
  const tone = '#3a3058', tone2 = '#453a68', glowTone = mix(P.mintLo, P.dusk, .45);
  const herb = (x, y, c) => `<path d="M${x} ${y}v34" stroke="${P.cork}" stroke-width="3"/><path d="M${x} ${y + 30}c-16 14-20 44-12 70 4-10 8-16 12-20 4 4 8 10 12 20 8-26 4-56-12-70Z" fill="${c}"/><path d="M${x} ${y + 34}v52" stroke="${P.night}" stroke-opacity=".35" stroke-width="2"/><path d="M${x - 7} ${y + 30}h14" stroke="${P.brass}" stroke-width="4" stroke-linecap="round"/>`;
  out('background/bg_shelves.svg', svg(W, H, `
  <rect x="0" y="96" width="${W}" height="44" fill="${P.woodLo}"/><rect x="0" y="96" width="${W}" height="10" fill="${P.wood}"/><rect x="0" y="140" width="${W}" height="16" fill="${P.void}" fill-opacity=".35"/>
  ${[90, 420, 1180, 1510].map((x) => `<rect x="${x - 16}" y="88" width="32" height="60" rx="4" fill="${P.wood}"/><rect x="${x - 16}" y="88" width="10" height="60" rx="4" fill="${P.woodHi}"/>`).join('')}
  ${shelfRun(60, 540, 330, tone, glowTone)}${shelfRun(60, 540, 500, tone2, glowTone)}
  ${shelfRun(1060, 1540, 330, tone, glowTone)}${shelfRun(1060, 1540, 500, tone2, glowTone)}
  ${herb(400, 140, '#4a6a52')}${herb(450, 140, '#6a5a7a')}${herb(505, 140, '#4a6a52')}
  ${herb(1095, 140, '#6a5a7a')}${herb(1150, 140, '#4a6a52')}${herb(1200, 140, '#7a5a4a')}
  <path d="M0 96l70 0c-8 40-34 66-70 74Z" fill="${P.lilac}" fill-opacity=".07"/><path d="M0 110c30 4 50 20 62 44M0 130c20 4 32 12 40 26M8 100l40 60" stroke="${P.lilac}" stroke-opacity=".18" stroke-width="1.500" fill="none"/>`));

  // ---- mid: lanterns, their light, a ladle rack ----
  const lantern = (x, y) => `
  <path d="M${x} 140V${y - 44}" stroke="${P.iron}" stroke-width="4" stroke-dasharray="7 4"/>
  <circle cx="${x}" cy="${y}" r="120" fill="url(#lg)"/>
  <path d="M${x - 16} ${y - 44}h32l8 12h-48Z" fill="${P.brassLo}"/>
  <path d="M${x - 22} ${y - 32}h44l-5 62h-34Z" fill="${P.flame}" fill-opacity=".85"/>
  <path d="M${x - 8} ${y + 22}c-8-12 0-20 4-30 2 8 8 10 8 18 4-6 4-12 2-18 8 8 10 20 2 30Z" fill="${P.flameHi}"/>
  <path d="M${x - 22} ${y - 32}h44M${x - 17} ${y + 30}h34M${x} ${y - 32}v62M${x - 22} ${y - 32}l5 62M${x + 22} ${y - 32}l-5 62" stroke="${P.brassLo}" stroke-width="4" stroke-linecap="round"/>
  <path d="M${x - 20} ${y + 30}h40l-6 12h-28Z" fill="${P.brassLo}"/><circle cx="${x}" cy="${y - 50}" r="6" fill="none" stroke="${P.brassLo}" stroke-width="3.500"/>`;
  out('background/bg_mid.svg', svg(W, H, `${lantern(600, 226)}${lantern(1000, 262)}`, rad('lg', [[0, P.flame, .34], [.5, P.ember, .1], [1, P.ember, 0]])));

  // ---- foreground counter with a stone hearth slab in the middle ----
  seed = 5;
  let grain = '';
  for (let i = 0; i < 26; i++) { const x = rnd() * W, y = 812 + rnd() * 80, l = 40 + rnd() * 120; grain += `<path d="M${x.toFixed(0)} ${y.toFixed(0)}h${l.toFixed(0)}" stroke="${P.woodLo}" stroke-opacity=".6" stroke-width="2" stroke-linecap="round"/>`; }
  let planks = ''; for (let x = 100; x < W; x += 200) planks += `<path d="M${x} 806v94" stroke="${P.woodLo}" stroke-width="3"/>`;
  out('background/bg_counter.svg', svg(W, H, `
  <rect x="0" y="752" width="${W}" height="24" fill="${P.void}" fill-opacity=".35"/>
  <path d="M0 772h${W}v36H0Z" fill="${P.woodHi}"/><path d="M0 772h${W}v7H0Z" fill="${P.cork}"/>
  <path d="M0 808h${W}v92H0Z" fill="url(#front)"/><path d="M0 808h${W}v10H0Z" fill="${P.void}" fill-opacity=".4"/>
  ${planks}${grain}
  <path d="M560 772l24-18h432l24 18v20H560Z" fill="#4a4460"/><path d="M584 754h432l24 18H560Z" fill="#5d5676"/>
  <path d="M560 772h480v20H560Z" fill="#3a3450"/><path d="M640 772v20M760 772v20M880 772v20M960 772v20M700 754l-10 18M820 754v18M930 754l8 18" stroke="${P.night}" stroke-opacity=".5" stroke-width="2.500"/>
  <ellipse cx="800" cy="764" rx="170" ry="9" fill="${P.ember}" fill-opacity=".28"/>`,
    lin('front', [[0, P.wood], [1, P.woodLo]])));

  // ---- light: warm pool behind the cauldron (additive) and a corner vignette (normal blend) ----
  out('background/bg_glow.svg', svg(W, H, `<ellipse cx="800" cy="520" rx="560" ry="400" fill="url(#g)"/>`, rad('g', [[0, P.ember, .30], [.45, P.coal, .1], [1, P.coal, 0]])));
  out('background/bg_vignette.svg', svg(W, H, `<rect width="${W}" height="${H}" fill="url(#v)"/>`, rad('v', [[0, P.void, 0], [.62, P.void, 0], [1, P.void, .62]], .5, .5, .72)));
}
