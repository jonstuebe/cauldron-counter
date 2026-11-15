// Renders the review images (and the two raster deliverables that need real fonts):
//   preview/contact_sheet.png, preview/mockup.png, preview/preloader_mockup.png,
//   splash.png, ui/wordmark.png, ui/wordmark_stacked.png
// Usage (repo root): node godot/art/_tools/preview.mjs
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ART, P } from './lib.mjs';
import { INGS } from './ingredients.mjs';
import { CAST_IDS } from './customers.mjs';

const U = (p) => pathToFileURL(join(ART, p)).href;
const HTML = join(ART, '_tools', '_html'); mkdirSync(HTML, { recursive: true });
const OP = { '+': '+', '-': '−', x: '×', '/': '÷' };

const css = `
@font-face{font-family:Fell;src:url(${U('fonts/IMFellEnglish-Regular.ttf')})}
@font-face{font-family:Fell;font-style:italic;src:url(${U('fonts/IMFellEnglish-Italic.ttf')})}
@font-face{font-family:Alegreya;font-weight:400;src:url(${U('fonts/AlegreyaSans-Regular.ttf')})}
@font-face{font-family:Alegreya;font-weight:500;src:url(${U('fonts/AlegreyaSans-Medium.ttf')})}
@font-face{font-family:Alegreya;font-weight:700;src:url(${U('fonts/AlegreyaSans-Bold.ttf')})}
@font-face{font-family:Alegreya;font-weight:800;src:url(${U('fonts/AlegreyaSans-ExtraBold.ttf')})}
@font-face{font-family:Atkinson;font-weight:200 800;src:url(${U('fonts/AtkinsonHyperlegibleNext-Variable.ttf')})}
*{box-sizing:border-box;margin:0;padding:0}
body{background:${P.night};color:${P.parchment};font-family:Alegreya,sans-serif;overflow:hidden}
.abs{position:absolute}.fell{font-family:Fell,serif}.num{font-family:Atkinson,sans-serif;font-weight:800;font-variant-numeric:tabular-nums}
img{display:block}
.nine{border-style:solid;border-color:transparent}
`;
const img = (p, x, y, w, h, extra = '') => `<img class="abs" src="${U(p)}" style="left:${x}px;top:${y}px;width:${w}px;${h ? `height:${h}px;` : ''}${extra}">`;
// Tinting preview: emulate Godot's modulate (multiply) by rewriting the greyscale fills of a white sprite.
const mul = (grey, color) => '#' + [0, 2, 4].map((i) => Math.round(parseInt(grey.slice(1 + i, 3 + i), 16) * parseInt(color.slice(1 + i, 3 + i), 16) / 255).toString(16).padStart(2, '0')).join('');
const tinted = (p, x, y, w, h, color, extra = '') => {
  const t = readFileSync(join(ART, p), 'utf8').replace(/#[0-9a-fA-F]{6}/g, (g) => mul(g, color)).replace('<svg ', '<svg preserveAspectRatio="none" ');
  return `<img class="abs" src="data:image/svg+xml;base64,${Buffer.from(t).toString('base64')}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;${extra}">`;
};
const nine = (p, m, x, y, w, h, inner = '', extra = '') => `<div class="abs nine" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;border-width:${m}px;border-image:url(${U(p)}) ${m} fill stretch;${extra}"><div style="position:absolute;inset:${-m}px">${inner}</div></div>`;
const bg = (ox = -160, oy = -90, layers = ['bg_back', 'bg_glow', 'bg_shelves', 'bg_mid', 'bg_counter', 'bg_vignette']) =>
  layers.map((l) => img(`background/${l}.svg`, ox, oy, 1600, 900, l === 'bg_glow' ? 'mix-blend-mode:screen' : '')).join('');

// cauldron stack at scale k, top-left x,y. liquid colour c.
const cauldron = (x, y, k, c, ready = false, strength = '41') => {
  const w = 520 * k, h = 460 * k, L = (p, e = '') => img(`cauldron/${p}.svg`, x, y, w, h, e);
  const fl = (f, fx, s) => img(`fire/${f}.svg`, x + fx * k - 40 * s * k, y + 452 * k - 120 * s * k, 80 * s * k, 120 * s * k);
  return `
  ${img('fire/fire_glow.svg', x, y + 250 * k, w, 300 * k, 'mix-blend-mode:screen')}
  ${tinted('cauldron/cauldron_glow.svg', x - 40 * k, y - 60 * k, w + 80 * k, h, c, `mix-blend-mode:screen;opacity:${ready ? .75 : .4}`)}
  ${fl('flame_c', 178, 1.05)}${fl('flame_a', 262, 1.3)}${fl('flame_b', 344, 1.1)}
  ${L('cauldron_body')}${tinted('cauldron/cauldron_reflect.svg', x, y, w, h, c, 'opacity:.8')}
  ${tinted('cauldron/cauldron_liquid.svg', x, y, w, h, c)}${L('cauldron_liquid_shine')}
  ${[[150, 150, 26], [330, 160, 18], [372, 148, 12], [230, 164, 14]].map(([bx, by, s]) => tinted('particles/bubble.svg', x + bx * k, y + by * k - s * k, s * k, s * k, '#ffffff', 'opacity:.85')).join('')}
  ${L('cauldron_rim')}
  ${img('fire/logs.svg', x + 120 * k, y + 404 * k, 280 * k, 60 * k)}
  ${[[210, 60, 90, .5], [300, 0, 120, .4], [250, -70, 150, .25]].map(([sx, sy, s, o]) => tinted('particles/steam_puff.svg', x + sx * k - s * k / 2, y + sy * k - s * k / 2, s * k, s * k, c, `opacity:${o}`)).join('')}
  ${ready ? [[120, 70, 26], [400, 40, 20], [330, -20, 14], [180, 0, 16]].map(([sx, sy, s]) => img('particles/sparkle.svg', x + sx * k, y + sy * k, s * k)).join('') : ''}
  ${img(`ui/strength_badge${ready ? '_ready' : ''}.svg`, x + 164 * k, y + 200 * k, 192 * k, 132 * k)}
  <div class="abs" style="left:${x + 164 * k}px;top:${y + 219 * k}px;width:${192 * k}px;text-align:center;color:${P.ink};font:800 ${15 * k}px Alegreya;letter-spacing:${2.5 * k}px;opacity:.8">STRENGTH</div>
  <div class="abs num" style="left:${x + 164 * k}px;top:${y + 240 * k}px;width:${192 * k}px;text-align:center;color:${P.ink};font-size:${56 * k}px;line-height:1">${strength}</div>`;
};
const jar = (g, x, y, w) => img(`ingredients/jar_${g.id}.svg`, x, y, w) + img('ingredients/cork.svg', x + w * 42 / 120, y - w * 12 / 120, w * 36 / 120);
const button = (kind, state, x, y, w, label, color) => nine(`ui/button_${kind}_${state}.svg`, 22, x, y, w, 64,
  `<div style="position:absolute;inset:0 0 8px 0;display:grid;place-items:center;font:800 20px Alegreya;color:${color}">${label}</div>`);

// ============================ game mock-up ============================
function mockup() {
  const day = INGS.slice(0, 12);
  const cells = day.map((g, i) => {
    const cx = 852 + (i % 4) * 100, cy = 92 + Math.floor(i / 4) * 172;
    return `${jar(g, cx + 18, cy + 14, 64)}
    <div class="abs" style="left:${cx}px;top:${cy + 118}px;width:100px;text-align:center;font:500 15px Alegreya;line-height:1">${g.name}</div>
    ${img('ui/op_tag.svg', cx + 22, cy + 136, 56, 32)}<div class="abs num" style="left:${cx + 22}px;top:${cy + 139}px;width:56px;text-align:center;color:${P.ink};font-size:17px">${OP[g.op]}${g.v}</div>`;
  }).join('');
  const planks = [0, 1, 2].map((r) => tinted('ui/shelf_plank.svg', 848, 92 + r * 172 + 92, 408, 22, '#ffffff')).join('');
  const chips = [['ember', '+10'], ['ember', '+10'], ['moon', '×2'], ['dew', '+1']].map(([id, t], i) => {
    const g = INGS.find((n) => n.id === id);
    return nine('ui/chip.svg', 17, 28 + i * 86, 470, 78, 36, `${tinted('ui/chip_dot.svg', 9, 9, 18, 18, g.color)}<div class="num abs" style="left:32px;top:7px;font-size:17px">${t}</div>`);
  }).join('');
  return `<style>${css}</style><div style="position:relative;width:1280px;height:720px;overflow:hidden">
  ${bg()}
  <div class="abs" style="left:0;top:0;width:1280px;height:64px;background:linear-gradient(${P.void}cc,${P.void}00)"></div>
  <div class="abs fell" style="left:28px;top:10px;font-size:32px">Cauldron Counter</div>
  <div class="abs num" style="right:28px;top:17px;display:flex;gap:18px;align-items:center;font-size:19px;color:${P.lilac}">
    <span>Day 11/50</span><span style="display:flex;gap:7px;align-items:center;color:${P.parchment}"><img src="${U('ui/coin.svg')}" width="26">111</span>
    <span style="display:flex;gap:2px">${[1, 1, 1, 0, 0].map((o) => `<img src="${U(`ui/queue_dot_${o ? 'on' : 'off'}.svg`)}" width="18">`).join('')}</span></div>

  <!-- left column: customer -->
  <div class="abs" style="left:28px;top:84px;width:112px;height:112px">
    ${img('ui/portrait_bg.svg', 0, 0, 112)}
    <div class="abs" style="left:7px;top:7px;width:98px;height:98px;border-radius:50%;overflow:hidden">${img('customers/customer_4_isolde_neutral.svg', -6, 0, 110)}</div>
    ${img('ui/portrait_frame.svg', 0, 0, 112)}</div>
  ${img('ui/speech_tail.svg', 139, 150, 20, 24)}
  ${nine('ui/speech_bubble.svg', 26, 158, 84, 286, 128, `<div style="padding:13px 16px"><div style="font:700 15px Alegreya;color:${P.lilac}">Captain Isolde</div>
    <div style="font:500 18px/1.32 Atkinson;margin-top:3px">The last shop gave me a 142 and my eyebrows fell off. Exactly 141 this time.</div></div>`)}
  <div class="abs" style="left:306px;top:206px;width:118px;transform:rotate(4deg)">${img('ui/ticket.svg', 0, 0, 118)}
    <div class="num abs" style="left:0;top:34px;width:118px;text-align:center;color:${P.ink};font-size:42px;line-height:1">141</div>
    <div class="abs" style="left:0;top:80px;width:118px;text-align:center;color:${P.inkSoft};font:500 15px Alegreya;opacity:.75">wanted</div></div>
  ${nine('ui/bar_frame.svg', 7, 28, 236, 262, 14)}${tinted('ui/bar_fill.svg', 31, 239, 176, 8, P.brass, 'border-radius:4px')}
  <div class="abs num" style="left:28px;top:258px;font-size:15px;color:${P.brassHi}">Speed bonus +6</div>
  <div class="abs" style="left:28px;top:438px;width:400px;display:flex;justify-content:space-between;font:500 16px Atkinson;color:${P.lilac}"><span>4 of 6 ingredients</span></div>
  ${chips}
  <div class="abs" style="left:28px;top:522px;font:500 16px Atkinson;color:${P.lilac}">Master’s tip: use 3</div>
  ${button('secondary', 'normal', 28, 566, 104, 'Undo', P.parchment)}${button('secondary', 'hover', 140, 566, 104, 'Empty', P.parchment)}${button('primary', 'normal', 252, 566, 176, 'Serve potion', P.ink)}

  <!-- centre: cauldron -->
  ${cauldron(432, 316, .8, '#f0a35f')}

  <!-- right column: shelf -->
  ${nine('ui/panel_dark.svg', 26, 836, 76, 432, 540, '', 'opacity:.9')}
  ${planks}${cells}
  </div>`;
}

// ============================ preloader ============================
function preloader() {
  return `<style>${css}</style><div style="position:relative;width:1280px;height:720px;overflow:hidden">
  ${bg(-160, -90, ['bg_back', 'bg_shelves', 'bg_mid'])}
  <div class="abs" style="inset:0;background:radial-gradient(ellipse 60% 70% at 50% 50%,${P.night}e6,${P.void}f2)"></div>
  ${img('fire/fire_glow.svg', 380, 250, 520, 300, 'mix-blend-mode:screen')}
  ${cauldron(536, 148, .4, P.mint, false, '62')}
  <div class="abs" style="left:0;top:356px;width:1280px;text-align:center;font:800 14px Alegreya;letter-spacing:6px;color:${P.brass}">A POTION STALL</div>
  <div class="abs fell" style="left:0;top:372px;width:1280px;text-align:center;font-size:76px;text-shadow:0 4px 0 ${P.void}">Cauldron Counter</div>
  ${nine('ui/progress_frame.svg', 20, 400, 492, 480, 40)}
  ${tinted('ui/progress_fill.svg', 408, 500, 464 * .62, 24, P.mint)}
  ${img('particles/sparkle.svg', 408 + 464 * .62 - 14, 493, 22)}
  <div class="abs" style="left:0;top:548px;width:1280px;text-align:center;font:500 19px Atkinson;color:${P.lilac}">Stoking the fire… <span class="num" style="color:${P.parchment}">62%</span></div>
  <div class="abs fell" style="left:0;top:640px;width:1280px;text-align:center;font-style:italic;font-size:20px;color:${P.lilac}">“Grandmother swears by a 12. She is never wrong.”</div>
  </div>`;
}

// ============================ boot splash ============================
function splash() {
  return `<style>${css}</style><div style="position:relative;width:1280px;height:720px;overflow:hidden;background:${P.night}">
  <div class="abs" style="inset:0;background:radial-gradient(ellipse 46% 60% at 50% 44%,${P.dusk},${P.night} 70%)"></div>
  ${[[250, 150, 14], [1010, 130, 18], [930, 250, 8], [330, 300, 9], [1090, 380, 10], [180, 420, 7], [420, 110, 6]].map(([x, y, s]) => tinted('particles/sparkle_white.svg', x, y, s, s, P.moon, 'opacity:.8')).join('')}
  ${cauldron(458, 96, .7, P.mint, true, '42')}
  <div class="abs" style="left:0;top:470px;width:1280px;text-align:center;font:800 15px Alegreya;letter-spacing:7px;color:${P.brass}">A POTION STALL</div>
  <div class="abs fell" style="left:0;top:486px;width:1280px;text-align:center;font-size:104px;text-shadow:0 5px 0 ${P.void}">Cauldron Counter</div>
  </div>`;
}
const wordmark = (stacked) => `<style>${css}body{background:transparent}</style><div class="fell" id="w" style="display:inline-block;padding:8px 16px 18px;font-size:160px;line-height:.95;text-align:center;white-space:nowrap">Cauldron${stacked ? '<br>' : ' '}Counter</div>`;

// ============================ contact sheet ============================
function sheet() {
  let y = 0; const parts = [];
  const head = (t, sub = '') => { parts.push(`<div class="abs fell" style="left:40px;top:${y}px;font-size:30px">${t} <span style="font:500 15px Alegreya;color:${P.lilac};margin-left:10px">${sub}</span></div>`); y += 50; };
  const label = (t, x, yy, w) => `<div class="abs" style="left:${x}px;top:${yy}px;width:${w}px;text-align:center;font:500 11px Atkinson;color:${P.lilac};white-space:nowrap;overflow:hidden">${t}</div>`;
  const grid = (items, cell, cols, draw, lh = 18) => {
    items.forEach((it, i) => { const x = 40 + (i % cols) * (cell + 12), yy = y + Math.floor(i / cols) * (cell + lh + 10); parts.push(draw(it, x, yy)); });
    y += Math.ceil(items.length / cols) * (cell + lh + 10) + 20;
  };
  y = 40;
  parts.push(`<div class="abs fell" style="left:40px;top:${y}px;font-size:54px">Cauldron Counter <span style="font-style:italic;color:${P.brass};font-size:30px">art contact sheet</span></div>`); y += 90;
  head('Ingredients', 'ingredients/ingredient_&lt;id&gt;.svg · 96×96');
  grid(INGS, 84, 16, (g, x, yy) => img(`ingredients/ingredient_${g.id}.svg`, x, yy, 84) + label(g.id, x - 4, yy + 88, 92));
  head('Jars', 'jar_&lt;id&gt;.svg + cork.svg · bottle shape encodes the operation (+ round, − cone, × tall, ÷ gem)');
  grid(INGS, 84, 16, (g, x, yy) => jar(g, x + 6, yy + 12, 72) + label(`${g.id} ${OP[g.op]}${g.v}`, x - 4, yy + 106, 92), 36);
  head('Tintable bottle parts and emblems', 'bottle_&lt;shape&gt;_glass / _liquid (white mask) / _front · emblem_&lt;id&gt;.svg');
  const shapes = ['round', 'cone', 'tall', 'gem'];
  shapes.forEach((s, i) => { const x = 40 + i * 96; parts.push(img(`ingredients/bottle_${s}_glass.svg`, x, y, 80) + tinted(`ingredients/bottle_${s}_liquid.svg`, x, y, 80, 100, ['#ff7ab8', '#7ad7ff', '#b6ff7a', '#ffd27a'][i]) + img(`ingredients/bottle_${s}_front.svg`, x, y, 80) + label(s, x, y + 104, 80)); });
  INGS.forEach((g, i) => { const x = 450 + i * 66; parts.push(`<div class="abs" style="left:${x}px;top:${y + 24}px;width:56px;height:56px;border-radius:12px;background:${g.color}"></div>` + img(`ingredients/emblem_${g.id}.svg`, x + 6, y + 30, 44, 44, 'opacity:.7')); });
  y += 140;
  head('Customers', 'customer_&lt;index&gt;_&lt;id&gt;_&lt;neutral|happy|upset&gt;.svg · 256×256');
  const custs = []; CAST_IDS.forEach((id, i) => ['neutral', 'happy', 'upset'].forEach((m) => custs.push([i, id, m])));
  grid(custs, 89, 15, ([i, id, m], x, yy) => img(`customers/customer_${i}_${id}_${m}.svg`, x, yy, 89) + label(`${i} ${id} ${m}`, x - 6, yy + 92, 101));
  head('Cauldron and fire', 'stacked 520×460 layers · liquid, glow and reflect are white and tinted in code');
  const cy = y;
  parts.push(cauldron(40, cy + 40, .62, P.mint, false, '41'), cauldron(390, cy + 40, .62, '#c95b8f', true, '141'));
  ['cauldron_body', 'cauldron_liquid', 'cauldron_liquid_shine', 'cauldron_rim', 'cauldron_glow', 'cauldron_reflect'].forEach((l, i) => { const x = 760 + (i % 3) * 180, yy = cy + Math.floor(i / 3) * 176; parts.push(`<div class="abs" style="left:${x}px;top:${yy}px;width:168px;height:150px;background:${P.dusk};border-radius:10px"></div>` + img(`cauldron/${l}.svg`, x + 4, yy + 4, 160) + label(l, x, yy + 153, 168)); });
  ['flame_a', 'flame_b', 'flame_c'].forEach((f, i) => parts.push(img(`fire/${f}.svg`, 1310 + i * 80, cy, 70) + label(f, 1300 + i * 80, cy + 108, 90)));
  parts.push(img('fire/logs.svg', 1310, cy + 150, 230) + label('logs', 1310, cy + 204, 230), img('fire/fire_glow.svg', 1310, cy + 230, 230, 0, 'mix-blend-mode:screen') + label('fire_glow (additive)', 1310, cy + 340, 230));
  y += 380;
  head('Particles', 'white sprites are meant to be tinted');
  grid(readdirSync(join(ART, 'particles')).filter((f) => f.endsWith('.svg')).sort(), 76, 14, (f, x, yy) => `<div class="abs" style="left:${x}px;top:${yy}px;width:76px;height:76px;display:grid;place-items:center"><img src="${U('particles/' + f)}" style="max-width:76px;max-height:76px"></div>` + label(f.replace('.svg', ''), x - 10, yy + 80, 96));
  head('UI kit', '9-slice panels, buttons in four states, bars, badge, ticket');
  const uy = y;
  ['panel_dark', 'panel_card', 'panel_parchment', 'speech_bubble'].forEach((p, i) => parts.push(nine(`ui/${p}.svg`, p === 'panel_card' ? 40 : 28, 40 + i * 190, uy, 172, 110) + label(p, 40 + i * 190, uy + 114, 172)));
  ['primary', 'ready', 'secondary'].forEach((k, r) => ['normal', 'hover', 'pressed', 'disabled'].forEach((s, c) => parts.push(button(k, s, 810 + c * 186, uy + r * 72, 174, `${k} ${s}`, s === 'disabled' ? P.lilac : k === 'secondary' ? P.parchment : P.ink))));
  y += 240;
  parts.push(nine('ui/progress_frame.svg', 20, 40, y, 360, 40) + tinted('ui/progress_fill.svg', 48, y + 8, 230, 24, P.mint) + label('progress_frame + progress_fill (tinted mint)', 40, y + 46, 360));
  parts.push(nine('ui/bar_frame.svg', 7, 430, y + 12, 220, 14) + label('bar_frame + bar_fill', 430, y + 46, 220));
  parts.push(img('ui/strength_badge.svg', 690, y - 30, 130) + img('ui/strength_badge_ready.svg', 830, y - 30, 130) + label('strength_badge / _ready', 690, y + 62, 270));
  y += 90;
  const small = ['ticket', 'coin', 'portrait_bg', 'portrait_frame', 'op_tag', 'op_tag_faded', 'chip', 'chip_dot', 'queue_dot_on', 'queue_dot_off', 'speech_tail', 'shelf_plank', 'icon_undo', 'icon_empty', 'icon_serve', 'icon_hourglass', 'icon_star', 'icon_sound_on', 'icon_sound_off'];
  grid(small, 68, 19, (f, x, yy) => `<div class="abs" style="left:${x}px;top:${yy}px;width:68px;height:68px;display:grid;place-items:center"><img src="${U(`ui/${f}.svg`)}" style="max-width:68px;max-height:68px"></div>` + label(f, x - 6, yy + 72, 80));
  parts.push(img('ui/wordmark.png', 40, y, 420) + label('ui/wordmark.png', 40, y + 96, 420) + img('icon.svg', 520, y - 6, 100) + label('icon.svg', 510, y + 96, 120));
  y += 130;
  head('Background layers', '1600×900 each, centred on the 1280×720 viewport · back to front');
  ['bg_back', 'bg_glow', 'bg_shelves', 'bg_mid', 'bg_counter', 'bg_vignette'].forEach((l, i) => { const x = 40 + i * 256; parts.push(`<div class="abs" style="left:${x}px;top:${y}px;width:244px;height:137px;background:${l === 'bg_vignette' ? P.panelLine : P.void};border-radius:6px"></div>` + img(`background/${l}.svg`, x, y, 244) + label(l, x, y + 141, 244)); });
  y += 180;
  parts.push(img('splash.png', 40, y, 480) + label('splash.png (1280×720)', 40, y + 274, 480) + img('preview/mockup.png', 552, y, 480) + label('preview/mockup.png', 552, y + 274, 480) + img('preview/preloader_mockup.png', 1064, y, 480) + label('preview/preloader_mockup.png', 1064, y + 274, 480));
  y += 310;
  return { html: `<style>${css}</style><div style="position:relative;width:1600px;height:${y}px;overflow:hidden;background:${P.night}">
  <div class="abs" style="inset:0;background:linear-gradient(${P.dusk},${P.night})"></div>
  <div class="abs" style="left:0;top:0;width:1600px;height:900px;opacity:.5;-webkit-mask:linear-gradient(#000 40%,transparent)">${bg(0, 0, ['bg_back', 'bg_shelves', 'bg_mid'])}</div>${parts.join('\n')}</div>`, h: y };
}

const browser = await chromium.launch();
async function shot(name, html, w, h, file, opts = {}) {
  const f = join(HTML, name + '.html'); writeFileSync(f, `<!doctype html><meta charset="utf-8">${html}`);
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: opts.scale || 1 });
  await page.goto(pathToFileURL(f).href); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(250);
  if (opts.selector) await page.locator(opts.selector).screenshot({ path: join(ART, file), omitBackground: true });
  else await page.screenshot({ path: join(ART, file), omitBackground: !!opts.transparent });
  await page.close(); console.log('wrote', file);
}
mkdirSync(join(ART, 'preview'), { recursive: true });
await shot('wordmark', wordmark(false), 1600, 300, 'ui/wordmark.png', { selector: '#w' });
await shot('wordmark_stacked', wordmark(true), 1000, 500, 'ui/wordmark_stacked.png', { selector: '#w' });
await shot('splash', splash(), 1280, 720, 'splash.png');
await shot('mockup', mockup(), 1280, 720, 'preview/mockup.png');
await shot('preloader', preloader(), 1280, 720, 'preview/preloader_mockup.png');
const s = sheet();
await shot('contact_sheet', s.html, 1600, s.h, 'preview/contact_sheet.png');
await browser.close();
