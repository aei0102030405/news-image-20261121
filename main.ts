// news-image-20261121 — one-day world news front page, drawn procedurally.
// Node 22+, standard library only, no network. Writes a deterministic
// 1024x1024 PNG to $MAKEFUN_OUTPUT_DIR/entry.png (default /output).
// Stories: the world's news of Saturday 21 November 2026.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';

const W = 1024;
const H = 1024;

// ---------------------------------------------------------------- palette
const PAPER = [246, 241, 227];
const INK = [26, 26, 26];
const INK_SOFT = [74, 70, 60];
const RED = [178, 35, 27];
const BLUE = [29, 78, 137];
const TEAL = [14, 110, 105];
const ORANGE = [198, 96, 20];
const GREEN = [46, 125, 50];
const PURPLE = [94, 53, 130];
const GOLD = [176, 132, 30];
const WHITE = [255, 255, 255];
const PANEL = [255, 253, 246];
const LINE = [26, 26, 26];

// ---------------------------------------------------------------- canvas
const px = new Uint8Array(W * H * 3);
function fill(c: number[]) {
  for (let i = 0; i < W * H; i++) {
    px[i * 3] = c[0]; px[i * 3 + 1] = c[1]; px[i * 3 + 2] = c[2];
  }
}
function setPix(x: number, y: number, c: number[]) {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  px[i] = c[0]; px[i + 1] = c[1]; px[i + 2] = c[2];
}
function rect(x: number, y: number, w: number, h: number, c: number[]) {
  const x0 = Math.max(0, Math.floor(x));
  const y0 = Math.max(0, Math.floor(y));
  const x1 = Math.min(W, Math.ceil(x + w));
  const y1 = Math.min(H, Math.ceil(y + h));
  for (let yy = y0; yy < y1; yy++) {
    for (let xx = x0; xx < x1; xx++) setPix(xx, yy, c);
  }
}
function hline(x: number, y: number, w: number, c: number[], t = 1) {
  rect(x, y, w, t, c);
}
function vline(x: number, y: number, h: number, c: number[], t = 1) {
  rect(x, y, t, h, c);
}
function disc(cx: number, cy: number, r: number, c: number[]) {
  for (let yy = -r; yy <= r; yy++) {
    for (let xx = -r; xx <= r; xx++) {
      if (xx * xx + yy * yy <= r * r) setPix(cx + xx, cy + yy, c);
    }
  }
}
function ring(cx: number, cy: number, r: number, t: number, c: number[]) {
  for (let a = 0; a < 360; a += 1) {
    const rad = (a * Math.PI) / 180;
    for (let k = 0; k < t; k++) {
      setPix(Math.round(cx + (r - k) * Math.cos(rad)), Math.round(cy + (r - k) * Math.sin(rad)), c);
    }
  }
}
// filled triangle
function tri(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, c: number[]) {
  const minX = Math.floor(Math.min(x1, x2, x3));
  const maxX = Math.ceil(Math.max(x1, x2, x3));
  const minY = Math.floor(Math.min(y1, y2, y3));
  const maxY = Math.ceil(Math.max(y1, y2, y3));
  const d = (x1 - x3) * (y2 - y3) - (x2 - x3) * (y1 - y3);
  if (d === 0) return;
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const a = ((x - x3) * (y2 - y3) - (y1 - y3) * (x2 - x3)) / d;
      const b = ((x1 - x3) * (y - y3) - (y1 - y3) * (x - x3)) / d;
      if (a >= 0 && b >= 0 && a + b <= 1) setPix(x, y, c);
    }
  }
}
// line by sampling
function line(x1: number, y1: number, x2: number, y2: number, c: number[], t = 1) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const n = Math.ceil(Math.max(Math.abs(dx), Math.abs(dy))) + 1;
  for (let i = 0; i <= n; i++) {
    const x = Math.round(x1 + (dx * i) / n);
    const y = Math.round(y1 + (dy * i) / n);
    for (let a = 0; a < t; a++) for (let b = 0; b < t; b++) setPix(x + a, y + b, c);
  }
}

