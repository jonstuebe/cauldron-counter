// UI kit. Sizes are 1x for a 1280x720 viewport; import SVGs at scale 2 for hi-dpi.
import { P, svg, lin, rad, shade, tint, sparkle, out } from './lib.mjs';

const W = '#ffffff';
const rr = (x, y, w, h, r, attrs) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" ${attrs}/>`;

function button(face, faceLo, lip, hi, state) {
  // 144x64 canvas in every state so layouts never jump; the face drops 5px when pressed.
  const pressed = state === 'pressed', y = pressed ? 5 : 0, lipY = 8;
  return svg(144, 64, `
  ${rr(0, lipY, 144, 56, 16, `fill="${lip}"`)}
  ${rr(0, y, 144, 56, 16, 'fill="url(#f)"')}
  <path d="M16 ${y + 3.5}h112" stroke="${hi}" stroke-opacity="${pressed ? .25 : .7}" stroke-width="2.500" stroke-linecap="round"/>
  ${pressed ? `<path d="M3 ${y + 16}a16 16 0 0 1 16-14h106a16 16 0 0 1 16 14" stroke="${P.night}" stroke-opacity=".3" stroke-width="4" fill="none"/>` : ''}`,
    lin('f', [[0, face], [1, faceLo]]));
}

const ICONS = {
  undo: `<path d="M14 20h18a10 10 0 0 1 0 20H20" /><path d="M21 12l-8 8 8 8"/>`,
  empty: `<path d="M10 14h28l-3 26H13Z"/><path d="M8 14h32M19 8h10M20 22v10M28 22v10"/>`,
  serve: `<path d="M8 36h32M12 36a12 14 0 0 1 24 0M24 16v6"/><circle cx="24" cy="13" r="3"/>`,
  hourglass: `<path d="M12 8h24M12 40h24M15 8c0 10 9 12 9 16s-9 6-9 16M33 8c0 10-9 12-9 16s9 6 9 16"/>`,
  star: `<path d="M24 6l5.500 11.500 12.500 1.500-9.200 8.600 2.500 12.400L24 34l-11.300 6 2.500-12.400L6 19l12.500-1.500Z"/>`,
  sound_on: `<path d="M8 19h7l9-8v26l-9-8H8ZM31 17a9 9 0 0 1 0 14M36 12a16 16 0 0 1 0 24"/>`,
  sound_off: `<path d="M8 19h7l9-8v26l-9-8H8ZM31 19l10 10M41 19 31 29"/>`,
};

