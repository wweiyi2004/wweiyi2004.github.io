// The card script: a geometric cipher of the Latin alphabet, drawn on a 10×12 grid.
// Letters are mirrored, inverted or swapped for symbols (Δ ⅃ ꟼ ʎ ɱ ʘ ⊕ ƺ …), in the
// spirit of the anime's adventurer card. Shared by the card (js/card.js) and the guild.
(function () {
  'use strict';

  const LETTERS = {
    A: 'M0 12L5 0L10 12ZM5 8.6V8.61',
    B: 'M5 0C0 0 0 6 5 6C0 6 0 12 5 12M5 0V12M5 6H10',
    C: 'M2 1C7 -1 10 3 10 6C10 10 7 12 2 11',
    D: 'M8 1C3 -1 0 2 0 6C0 10 3 12 6 12C9 12 10 10 10 8C10 5 7 4 4 6',
    E: 'M0 0H10L4 5C10 5 11 12 4 12C2 12 1 11 1 10',
    F: 'M7 12V3C7 0 3 0 2 2M4 7H10',
    G: 'M9 4C9 0 1 0 1 6C1 12 9 12 9 8V12',
    H: 'M0 0V12M10 0V12M0 6L5 3L10 6',
    I: 'M5 0V12M1 4L5 0L9 4',
    J: 'M2 0C0 4 0 12 5 12C10 12 10 4 8 0',
    K: 'M9 0V12M1 0C5 2 7 4 9 6C6 7 3 9 1 12',
    L: 'M8 0V12H0',
    M: 'M0 12V3C0 0 5 0 5 4C5 0 10 0 10 3V9C10 12 7 12 7 10',
    N: 'M0 0V9C0 12 10 12 10 9V0M5 0V7',
    O: 'M5 0A5 6 0 1 1 5 12A5 6 0 1 1 5 0ZM5 6V6.01',
    P: 'M9 0V12M9 0C0 0 0 7 9 7',
    Q: 'M5 0A5 6 0 1 1 5 12A5 6 0 1 1 5 0ZM0 6H10M5 0V12',
    R: 'M0 12V5C0 0 10 0 10 5M3 12L7 7',
    S: 'M1 1C7 -1 10 3 5 6C0 9 3 13 9 11',
    T: 'M0 12H10M5 12V0',
    U: 'M0 12V5C0 -1 10 -1 10 5V12M3 8H7',
    V: 'M0 0C0 6 10 6 10 0M5 4.5V12',
    W: 'M0 12L2.5 0L5 7L7.5 0L10 12',
    X: 'M0 0L10 12M10 0L0 12M0 6H3M7 6H10',
    Y: 'M0 12L5 5L10 12M5 5V0',
    Z: 'M0 6L5 0L10 6L5 12Z',
  };
  const DIGITS = [
    'M5 0A5 6 0 1 1 5 12A5 6 0 1 1 5 0Z',
    'M2 3C4 2 5 1 5 0V12',
    'M1 3C1 -1 9 -1 9 3C9 6 1 9 1 12H10',
    'M1 1C5 -1 9 1 9 3C9 5 7 6 4 6C8 6 10 7 10 9C10 12 4 13 1 11',
    'M7 12V0L0 8H10',
    'M9 0H2L1 5C5 4 10 5 10 8.5C10 12 4 13 1 11',
    'M8 0C3 1 1 5 1 8C1 11 3 12 5 12C8 12 10 10 10 8C10 5 7 4 5 4C3 4 1 6 1 8',
    'M0 0H10C6 4 4 8 4 12',
    'M5 6C1 6 1 0 5 0C9 0 9 6 5 6C0 6 0 12 5 12C10 12 10 6 5 6Z',
    'M9 4C9 7 7 8 5 8C2 8 1 6 1 4C1 2 3 0 5 0C8 0 9 2 9 5C9 9 6 12 2 12',
  ];
  const PUNCT = {
    '.': ['dot', 'M5 11V11.01'],
    ':': ['colon', 'M5 4V4.01M5 10V10.01'],
    ';': ['semi', 'M5 4V4.01M5 9L4 12'],
    ',': ['comma', 'M5 10L4 12.5'],
    '·': ['mid', 'M5 6V6.01'],
    '-': ['dash', 'M2 6H8'],
    '/': ['slash', 'M8 0L2 12'],
    '‹': ['lt', 'M8 1L2 6L8 11'],
    '›': ['gt', 'M2 1L8 6L2 11'],
    '≈': ['wave', 'M0 4Q2.5 2 5 4T10 4M0 8Q2.5 6 5 8T10 8'],
  };
  const NARROW = new Set(['dot', 'colon', 'semi', 'comma', 'mid']);

  const PATHS = {};
  for (const k in LETTERS) PATHS[k] = LETTERS[k];
  DIGITS.forEach((d, i) => { PATHS['d' + i] = d; });
  for (const k in PUNCT) PATHS[PUNCT[k][0]] = PUNCT[k][1];

  function glyphId(ch) {
    if (ch >= 'A' && ch <= 'Z') return ch;
    if (ch >= '0' && ch <= '9') return 'd' + ch;
    return PUNCT[ch] ? PUNCT[ch][0] : null;
  }

  // Positions each glyph of `str` at height h; o: { gap, space, max }
  function layout(str, h, o) {
    o = o || {};
    const w = (h * 10) / 12;
    const gap = w * (o.gap != null ? o.gap : 0.32);
    const space = w * (o.space != null ? o.space : 0.7);
    const items = [];
    let cx = 0;
    for (const ch of String(str).toUpperCase()) {
      const id = ch === ' ' ? null : glyphId(ch);
      if (!id) { cx += space; continue; }
      const narrow = NARROW.has(id);
      const gw = narrow ? w * 0.45 : w;
      if (o.max != null && cx + gw > o.max) break;
      items.push([id, narrow ? cx - w * 0.275 : cx]);
      cx += gw + gap;
    }
    return { items, w, width: Math.max(0, cx - gap) };
  }

  // A self-contained inline SVG of a line of script, drawn in currentColor.
  // o: { sw (stroke width in grid units), gap, space, max, label, vertical }
  // `vertical` turns the line 90 degrees so it reads top to bottom.
  function svg(str, h, o) {
    o = o || {};
    const L = layout(str, h, o);
    const k = h / 12;
    const sw = (o.sw != null ? o.sw : 1.3) / k;
    const pad = 2;
    const paths = L.items.map(([id, dx]) =>
      `<path transform="translate(${(dx + pad).toFixed(2)} ${pad}) scale(${k.toFixed(4)})" d="${PATHS[id]}" stroke-width="${sw.toFixed(2)}"/>`).join('');
    const W = (L.width + pad * 2).toFixed(1);
    const Hh = (h + pad * 2).toFixed(1);
    const label = o.label ? ` role="img" aria-label="${o.label}"` : ' aria-hidden="true"';
    const attrs = 'fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"';
    if (o.vertical) {
      return `<svg class="glyphs" viewBox="0 0 ${Hh} ${W}" width="${Hh}" height="${W}"${label} ${attrs}>` +
        `<g transform="translate(${Hh} 0) rotate(90)">${paths}</g></svg>`;
    }
    return `<svg class="glyphs" viewBox="0 0 ${W} ${Hh}" width="${W}" height="${Hh}"${label} ${attrs}>${paths}</svg>`;
  }

  // Deterministic filler "words" in the script, for decorative bands
  const POOL = 'AAAEEEEIIOOUNNNRRSSSTTTLLMDDKHCGPBVYZWXF';
  function babble(words, rand, punct) {
    const out = [];
    for (let i = 0; i < words; i++) {
      let w = '';
      const n = 2 + Math.floor(rand() * 7);
      for (let j = 0; j < n; j++) w += POOL[Math.floor(rand() * POOL.length)];
      if (punct && rand() < 0.14) w += rand() < 0.6 ? '.' : ':';
      out.push(w);
    }
    return out.join(' ');
  }

  function rng(seed) {
    let s = seed >>> 0;
    return function () {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  window.GLYPHS = { LETTERS, DIGITS, PUNCT, NARROW, PATHS, glyphId, layout, svg, babble, rng };
})();