// ------------------------------------------------------- 5x7 bitmap font
// Each glyph: 7 rows of 5 bits, '#' = on.
const GLYPHS: Record<string, string[]> = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01110', '10001', '10000', '10000', '10000', '10001', '01110'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  G: ['01110', '10001', '10000', '10111', '10001', '10001', '01111'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['01110', '00100', '00100', '00100', '00100', '00100', '01110'],
  J: ['00111', '00010', '00010', '00010', '00010', '10010', '01100'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  W: ['10001', '10001', '10001', '10101', '10101', '11011', '10001'],
  X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00110', '01000', '10000', '11111'],
  '3': ['11111', '00010', '00100', '00010', '00001', '10001', '01110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  '6': ['01110', '10000', '10000', '11110', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00001', '01110'],
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
  '.': ['00000', '00000', '00000', '00000', '00000', '01100', '01100'],
  ',': ['00000', '00000', '00000', '00000', '01100', '00100', '01000'],
  ':': ['00000', '01100', '01100', '00000', '01100', '01100', '00000'],
  ';': ['00000', '01100', '01100', '00000', '01100', '00100', '01000'],
  '-': ['00000', '00000', '00000', '01110', '00000', '00000', '00000'],
  "'": ['00100', '00100', '01000', '00000', '00000', '00000', '00000'],
  '"': ['01010', '01010', '00000', '00000', '00000', '00000', '00000'],
  '(': ['00010', '00100', '01000', '01000', '01000', '00100', '00010'],
  ')': ['01000', '00100', '00010', '00010', '00010', '00100', '01000'],
  '/': ['00001', '00010', '00010', '00100', '01000', '01000', '10000'],
  '%': ['11001', '11010', '00010', '00100', '01000', '01011', '10011'],
  '&': ['01100', '10010', '10100', '01000', '10101', '10010', '01101'],
  '+': ['00000', '00100', '00100', '01110', '00100', '00100', '00000'],
  '?': ['01110', '10001', '00001', '00110', '00100', '00000', '00100'],
  '!': ['00100', '00100', '00100', '00100', '00100', '00000', '00100'],
  '=': ['00000', '00000', '11111', '00000', '11111', '00000', '00000'],
  $: ['00100', '01111', '10100', '01110', '00101', '11110', '00100'],
  '*': ['00000', '10101', '01110', '11111', '01110', '10101', '00000'],
};