export function buildUi() {
  // ---- panels (9-slice) ----
  out('ui/panel_dark.svg', svg(96, 96, `
  ${rr(0, 0, 96, 96, 20, `fill="url(#p)"`)}
  <path d="M20 1.500h56" stroke="${P.panelLine}" stroke-width="2" stroke-linecap="round"/>`, lin('p', [[0, P.panelHi], [.25, P.panel], [1, P.panel]])));
  out('ui/panel_card.svg', svg(128, 128, `
  ${rr(0, 0, 128, 128, 26, `fill="url(#p)"`)}
  ${rr(8, 8, 112, 112, 19, `fill="none" stroke="${P.brass}" stroke-opacity=".75" stroke-width="2.500"`)}
  ${[[20, 20], [108, 20], [20, 108], [108, 108]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="${P.brass}"/><circle cx="${x - 1.2}" cy="${y - 1.2}" r="1.800" fill="${P.brassHi}"/>`).join('')}
  <path d="M34 1.500h60" stroke="${P.panelLine}" stroke-width="2" stroke-linecap="round"/>`, lin('p', [[0, P.panelHi], [.3, P.panel], [1, shade(P.panel, .15)]])));
  out('ui/panel_parchment.svg', svg(96, 96, `
  ${rr(0, 0, 96, 96, 16, `fill="url(#p)"`)}
  ${rr(5, 5, 86, 86, 11, `fill="none" stroke="${P.parchmentEdge}" stroke-opacity=".7" stroke-width="1.500"`)}
  <path d="M16 94.500h64" stroke="${P.parchmentEdge}" stroke-width="2" stroke-linecap="round"/>`, lin('p', [[0, '#f8f1e2'], [.4, P.parchment], [1, P.parchmentLo]])));
  out('ui/speech_bubble.svg', svg(96, 96, `
  <path d="M22 0h52a22 22 0 0 1 22 22v52a22 22 0 0 1-22 22H6a6 6 0 0 1-6-6V22A22 22 0 0 1 22 0Z" fill="url(#p)"/>
  <path d="M22 1.500h52" stroke="${P.panelLine}" stroke-width="2" stroke-linecap="round"/>`, lin('p', [[0, P.panelHi], [.3, P.panel], [1, P.panel]])));
  out('ui/speech_tail.svg', svg(20, 24, `<path d="M20 2v20H2q-3 0-1-2Q12 14 20 2Z" fill="${P.panel}"/>`));

  // ---- order ticket ----
  const zig = Array.from({ length: 11 }, (_, i) => `${i ? 'L' : 'M'}${4 + i * 12.4} ${i % 2 ? 148 : 140}`).join('');
  out('ui/ticket.svg', svg(132, 152, `
  <path d="M4 6h124v134${Array.from({ length: 11 }, (_, i) => `L${128 - i * 12.4} ${i % 2 ? 148 : 140}`).join('')}Z" fill="${P.void}" fill-opacity=".35" transform="translate(2 4)"/>
  <path d="M4 4h124v136${Array.from({ length: 11 }, (_, i) => `L${128 - i * 12.4} ${i % 2 ? 148 : 140}`).join('')}Z" fill="url(#p)"/>
  <path d="M4 4h124v15H4Z" fill="${P.brass}"/><path d="M4 4h124v5H4Z" fill="${P.brassHi}"/><path d="M4 19h124" stroke="${P.brassLo}" stroke-width="2"/>
  <circle cx="66" cy="11.500" r="4" fill="${P.night}"/>
  <path d="M18 118h96" stroke="${P.parchmentEdge}" stroke-width="1.500" stroke-dasharray="2 5" stroke-linecap="round"/>
  <path d="M100 19h28v121Z" fill="${P.parchmentEdge}" fill-opacity=".18"/>`, lin('p', [[0, '#f8f1e2'], [1, P.parchmentLo]])));

  // ---- buttons ----
  const fam = {
    primary: { normal: [P.parchment, P.parchmentLo, P.parchmentEdge, W], hover: ['#fdf8ec', P.parchment, P.parchmentEdge, W], pressed: [P.parchmentLo, P.parchmentLo, shade(P.parchmentEdge, .2), W] },
    ready: { normal: [P.brassHi, P.brass, P.brassLo, '#fff3c8'], hover: ['#ffdf94', P.brassHi, P.brassLo, W], pressed: [P.brass, shade(P.brass, .1), P.brassDeep, '#fff3c8'] },
    secondary: { normal: [P.panelHi, P.panel, '#1a1430', P.lilac], hover: [P.panelLine, P.panelHi, '#1a1430', P.lilac], pressed: [P.panel, P.panel, P.void, P.lilac] },
  };
  for (const [name, states] of Object.entries(fam)) {
    for (const [st, a] of Object.entries(states)) out(`ui/button_${name}_${st}.svg`, button(...a, st));
    out(`ui/button_${name}_disabled.svg`, button('#3a3352', '#342d4a', '#241d38', P.lilac, 'disabled'));
  }

  // ---- bars ----
  out('ui/progress_frame.svg', svg(240, 40, `
  ${rr(0, 0, 240, 40, 20, `fill="${P.brassLo}"`)}${rr(0, 0, 240, 36, 18, `fill="url(#b)"`)}
  ${rr(5, 5, 230, 28, 14, `fill="${P.void}"`)}
  <path d="M19 8.500h202" stroke="${P.night}" stroke-width="3" stroke-linecap="round"/>
  <path d="M20 2.500h200" stroke="#fff3c8" stroke-opacity=".7" stroke-width="2" stroke-linecap="round"/>`, lin('b', [[0, P.brassHi], [1, P.brass]])));
  out('ui/progress_fill.svg', svg(48, 24, `
  ${rr(0, 0, 48, 24, 12, `fill="url(#f)"`)}
  <path d="M12 5.500h24" stroke="${W}" stroke-width="3.500" stroke-linecap="round"/>`, lin('f', [[0, '#f2f2f2'], [.5, '#e2e2e2'], [1, '#b4b4b4']])));
  out('ui/bar_frame.svg', svg(48, 14, rr(0, 0, 48, 14, 7, `fill="${P.void}" fill-opacity=".6"`) + rr(1, 1, 46, 12, 6, `fill="none" stroke="${P.panelLine}" stroke-width="1.500"`)));
  out('ui/bar_fill.svg', svg(24, 8, rr(0, 0, 24, 8, 4, `fill="${W}"`) + `<path d="M4 2.500h16" stroke="${W}" stroke-width="1.500" stroke-linecap="round"/>` + rr(0, 4, 24, 4, 2, `fill="#c8c8c8" fill-opacity=".5"`)));

  // ---- strength badge (number + label drawn by code) ----
  const badge = (ready) => {
    const face = ready ? ['#ffe39a', P.brassHi] : [P.brassHi, P.brass];
    return svg(192, 132, `
  ${ready ? `<ellipse cx="96" cy="66" rx="96" ry="66" fill="url(#g)"/>` : ''}
  ${rr(12, 16, 168, 104, 20, `fill="${P.brassDeep}"`)}${rr(12, 10, 168, 104, 20, `fill="url(#f)"`)}
  ${rr(19, 17, 154, 90, 14, `fill="none" stroke="${P.brassLo}" stroke-opacity=".7" stroke-width="2"`)}
  <path d="M34 12.500h124" stroke="#fff6dc" stroke-opacity=".85" stroke-width="2.500" stroke-linecap="round"/>
  <path d="M40 44h112" stroke="${P.brassLo}" stroke-opacity=".55" stroke-width="1.500" stroke-linecap="round"/>
  ${[[30, 28], [162, 28], [30, 96], [162, 96]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4.500" fill="${P.brassLo}"/><circle cx="${x - 1}" cy="${y - 1}" r="1.600" fill="#fff6dc"/>`).join('')}`,
      lin('f', [[0, face[0]], [1, face[1]]]) + rad('g', [[0, P.brassHi, .7], [.6, P.brassHi, .25], [1, P.brassHi, 0]]));
  };
  out('ui/strength_badge.svg', badge(false));
  out('ui/strength_badge_ready.svg', badge(true));

  // ---- small pieces ----
  out('ui/coin.svg', svg(48, 48, `
  <circle cx="24" cy="26" r="21" fill="${P.brassDeep}"/><circle cx="24" cy="23" r="21" fill="url(#c)"/>
  <circle cx="24" cy="23" r="15" fill="none" stroke="${P.brassLo}" stroke-opacity=".7" stroke-width="2"/>
  <path d="M27 13a10 10 0 1 0 7 16 8.500 8.500 0 0 1-7-16Z" fill="${P.brassLo}"/>
  <path d="M9 17a17 17 0 0 1 14-11" stroke="#fff6dc" stroke-width="3" fill="none" stroke-linecap="round"/>`, lin('c', [[0, P.brassHi], [1, P.brass]])));
  out('ui/queue_dot_on.svg', svg(20, 20, `<circle cx="10" cy="10" r="7" fill="${P.parchment}"/><circle cx="8" cy="8" r="2" fill="${W}"/>`));
  out('ui/queue_dot_off.svg', svg(20, 20, `<circle cx="10" cy="10" r="6" fill="none" stroke="${P.lilac}" stroke-opacity=".55" stroke-width="2"/>`));
  out('ui/chip.svg', svg(64, 36, rr(0, 0, 64, 36, 18, `fill="${P.panel}"`) + rr(1, 1, 62, 34, 17, `fill="none" stroke="${P.panelLine}" stroke-width="1.500"`)));
  out('ui/chip_dot.svg', svg(20, 20, `<circle cx="10" cy="10" r="9" fill="${W}"/><path d="M5 8a6 6 0 0 1 4-4" stroke="${W}" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M10 19a9 9 0 0 0 9-9c-1 5-5 8-9 9Z" fill="#b8b8b8"/>`));
  const tag = (a, b, lip) => svg(56, 32, rr(0, 3, 56, 29, 9, `fill="${lip}"`) + rr(0, 0, 56, 29, 9, 'fill="url(#t)"') + `<path d="M9 2.500h38" stroke="${W}" stroke-opacity=".5" stroke-width="1.500" stroke-linecap="round"/>`, lin('t', [[0, a], [1, b]]));
  out('ui/op_tag.svg', tag(P.brassHi, P.brass, P.brassLo));
  out('ui/op_tag_faded.svg', tag(P.panelHi, P.panel, '#1a1430'));
  out('ui/portrait_frame.svg', svg(120, 120, `
  <circle cx="60" cy="62" r="54" fill="none" stroke="${P.brassDeep}" stroke-width="8"/>
  <circle cx="60" cy="60" r="54" fill="none" stroke="url(#r)" stroke-width="8"/>
  <path d="M18 40a46 46 0 0 1 30-30" stroke="#fff6dc" stroke-opacity=".8" stroke-width="2.500" fill="none" stroke-linecap="round"/>
  ${[[60, 6], [114, 60], [60, 114], [6, 60]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="${P.brassLo}"/>`).join('')}`, lin('r', [[0, P.brassHi], [1, P.brass]])));
  out('ui/portrait_bg.svg', svg(120, 120, `<circle cx="60" cy="60" r="52" fill="url(#b)"/>${sparkle(30, 34, 5, P.moon, .7)}${sparkle(92, 48, 3.5, P.moon, .6)}${sparkle(80, 24, 2.5, P.moon, .5)}`, rad('b', [[0, P.panelLine], [1, P.dusk]], .5, .75, .8)));
  out('ui/shelf_plank.svg', svg(96, 22, `
  <rect y="14" width="96" height="8" fill="${P.void}" fill-opacity=".35"/>
  <rect width="96" height="16" rx="3" fill="${P.wood}"/><rect width="96" height="6" rx="3" fill="${P.woodHi}"/>
  <path d="M3 2.500h90" stroke="${P.cork}" stroke-width="1.500" stroke-linecap="round"/>
  <path d="M30 10h14M58 11.500h20" stroke="${P.woodLo}" stroke-width="1.500" stroke-linecap="round"/>`));
  for (const [n, d] of Object.entries(ICONS)) out(`ui/icon_${n}.svg`, svg(48, 48, `<g fill="none" stroke="${P.parchment}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">${d}</g>`));

  // ---- app icon ----
  out('icon.svg', svg(256, 256, `
  <rect width="256" height="256" rx="56" fill="url(#bg)"/>
  <ellipse cx="128" cy="150" rx="150" ry="110" fill="url(#halo)"/>
  ${sparkle(46, 52, 12, P.moon, .9)}${sparkle(212, 66, 8, P.moon, .8)}${sparkle(196, 34, 5, P.moon, .6)}
  <circle cx="92" cy="58" r="13" fill="${P.mint}" fill-opacity=".5"/><circle cx="128" cy="34" r="9" fill="${P.mint}" fill-opacity=".35"/><circle cx="156" cy="66" r="7" fill="${P.mint}" fill-opacity=".45"/>
  <path d="M76 196 62 232M180 196l14 36" stroke="${P.iron}" stroke-width="14" stroke-linecap="round"/>
  <circle cx="30" cy="124" r="13" fill="none" stroke="${P.ironHi}" stroke-width="8"/><circle cx="226" cy="124" r="13" fill="none" stroke="${P.iron}" stroke-width="8"/>
  <path d="M30 100c-8 76 26 116 98 116s106-40 98-116Z" fill="url(#belly)"/>
  <path d="M48 124c0 40 18 62 44 72" stroke="${P.panelLine}" stroke-width="7" fill="none" stroke-linecap="round"/>
  <ellipse cx="128" cy="100" rx="104" ry="24" fill="${P.ironRim}"/><ellipse cx="128" cy="101" rx="94" ry="18" fill="${P.void}"/>
  <ellipse cx="128" cy="103" rx="92" ry="16" fill="url(#liq)"/><ellipse cx="98" cy="99" rx="30" ry="4" fill="#fff" fill-opacity=".55"/>
  <circle cx="150" cy="100" r="6" fill="none" stroke="#fff" stroke-opacity=".8" stroke-width="2.500"/><circle cx="170" cy="106" r="3.500" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="2"/>
  <path d="M24 100a104 24 0 0 0 208 0h-10a94 18 0 0 1-188 0Z" fill="${P.ironRim}"/>
  <rect x="86" y="134" width="84" height="52" rx="12" fill="${P.brassDeep}"/><rect x="86" y="130" width="84" height="52" rx="12" fill="url(#br)"/>
  <path d="M128 142v28M114 156h28" stroke="${P.ink}" stroke-width="9" stroke-linecap="round"/>
  <path d="M112 248c-12-14-2-26 4-36 2 10 8 12 8 20 6-8 6-18 2-30 14 12 18 30 6 46Z" fill="${P.ember}"/><path d="M120 248c-6-8-2-14 2-20 4 6 8 12 2 20Z" fill="${P.flameHi}"/>`,
    lin('bg', [[0, P.dusk], [1, P.night]]) + rad('halo', [[0, P.ember, .35], [1, P.ember, 0]]) +
    lin('belly', [[0, P.ironRim], [.3, P.ironHi], [1, P.void]], 0, 0, 1, .3) + rad('liq', [[0, '#a8f2dc'], [1, P.mintLo]]) + lin('br', [[0, P.brassHi], [1, P.brass]])));
}
