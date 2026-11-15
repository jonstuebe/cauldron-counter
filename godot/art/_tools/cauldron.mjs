// Cauldron (stacked 520x460 layers = 2x the web game's 260x230 pot), fire and particle sprites.
import { P, svg, lin, rad, shade, tint, sparkle, out } from './lib.mjs';

const BELLY = 'M60 152C44 300 108 390 260 390s216-90 200-238Z';
const W = '#ffffff';

export function buildCauldron() {
  // -- body: legs, handles, belly, back of the rim and the dark mouth
  const rivets = Array.from({ length: 9 }, (_, i) => { const t = (i + .5) / 9, x = 74 + t * 372, y = 184 + Math.sin(t * Math.PI) * 26; return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.500" fill="${P.ironRim}"/><circle cx="${(x - 1.2).toFixed(1)}" cy="${(y - 1.4).toFixed(1)}" r="1.600" fill="${P.lilac}" fill-opacity=".6"/>`; }).join('');
  out('cauldron/cauldron_body.svg', svg(520, 460, `
  <path d="M132 346 104 428" stroke="${P.iron}" stroke-width="24" stroke-linecap="round"/><path d="M388 346l28 82" stroke="${P.void}" stroke-width="24" stroke-linecap="round"/>
  <path d="M126 356 106 420" stroke="${P.ironRim}" stroke-width="5" stroke-linecap="round"/>
  <path d="M88 428h34M398 428h34" stroke="${P.iron}" stroke-width="14" stroke-linecap="round"/>
  <circle cx="50" cy="200" r="24" fill="none" stroke="${P.ironHi}" stroke-width="13"/><path d="M30 186a24 24 0 0 1 22-10" stroke="${P.panelLine}" stroke-width="4" fill="none" stroke-linecap="round"/>
  <circle cx="470" cy="200" r="24" fill="none" stroke="${P.iron}" stroke-width="13"/>
  <path d="${BELLY}" fill="url(#belly)"/>
  <clipPath id="b"><path d="${BELLY}"/></clipPath>
  <g clip-path="url(#b)">
    <ellipse cx="260" cy="420" rx="230" ry="120" fill="url(#under)"/>
    <path d="M330 152c40 60 40 170-30 240h170V152Z" fill="${P.void}" fill-opacity=".35"/>
    <path d="M62 178c60 34 336 34 396 0" stroke="${P.void}" stroke-opacity=".55" stroke-width="20" fill="none"/>
  </g>
  ${rivets}
  <path d="M90 204c-2 84 34 132 84 152" stroke="${P.panelLine}" stroke-opacity=".9" stroke-width="11" fill="none" stroke-linecap="round"/>
  <path d="M110 222c0 50 18 84 44 104" stroke="${P.lilac}" stroke-opacity=".35" stroke-width="4" fill="none" stroke-linecap="round"/>
  <path d="M200 380c40 8 90 8 130-2" stroke="${P.ember}" stroke-opacity=".55" stroke-width="5" fill="none" stroke-linecap="round"/>
  <ellipse cx="260" cy="152" rx="214" ry="42" fill="${P.ironRim}"/>
  <path d="M46 152a214 42 0 0 1 428 0 214 36 0 0 0-428 0Z" fill="${P.panelLine}"/>
  <path d="M70 136c40-14 100-22 160-23" stroke="${P.lilac}" stroke-opacity=".55" stroke-width="4" fill="none" stroke-linecap="round"/>
  <ellipse cx="260" cy="154" rx="196" ry="31" fill="${P.void}"/>`,
    lin('belly', [[0, P.ironRim], [.22, P.ironHi], [.6, P.iron], [1, P.void]], 0, 0, 1, .25) + rad('under', [[0, P.ember, .6], [.5, P.coal, .22], [1, P.coal, 0]])));

  // -- liquid: white, tint with the brew colour (or drive it with shaders/liquid_surface.gdshader)
  out('cauldron/cauldron_liquid.svg', svg(520, 460, `<ellipse cx="260" cy="157" rx="193" ry="28.500" fill="url(#l)"/>`,
    rad('l', [[0, W], [.7, '#eeeeee'], [1, '#c4c4c4']])));
  out('cauldron/cauldron_liquid_shine.svg', svg(520, 460, `
  <ellipse cx="196" cy="150" rx="62" ry="6.500" fill="${W}" fill-opacity=".5"/><ellipse cx="282" cy="146" rx="14" ry="2.500" fill="${W}" fill-opacity=".4"/>
  <path d="M76 160a193 28 0 0 0 368 0" stroke="${W}" stroke-opacity=".28" stroke-width="3" fill="none"/>
  <path d="M300 172c30-2 70-6 100-14" stroke="${P.night}" stroke-opacity=".25" stroke-width="6" fill="none" stroke-linecap="round"/>`));
  // -- front lip: hides the near edge of the liquid, bubbles and splash rings
  out('cauldron/cauldron_rim.svg', svg(520, 460, `
  <path d="M46 152a214 42 0 0 0 428 0h-18a196 31 0 0 1-392 0Z" fill="${P.ironRim}"/>
  <path d="M260 194c118 0 214-19 214-42h-18c0 17-88 31-196 31Z" fill="${P.void}" fill-opacity=".4"/>
  <path d="M64 160c20 16 90 27 170 29" stroke="${P.lilac}" stroke-opacity=".45" stroke-width="3.500" fill="none" stroke-linecap="round"/>`));
  // -- halo for the "ready" state and for colour spill on the wall; additive, tint freely
  out('cauldron/cauldron_glow.svg', svg(520, 460, `<ellipse cx="260" cy="150" rx="260" ry="150" fill="url(#g)"/>`,
    rad('g', [[0, W, .55], [.35, W, .22], [1, W, 0]])));
  // -- reflected brew light on the pot's shoulder; tint with the brew colour
  out('cauldron/cauldron_reflect.svg', svg(520, 460, `<path d="M432 204c0 70-26 116-70 142" stroke="${W}" stroke-opacity=".45" stroke-width="7" fill="none" stroke-linecap="round"/>`));
}

const FLAME = 'M40 116C14 116 6 92 16 72c6-12 14-18 14-34 10 6 14 16 14 24 6-12 8-32 0-56 22 20 32 48 28 74-2 22-12 36-32 36Z';
const flame = (cols, mirror) => {
  const g = (k, c) => `<path d="${FLAME}" transform="translate(40 116) scale(${mirror ? -k : k} ${k}) translate(-40 -116)" fill="${c}"/>`;
  return svg(80, 120, g(1, cols[0]) + g(.66, cols[1]) + g(.36, cols[2]));
};

export function buildFire() {
  out('fire/flame_a.svg', flame([P.ember, P.flame, P.flameHi], false));
  out('fire/flame_b.svg', flame([P.flame, '#fbd27a', '#fff6e2'], true));
  out('fire/flame_c.svg', flame([P.coal, P.ember, P.flame], false));
  out('fire/logs.svg', svg(280, 60, `
  <ellipse cx="140" cy="44" rx="130" ry="14" fill="${P.void}" fill-opacity=".5"/>
  <g transform="rotate(-7 140 36)"><rect x="18" y="24" width="240" height="24" rx="12" fill="${P.woodLo}"/><rect x="18" y="24" width="240" height="9" rx="4.500" fill="${P.wood}"/>
    <ellipse cx="252" cy="36" rx="7" ry="12" fill="${P.woodHi}"/><ellipse cx="252" cy="36" rx="3" ry="6" fill="${P.wood}"/></g>
  <g transform="rotate(8 140 36)"><rect x="22" y="26" width="236" height="24" rx="12" fill="${P.wood}"/><rect x="22" y="26" width="236" height="9" rx="4.500" fill="${P.woodHi}"/>
    <ellipse cx="28" cy="38" rx="7" ry="12" fill="${P.cork}"/><ellipse cx="28" cy="38" rx="3" ry="6" fill="${P.woodHi}"/>
    <path d="M70 44c20 4 40 4 60 0M150 46c24 3 48 2 70-2" stroke="${P.ember}" stroke-width="4" stroke-linecap="round" fill="none"/>
    <path d="M84 45c12 2 24 2 36 0" stroke="${P.flameHi}" stroke-width="2" stroke-linecap="round" fill="none"/></g>`));
  out('fire/fire_glow.svg', svg(520, 300, `<ellipse cx="260" cy="150" rx="260" ry="150" fill="url(#g)"/>`,
    rad('g', [[0, P.flame, .5], [.3, P.ember, .28], [.65, P.coal, .1], [1, P.coal, 0]])));
}

export function buildParticles() {
  out('particles/bubble.svg', svg(64, 64, `
  <circle cx="32" cy="32" r="27" fill="${W}" fill-opacity=".22"/><circle cx="32" cy="32" r="27" fill="none" stroke="${W}" stroke-opacity=".85" stroke-width="4"/>
  <path d="M17 28a16 16 0 0 1 11-12" stroke="${W}" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="43" cy="44" r="3" fill="${W}" fill-opacity=".7"/>`));
  out('particles/bubble_pop.svg', svg(64, 64, [0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<path d="M32 9v9" transform="rotate(${a} 32 32)" stroke="${W}" stroke-width="5" stroke-linecap="round"/>`).join('')));
  out('particles/steam_puff.svg', svg(128, 128, `
  <circle cx="50" cy="72" r="46" fill="url(#g)"/><circle cx="82" cy="58" r="42" fill="url(#g)"/><circle cx="66" cy="42" r="36" fill="url(#g)"/>`,
    rad('g', [[0, W, .55], [.6, W, .22], [1, W, 0]])));
  out('particles/smoke.svg', svg(128, 128, `
  <circle cx="46" cy="76" r="34" fill="${P.lilac}" fill-opacity=".8"/><circle cx="82" cy="70" r="30" fill="${P.lilac}" fill-opacity=".8"/><circle cx="64" cy="46" r="32" fill="${P.lilac}" fill-opacity=".8"/>
  <circle cx="40" cy="70" r="20" fill="${W}" fill-opacity=".25"/><circle cx="60" cy="40" r="18" fill="${W}" fill-opacity=".25"/>
  <path d="M60 86c10 6 24 4 30-6" stroke="${P.panelLine}" stroke-opacity=".7" stroke-width="5" fill="none" stroke-linecap="round"/>`));
  out('particles/sparkle.svg', svg(64, 64, sparkle(32, 32, 30, P.brassHi) + sparkle(32, 32, 15, W)));
  out('particles/sparkle_white.svg', svg(64, 64, sparkle(32, 32, 30, W)));
  out('particles/ember.svg', svg(32, 32, `<circle cx="16" cy="16" r="16" fill="url(#g)"/><circle cx="16" cy="16" r="4" fill="${P.flameHi}"/>`,
    rad('g', [[0, P.flame, 1], [.35, P.ember, .6], [1, P.coal, 0]])));
  out('particles/fizzle.svg', svg(64, 64, `<path d="M36 4 16 34h14l-6 26 24-34H34Z" fill="${P.danger}" stroke="${P.flameHi}" stroke-width="3" stroke-linejoin="round"/>`));
  out('particles/droplet.svg', svg(32, 44, `<path d="M16 2S3 19 3 28a13 13 0 0 0 26 0C29 19 16 2 16 2Z" fill="${W}"/><path d="M9 27c-1 4 0 8 3 10" stroke="#d0d0d0" stroke-width="3" fill="none" stroke-linecap="round"/>`));
  out('particles/splash_ring.svg', svg(128, 48, `<ellipse cx="64" cy="24" rx="56" ry="18" fill="none" stroke="${W}" stroke-width="6"/>`));
  out('particles/glow_soft.svg', svg(256, 256, `<circle cx="128" cy="128" r="128" fill="url(#g)"/>`, rad('g', [[0, W, .9], [.4, W, .35], [1, W, 0]])));
  out('particles/pour_stream.svg', svg(16, 64, `<rect x="2" width="12" height="64" rx="6" fill="${W}"/><rect x="4" y="4" width="3" height="56" rx="1.500" fill="#dcdcdc"/>`));
}