function charWidth(scale: number) {
  return 6 * scale;
}
function textWidth(s: string, scale: number) {
  return s.length * charWidth(scale) - scale;
}
function drawText(s: string, x: number, y: number, scale: number, c: number[]) {
  let cx = x;
  for (const ch of s.toUpperCase()) {
    const g = GLYPHS[ch] ?? GLYPHS['?'];
    for (let r = 0; r < 7; r++) {
      for (let col = 0; col < 5; col++) {
        if (g[r][col] === '1') rect(cx + col * scale, y + r * scale, scale, scale, c);
      }
    }
    cx += charWidth(scale);
  }
}
function drawTextCentered(s: string, cx: number, y: number, scale: number, c: number[]) {
  drawText(s, cx - Math.floor(textWidth(s, scale) / 2), y, scale, c);
}
// Wrap text into lines that fit maxW (in px). Returns array of lines.
function wrap(s: string, scale: number, maxW: number): string[] {
  const words = s.toUpperCase().split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? cur + ' ' + w : w;
    if (textWidth(test, scale) <= maxW) {
      cur = test;
    } else {
      if (cur) lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

// ------------------------------------------------------------- illustrations
// Each draws into a box (x, y, w, h).

function artCartel(x: number, y: number, w: number, h: number) {
  // Desert dusk: sun, mesas, cactus, police badge.
  rect(x, y, w, h, [232, 196, 138]);
  disc(x + w - 52, y + 34, 22, [224, 122, 42]);
  // mesas
  rect(x, y + h - 46, w, 46, [150, 92, 52]);
  tri(x + 8, y + h - 46, x + 70, y + h - 96, x + 132, y + h - 46, [120, 70, 42]);
  tri(x + 110, y + h - 46, x + 180, y + h - 88, x + 250, y + h - 46, [120, 70, 42]);
  // cactus
  rect(x + 22, y + h - 88, 10, 52, [46, 110, 60]);
  rect(x + 12, y + h - 76, 10, 6, [46, 110, 60]);
  rect(x + 12, y + h - 76, 6, 18, [46, 110, 60]);
  rect(x + 32, y + h - 70, 10, 6, [46, 110, 60]);
  rect(x + 36, y + h - 70, 6, 16, [46, 110, 60]);
  // police badge (star) on the right
  const bx = x + w - 66;
  const by = y + h - 66;
  disc(bx, by, 30, [212, 175, 55]);
  ring(bx, by, 30, 3, [140, 108, 20]);
  disc(bx, by, 12, [29, 78, 137]);
  drawText('*', bx - 8, by - 11, 3, WHITE);
}

function artStrike(x: number, y: number, w: number, h: number) {
  // Night sky, damaged apartment blocks, explosion burst.
  rect(x, y, w, h, [38, 44, 66]);
  // stars
  const stars: [number, number][] = [[18, 14], [60, 30], [110, 12], [150, 34], [190, 16], [230, 28], [40, 48], [130, 44]];
  for (const [sx, sy] of stars) setPix(x + sx, y + sy, WHITE);
  // buildings
  rect(x + 14, y + h - 78, 54, 78, [70, 74, 84]);
  rect(x + 84, y + h - 96, 60, 96, [58, 62, 72]);
  rect(x + 160, y + h - 66, 48, 66, [70, 74, 84]);
  rect(x + 224, y + h - 88, 56, 88, [58, 62, 72]);
  // windows
  for (let wy = y + h - 70; wy < y + h - 8; wy += 14) {
    for (let wx = x + 22; wx < x + 58; wx += 14) setPix(wx, wy, [232, 196, 110]);
  }
  for (let wy = y + h - 88; wy < y + h - 8; wy += 14) {
    for (let wx = x + 92; wx < x + 134; wx += 14) setPix(wx, wy, [232, 196, 110]);
  }
  // explosion burst
  const ex = x + 116;
  const ey = y + 34;
  disc(ex, ey, 26, [240, 140, 30]);
  disc(ex, ey, 16, [250, 200, 60]);
  disc(ex, ey, 8, [255, 240, 160]);
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    line(ex, ey, Math.round(ex + 34 * Math.cos(a)), Math.round(ey + 34 * Math.sin(a)), [240, 140, 30], 3);
  }
  // smoke
  disc(x + 40, y + 26, 10, [120, 120, 128]);
  disc(x + 210, y + 20, 12, [120, 120, 128]);
}

function artClimate(x: number, y: number, w: number, h: number) {
  // Globe + clock running past deadline.
  rect(x, y, w, h, [214, 232, 222]);
  const cx = x + 62;
  const cy = y + h / 2;
  disc(cx, cy, 42, [58, 130, 180]);
  // land blobs
  disc(cx - 14, cy - 12, 12, [76, 160, 90]);
  disc(cx + 12, cy + 10, 14, [76, 160, 90]);
  disc(cx + 16, cy - 18, 8, [76, 160, 90]);
  ring(cx, cy, 42, 3, [29, 78, 137]);
  // meridian + equator
  vline(cx, cy - 42, 84, [29, 78, 137], 2);
  hline(cx - 42, cy, 84, [29, 78, 137], 2);
  // clock
  const kx = x + w - 62;
  const ky = y + h / 2;
  disc(kx, ky, 40, WHITE);
  ring(kx, ky, 40, 3, INK);
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    setPix(Math.round(kx + 34 * Math.sin(a)), Math.round(ky - 34 * Math.cos(a)), INK);
  }
  line(kx, ky, kx, ky - 26, INK, 3);
  line(kx, ky, kx + 20, ky + 10, INK, 3);
  disc(kx, ky, 4, RED);
}

function artMarkets(x: number, y: number, w: number, h: number) {
  // Falling chart on a grid.
  rect(x, y, w, h, [238, 226, 214]);
  for (let gx = x + 10; gx < x + w - 6; gx += 22) vline(gx, y + 8, h - 16, [210, 198, 184], 1);
  for (let gy = y + 10; gy < y + h - 6; gy += 20) hline(x + 8, gy, w - 16, [210, 198, 184], 1);
  // falling red line
  const pts: [number, number][] = [
    [0, 14], [30, 19], [55, 16], [85, 35], [115, 32], [145, 53], [175, 50], [205, 70], [235, 67], [262, 85],
  ];
  for (let i = 0; i < pts.length - 1; i++) {
    line(x + 12 + pts[i][0], y + 6 + pts[i][1], x + 12 + pts[i + 1][0], y + 6 + pts[i + 1][1], RED, 3);
  }
  // down arrow at the end
  const ax = x + 12 + 262;
  const ay = y + 6 + 106;
  tri(ax - 12, ay - 14, ax + 12, ay - 14, ax, ay + 8, RED);
  drawText('-3.7%', x + 14, y + h - 24, 2, RED);
}

function artMercury(x: number, y: number, w: number, h: number) {
  // Grey cratered Mercury + small twin-orbiters spacecraft.
  rect(x, y, w, h, [22, 24, 34]);
  const stars: [number, number][] = [[16, 12], [44, 30], [90, 10], [150, 22], [210, 14], [250, 36], [70, 52], [180, 48]];
  for (const [sx, sy] of stars) setPix(x + sx, y + sy, WHITE);
  const cx = x + 78;
  const cy = y + h / 2 + 4;
  disc(cx, cy, 42, [168, 162, 150]);
  disc(cx - 16, cy - 12, 9, [140, 134, 122]);
  disc(cx + 12, cy + 8, 12, [140, 134, 122]);
  disc(cx + 18, cy - 18, 6, [140, 134, 122]);
  disc(cx - 6, cy + 20, 7, [140, 134, 122]);
  ring(cx, cy, 42, 3, [120, 114, 102]);
  // spacecraft: body + two solar panels
  const sx = x + w - 78;
  const sy = y + 30;
  rect(sx - 34, sy + 6, 24, 8, [58, 120, 200]);
  rect(sx + 16, sy + 6, 24, 8, [58, 120, 200]);
  rect(sx - 8, sy, 20, 20, [220, 222, 226]);
  rect(sx - 4, sy + 4, 12, 12, [29, 78, 137]);
  // orbit arc
  ring(cx, cy, 56, 2, [120, 140, 170]);
}

function artQuake(x: number, y: number, w: number, h: number) {
  // Andes peaks, cracked ground, seismic waves.
  rect(x, y, w, h, [226, 214, 196]);
  tri(x + 6, y + h - 40, x + 70, y + 18, x + 134, y + h - 40, [120, 110, 96]);
  tri(x + 100, y + h - 40, x + 170, y + 8, x + 240, y + h - 40, [96, 88, 76]);
  tri(x + 200, y + h - 40, x + 250, y + 30, x + 292, y + h - 40, [120, 110, 96]);
  // snow caps
  tri(x + 58, y + 30, x + 70, y + 18, x + 82, y + 30, WHITE);
  tri(x + 158, y + 20, x + 170, y + 8, x + 182, y + 20, WHITE);
  // ground
  rect(x, y + h - 40, w, 40, [150, 118, 84]);
  // crack zigzag
  const crack: [number, number][] = [[0, 0], [18, 10], [10, 22], [30, 30], [22, 40]];
  let px0 = x + 130;
  let py0 = y + h - 40;
  for (const [dx, dy] of crack) {
    line(px0, py0, px0 + dx, py0 + dy, [60, 40, 26], 3);
    px0 += dx; py0 += dy;
  }
  // seismic waves
  ring(x + 236, y + h - 20, 12, 2, RED);
  ring(x + 236, y + h - 20, 20, 2, RED);
  drawText('6.7', x + 16, y + 14, 3, RED);
}

function artMosquito(x: number, y: number, w: number, h: number) {
  // Mosquito + green shield with check.
  rect(x, y, w, h, [222, 238, 224]);
  // shield
  const sx = x + 52;
  const sy = y + 16;
  rect(sx, sy, 56, 62, GREEN);
  tri(sx, sy + 62, sx + 28, sy + 84, sx + 56, sy + 62, GREEN);
  // check mark
  line(sx + 12, sy + 32, sx + 24, sy + 46, WHITE, 5);
  line(sx + 24, sy + 46, sx + 46, sy + 18, WHITE, 5);
  // mosquito body
  const mx = x + w - 86;
  const my = y + h / 2 - 6;
  // wings
  tri(mx - 8, my - 4, mx - 44, my - 30, mx - 30, my + 2, [190, 205, 210]);
  tri(mx - 8, my + 2, mx - 40, my + 26, mx - 26, my + 8, [190, 205, 210]);
  // body
  rect(mx - 10, my - 4, 44, 8, INK);
  disc(mx + 36, my, 7, INK);
  // legs
  line(mx + 2, my + 4, mx - 6, my + 26, INK, 2);
  line(mx + 16, my + 4, mx + 12, my + 28, INK, 2);
  line(mx + 28, my + 4, mx + 34, my + 24, INK, 2);
  // proboscis
  line(mx + 42, my, mx + 58, my - 6, INK, 2);
  drawText('69%', x + w - 96, y + h - 26, 3, GREEN);
}

// ------------------------------------------------------------------ layout
interface Story {
  kicker: string;
  color: number[];
  headline: string;
  summary: string;
  art: (x: number, y: number, w: number, h: number) => void;
}

const STORIES: Story[] = [
  {
    kicker: 'UKRAINE - WAR',
    color: BLUE,
    headline: 'KRYVYI RIH MISSILE STRIKE',
    summary: "Russian strike kills 2, wounds 60 in Zelenskyy's hometown.",
    art: artStrike,
  },
  {
    kicker: 'CLIMATE - COP31',
    color: TEAL,
    headline: 'CLIMATE TALKS IN OVERTIME',
    summary: 'Antalya summit passes deadline; no deal, fossil fuels absent.',
    art: artClimate,
  },
  {
    kicker: 'MARKETS',
    color: RED,
    headline: 'AI SELL-OFF SINKS STOCKS',
    summary: 'S&P 500 down 3.7%, Nikkei 5.1% on AI spending doubts.',
    art: artMarkets,
  },
  {
    kicker: 'SPACE',
    color: PURPLE,
    headline: 'BEPICOLOMBO REACHES MERCURY',
    summary: 'ESA-JAXA probe enters Mercury orbit after eight years.',
    art: artMercury,
  },
  {
    kicker: 'PERU - QUAKE',
    color: ORANGE,
    headline: 'STRONG QUAKE SHAKES ANDES',
    summary: 'Magnitude 6.7 tremor near Junin rattles Lima; no deaths.',
    art: artQuake,
  },
  {
    kicker: 'HEALTH - BRAZIL',
    color: GREEN,
    headline: 'MOSQUITOES THAT BEAT DENGUE',
    summary: 'Wolbachia mosquitoes cut dengue infections 69% in Brazil.',
    art: artMosquito,
  },
];

function drawPanel(s: Story, x: number, y: number, w: number, h: number) {
  rect(x, y, w, h, PANEL);
  rect(x, y, w, 3, s.color);
  rect(x, y, 3, h, s.color);
  rect(x + w - 3, y, 3, h, s.color);
  rect(x, y + h - 3, w, 3, s.color);
  // kicker
  drawText(s.kicker, x + 12, y + 12, 2, s.color);
  // art
  const artH = 100;
  s.art(x + 10, y + 36, w - 20, artH);
  // headline
  const headLines = wrap(s.headline, 3, w - 24);
  let ty = y + 36 + artH + 10;
  for (const ln of headLines.slice(0, 2)) {
    drawText(ln, x + 12, ty, 3, INK);
    ty += 24;
  }
  // summary
  const sumLines = wrap(s.summary, 2, w - 24);
  ty += 4;
  for (const ln of sumLines.slice(0, 3)) {
    drawText(ln, x + 12, ty, 2, INK_SOFT);
    ty += 17;
  }
}

// -------------------------------------------------------------------- main
function main() {
  fill(PAPER);
  const M = 24; // margin

  // Masthead
  rect(M, M, W - 2 * M, 4, RED);
  drawTextCentered('THE WORLD IN ONE DAY', W / 2, M + 16, 2, RED);
  drawTextCentered('21 NOVEMBER 2026', W / 2, M + 42, 6, INK);
  drawTextCentered('SATURDAY - SEVEN STORIES FROM AROUND THE GLOBE', W / 2, M + 96, 2, INK_SOFT);
  hline(M, M + 126, W - 2 * M, INK, 2);

  // Lead story: Mexico cartel capture
  const leadY = M + 140;
  const leadH = 236;
  rect(M, leadY, W - 2 * M, leadH, PANEL);
  rect(M, leadY, W - 2 * M, 3, RED);
  rect(M, leadY, 3, leadH, RED);
  rect(M + W - 2 * M - 3, leadY, 3, leadH, RED);
  rect(M, leadY + leadH - 3, W - 2 * M, 3, RED);
  drawText('MEXICO - JUSTICE', M + 16, leadY + 14, 2, RED);
  artCartel(M + 16, leadY + 44, 300, leadH - 60);
  const tx = M + 336;
  const tw = W - 2 * M - 336 - 16;
  const leadHead = wrap("MEXICO CAPTURES 'EL CHAPO ISIDRO'", 4, tw);
  let ty = leadY + 52;
  for (const ln of leadHead) {
    drawText(ln, tx, ty, 4, INK);
    ty += 32;
  }
  ty += 6;
  const leadSum = wrap(
    'FBI MOST-WANTED CARTEL BOSS FAUSTO ISIDRO MEZA FLORES SEIZED IN SINALOA WITH US HELP; VIOLENCE FLARES AFTER THE RAID.',
    2,
    tw,
  );
  for (const ln of leadSum) {
    drawText(ln, tx, ty, 2, INK_SOFT);
    ty += 17;
  }
  drawText('GUASAVE, SINALOA', tx, leadY + leadH - 34, 2, RED);

  // Grid of six stories: 3 x 2
  const gridY = leadY + leadH + 16;
  const gridW = W - 2 * M;
  const gap = 14;
  const colW = Math.floor((gridW - 2 * gap) / 3);
  const rowH = 272;
  for (let i = 0; i < 6; i++) {
    const col = i % 3;
    const row = Math.floor(i / 3);
    drawPanel(STORIES[i], M + col * (colW + gap), gridY + row * (rowH + gap), colW, rowH);
  }

  // Footer
  const fy = gridY + 2 * rowH + gap + 12;
  hline(M, fy, W - 2 * M, INK, 2);
  drawTextCentered('SOURCES: AP - REUTERS - ESA - USGS  -  ALL EVENTS OF 21 NOVEMBER 2026', W / 2, fy + 10, 2, INK_SOFT);

  // Encode PNG (RGB, filter 0 per row)
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0;
    raw.set(px.subarray(y * W * 3, (y + 1) * W * 3), y * (1 + W * 3) + 1);
  }
  const idat = deflateSync(raw, { level: 9 });
  const crcTable = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crcTable[n] = c;
  }
  const crc32 = (buf: Buffer): number => {
    let c = 0xffffffff;
    for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type: string, data: Buffer): Buffer => {
    const out = Buffer.alloc(12 + data.length);
    out.writeUInt32BE(data.length, 0);
    out.write(type, 4, 'ascii');
    data.copy(out, 8);
    out.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, 'ascii'), data])), 8 + data.length);
    return out;
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type RGB
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'entry.png'), png);
}

main();
