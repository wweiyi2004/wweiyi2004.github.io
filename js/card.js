(function () {
  'use strict';

  const P = window.PROFILE;
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.getElementById('card');
  const wand = document.getElementById('wand');

  // ---------- helpers ----------

  function $(tag, attrs, parent) {
    const n = document.createElementNS(NS, tag);
    if (attrs) for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  function stroke(parent, d, sw, extra) {
    return $('path', Object.assign({ d, fill: 'none', stroke: 'currentColor', 'stroke-width': sw || 1.5 }, extra), parent);
  }

  function chamfer(x, y, w, h, c) {
    return `M${x + c} ${y}H${x + w - c}L${x + w} ${y + c}V${y + h - c}L${x + w - c} ${y + h}H${x + c}L${x} ${y + h - c}V${y + c}Z`;
  }

  let seed = P.seed >>> 0;
  function rand() {
    seed = (seed + 0x6d2b79f5) >>> 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // ---------- glyph script (alphabet and layout live in js/glyphs.js) ----------

  const { LETTERS, DIGITS, PUNCT } = window.GLYPHS;
  const layout = (str, h, o) => window.GLYPHS.layout(str, h, o);

  // Draws a line of script; o: { sw, gap, space, maxX, anchor }
  function run(parent, str, x, y, h, o) {
    o = o || {};
    const L = layout(str, h, { gap: o.gap, space: o.space, max: o.maxX != null ? o.maxX - x : null });
    let ox = x;
    if (o.anchor === 'middle') ox = x - L.width / 2;
    else if (o.anchor === 'end') ox = x - L.width;
    const g = $('g', { 'stroke-width': o.sw || 1.3 }, parent);
    for (const [id, dx] of L.items) {
      $('use', { href: '#g-' + id, x: (ox + dx).toFixed(2), y, width: L.w.toFixed(2), height: h }, g);
    }
    return L.width;
  }

  const POOL = 'AAAEEEEIIOOUNNNRRSSSTTTLLMDDKHCGPBVYZWXF';
  function babble(words, punct) {
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

  // Readable Chinese text, vertically centered on cy
  function zh(parent, str, x, cy, size, o) {
    o = o || {};
    const t = $('text', {
      x, y: cy, class: 'zh',
      'font-size': size,
      'font-weight': o.weight || 500,
      'text-anchor': o.anchor || 'start',
      'dominant-baseline': 'central',
      'letter-spacing': o.ls || 0,
    }, parent);
    t.textContent = str;
    // stretch to the width of the matching script line by widening the gaps
    // (Chinese only, and no gap grows by more than one character)
    const n = [...str].length;
    const len = o.fit && n > 1 && /[㐀-鿿]/.test(str) ? t.getComputedTextLength() : 0;
    if (len && len < o.fit) {
      t.setAttribute('textLength', Math.min(o.fit, len + (n - 1) * size).toFixed(1));
      t.setAttribute('lengthAdjust', 'spacing');
    }
    return t;
  }

  // ---------- defs ----------

  const defs = $('defs', null, svg);

  function symbol(id, d) {
    const s = $('symbol', { id: 'g-' + id, viewBox: '0 0 10 12', overflow: 'visible' }, defs);
    $('path', { d, fill: 'none', stroke: 'currentColor', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, s);
  }
  for (const k in LETTERS) symbol(k, LETTERS[k]);
  DIGITS.forEach((d, i) => symbol('d' + i, d));
  for (const k in PUNCT) symbol(PUNCT[k][0], PUNCT[k][1]);

  defs.insertAdjacentHTML('beforeend', `
    <clipPath id="cardClip"><path id="cardClipPath"/></clipPath>
    <clipPath id="portraitClip"><rect id="portraitClipRect"/></clipPath>
    <radialGradient id="vignette" cx="50%" cy="50%" r="72%">
      <stop offset="0.55" stop-color="#6e5a32" stop-opacity="0"/>
      <stop offset="1" stop-color="#6e5a32" stop-opacity="0.2"/>
    </radialGradient>
    <linearGradient id="gemGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${P.gem[0]}"/>
      <stop offset="0.5" stop-color="${P.gem[1]}"/>
      <stop offset="1" stop-color="${P.gem[2]}"/>
    </linearGradient>
    <filter id="tone" x="0" y="0" width="1" height="1">
      <feTurbulence type="fractalNoise" baseFrequency="0.006 0.011" numOctaves="3" seed="8"/>
      <feColorMatrix type="matrix" values="0 0 0 0 0.45  0 0 0 0 0.4  0 0 0 0 0.26  0 0 0 0.4 -0.12"/>
    </filter>
    <filter id="grain" x="0" y="0" width="1" height="1">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="2"/>
      <feColorMatrix type="matrix" values="0 0 0 0 0.3  0 0 0 0 0.24  0 0 0 0 0.15  0 0 0 0.9 -0.4"/>
    </filter>
    <filter id="printed" color-interpolation-filters="sRGB">
      <feColorMatrix type="matrix" values="0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0 0 0 1 0"/>
      <feComponentTransfer>
        <feFuncR type="linear" slope="1.3" intercept="-0.12"/>
        <feFuncG type="linear" slope="1.3" intercept="-0.12"/>
        <feFuncB type="linear" slope="1.3" intercept="-0.12"/>
      </feComponentTransfer>
      <feComponentTransfer>
        <feFuncR type="table" tableValues="0.29 0.92"/>
        <feFuncG type="table" tableValues="0.25 0.89"/>
        <feFuncB type="table" tableValues="0.17 0.78"/>
      </feComponentTransfer>
    </filter>
    <pattern id="hatchV" width="5" height="10" patternUnits="userSpaceOnUse">
      <path d="M2.5 0V10" stroke="currentColor" stroke-width="1.3"/>
    </pattern>
    <pattern id="hatchH" width="10" height="7" patternUnits="userSpaceOnUse">
      <path d="M0 3.5H10" stroke="currentColor" stroke-width="0.7" opacity="0.55"/>
    </pattern>
    <pattern id="hatchD" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(40)">
      <path d="M0 2.5H5" stroke="currentColor" stroke-width="0.9"/>
    </pattern>
  `);

  const ICONS = {
    book: 'M3 5Q8 3 12 6Q16 3 21 5V19Q16 17 12 20Q8 17 3 19ZM12 6V20',
    image: 'M3 19L9 10L13 15L16 12L21 19ZM16 6.5A1.5 1.5 0 1 0 16.01 6.5',
    quill: 'M20 3C11 5 7 11 5 21M20 3C19 10 14 14 8 15M9 11H13',
    code: 'M8 7L3 12L8 17M16 7L21 12L16 17M14 5L10 19',
    rss: 'M5 19V19.01M5 12A7 7 0 0 1 12 19M5 5A14 14 0 0 1 19 19',
    user: 'M12 12A4 4 0 1 0 12.01 12M4 21C5 16 8 14 12 14S19 16 20 21',
    // little TV with tilted antennas and slanted eyes
    bilibili: 'M7 2.5L10 5.5M17 2.5L14 5.5M6 5.5H18A3 3 0 0 1 21 8.5V16A3 3 0 0 1 18 19H6A3 3 0 0 1 3 16V8.5A3 3 0 0 1 6 5.5ZM7.5 10.5L10 11.7M16.5 10.5L14 11.7',
    // penguin with a scarf
    qq: 'M12 3C8.7 3 7.2 5.8 7.2 8.6C7.2 9.8 6.7 10.8 6 11.8C4.8 13.5 4.4 15.8 5.4 17C6 16.4 6.6 15.8 7.1 15.2C7.6 18 9.6 20 12 20C14.4 20 16.4 18 16.9 15.2C17.4 15.8 18 16.4 18.6 17C19.6 15.8 19.2 13.5 18 11.8C17.3 10.8 16.8 9.8 16.8 8.6C16.8 5.8 15.3 3 12 3ZM10.2 7.2V8.4M13.8 7.2V8.4M8 11.6Q12 13.6 16 11.6M8.6 20.2L10.6 21.4M15.4 20.2L13.4 21.4',
    // retro TV with a V antenna, an inner screen and two feet
    bangumi: 'M8 2L12 5.5L16 2M6 5.5H18A2 2 0 0 1 20 7.5V16.5A2 2 0 0 1 18 18.5H6A2 2 0 0 1 4 16.5V7.5A2 2 0 0 1 6 5.5ZM7.5 8.5H16.5V15.5H7.5ZM7 18.5V21M17 18.5V21',
  };

  // The bearer's details are foil-stamped: they are drawn white into a mask and a
  // card-wide gold gradient shows through it, so one sheen runs across every line.
  defs.insertAdjacentHTML('beforeend', `
    <linearGradient id="foil" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="460" y2="170" spreadMethod="reflect">
      <stop offset="0" stop-color="#5c4113"/>
      <stop offset="0.2" stop-color="#8c6726"/>
      <stop offset="0.34" stop-color="#c8a75e"/>
      <stop offset="0.42" stop-color="#9a7431"/>
      <stop offset="0.62" stop-color="#71521a"/>
      <stop offset="0.8" stop-color="#a6833d"/>
      <stop offset="1" stop-color="#674915"/>
    </linearGradient>
    <filter id="emboss" x="0" y="0" width="1" height="1" color-interpolation-filters="sRGB">
      <feMorphology in="SourceAlpha" operator="dilate" radius="0.45" result="rim"/>
      <feFlood flood-color="#3b290a" flood-opacity="0.4"/>
      <feComposite in2="rim" operator="in" result="edge"/>
      <feGaussianBlur in="SourceAlpha" stdDeviation="0.5" result="a"/>
      <feOffset in="a" dx="0.9" dy="1.1" result="drop"/>
      <feFlood flood-color="#3b290a" flood-opacity="0.75"/>
      <feComposite in2="drop" operator="in" result="shadow"/>
      <feOffset in="SourceAlpha" dx="-0.45" dy="-0.55" result="lift"/>
      <feFlood flood-color="#fff1c4" flood-opacity="0.45"/>
      <feComposite in2="lift" operator="in" result="light"/>
      <feMerge><feMergeNode in="edge"/><feMergeNode in="shadow"/><feMergeNode in="light"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <mask id="infoGl" maskUnits="userSpaceOnUse" x="-5000" y="-5000" width="20000" height="20000">
      <g id="infoGlInk" style="color:#fff"/>
    </mask>
    <mask id="infoZh" maskUnits="userSpaceOnUse" x="-5000" y="-5000" width="20000" height="20000">
      <g id="infoZhInk" style="color:#fff"/>
    </mask>
  `);
  const GI = document.getElementById('infoGlInk');
  const ZI = document.getElementById('infoZhInk');
  const foil = document.getElementById('foil');

  const base = $('g', null, svg);
  const G = $('g', { class: 'layer-glyph', mask: 'url(#maskGl)' }, svg);
  const Z = $('g', { class: 'layer-zh', mask: 'url(#maskZh)' }, svg);

  // the lens: Chinese shows inside the circle, the card script everywhere else
  defs.insertAdjacentHTML('beforeend', `
    <radialGradient id="lensIn"><stop offset="0.8" stop-color="#fff"/><stop offset="1" stop-color="#000"/></radialGradient>
    <radialGradient id="lensOut"><stop offset="0.8" stop-color="#000"/><stop offset="1" stop-color="#fff"/></radialGradient>
    <mask id="maskZh" maskUnits="userSpaceOnUse" x="-5000" y="-5000" width="20000" height="20000">
      <circle id="lensZh" cx="-9999" cy="-9999" r="0" fill="url(#lensIn)"/>
    </mask>
    <mask id="maskGl" maskUnits="userSpaceOnUse" x="-5000" y="-5000" width="20000" height="20000">
      <rect x="-5000" y="-5000" width="20000" height="20000" fill="#fff"/>
      <circle id="lensGl" cx="-9999" cy="-9999" r="0" fill="url(#lensOut)"/>
    </mask>
  `);

  // The card is laid out on a 1300×770 design and stretched to the window:
  // the left block stays put, the right column follows the right edge (R), the
  // tables grow downward (T/B), and everything in between widens.
  const stage = document.getElementById('stage');

  function render() {
    const vw = stage.clientWidth;
    const vh = stage.clientHeight;
    if (!vw || !vh) return;
    const ar = vw / vh;
    const W = Math.round(Math.min(2400, Math.max(1300, 770 * ar)));
    const H = Math.round(Math.min(1000, Math.max(770, 1300 / ar)));
    const dx = W - 1300;
    const dy = H - 770;
    const dt = Math.round(dy * 0.3);
    const dm = dy - dt;
    const R = (x) => x + dx;
    const T = (y) => y + dt;
    const B = (y) => y + dy;

    seed = P.seed >>> 0;
    base.replaceChildren();
    G.replaceChildren();
    Z.replaceChildren();
    GI.replaceChildren();
    ZI.replaceChildren();
    for (const [layer, mask] of [[G, 'url(#infoGl)'], [Z, 'url(#infoZh)']]) {
      const g = $('g', { filter: 'url(#emboss)' }, layer);
      $('rect', { x: 0, y: 0, width: W, height: H, fill: 'url(#foil)', mask }, g);
    }
    svg.classList.remove('show-label');
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    document.getElementById('cardClipPath').setAttribute('d', chamfer(0, 0, W, H, 28));
    const pc = document.getElementById('portraitClipRect');
    pc.setAttribute('x', R(944));
    pc.setAttribute('y', 106);
    pc.setAttribute('width', 286);
    pc.setAttribute('height', 234 + dt);

    // ---------- paper & frame ----------

    $('path', { d: chamfer(0, 0, W, H, 28), class: 'paper' }, base);
    $('rect', { x: 0, y: 0, width: W, height: H, filter: 'url(#tone)', 'clip-path': 'url(#cardClip)' }, base);
    $('rect', { x: 0, y: 0, width: W, height: H, filter: 'url(#grain)', 'clip-path': 'url(#cardClip)', opacity: 0.55 }, base);
    $('path', { d: chamfer(0, 0, W, H, 28), fill: 'url(#vignette)' }, base);

    stroke(base, chamfer(10, 10, W - 20, H - 20, 22), 1.6);
    stroke(base, chamfer(16, 16, W - 32, H - 32, 18), 3);

    // dense script bands, top and bottom
    function band(yTop, flip) {
      const y1 = flip ? yTop + 48 : yTop;
      const y2 = flip ? yTop : yTop + 48;
      const xr = W - 40;
      stroke(base, `M40 ${y1}H${xr}`, 1.4);
      stroke(base, `M40 ${y2 - (flip ? -6 : 6)}H${xr}`, 1.4);
      stroke(base, `M40 ${y2}H${xr}`, 3);
      stroke(base, `M40 ${yTop}L30 ${yTop + 10}V${yTop + 38}L40 ${yTop + 48}`, 1.4);
      stroke(base, `M${xr} ${yTop}L${xr + 10} ${yTop + 10}V${yTop + 38}L${xr} ${yTop + 48}`, 1.4);
      const r1 = flip ? yTop + 11 : yTop + 5;
      const words = Math.ceil(W / 8);
      run(base, babble(words), 50, r1, 12, { sw: 3.2, gap: 0.06, space: 0.3, maxX: W - 50 });
      run(base, babble(words), 50, r1 + 18, 12, { sw: 3.2, gap: 0.06, space: 0.3, maxX: W - 50 });
    }
    band(26, false);
    band(B(696), true);

    stroke(base, chamfer(26, 84, W - 52, 604 + dy, 10), 1.2);

    // left rail with gem
    const gy = 375 + Math.round(dy / 2);
    stroke(base, `M60 108L46 122V${gy - 37}`, 1.6);
    stroke(base, `M46 ${gy + 37}V${B(652)}L60 ${B(666)}`, 1.6);
    stroke(base, `M38 ${gy - 37}H54M38 ${gy + 37}H54`, 1.4);
    const gem = $('g', { transform: `translate(0 ${gy - 375})` }, base);
    $('path', { d: 'M46 348L61 375L46 402L31 375Z', fill: 'url(#gemGrad)', stroke: 'currentColor', 'stroke-width': 1.6 }, gem);
    stroke(gem, 'M46 348L46 360M31 375L39 375M61 375L53 375M46 402L46 390M46 360L53 375L46 390L39 375Z', 0.9);
    $('path', { d: 'M41 365L45 357L44 368Z', fill: '#fff', opacity: 0.55 }, gem);

    // ---------- name block ----------

    stroke(base, `M78 96H${R(912)}V212H78Z`, 1.6);
    stroke(base, `M86 104H${R(904)}V204H86Z`, 1);
    stroke(base, 'M78 126H66V182H78', 1.6);
    $('path', { d: 'M69 154L76 149V159Z', fill: 'currentColor' }, base);

    const wReg = run(G, '≈ ADVENTURERS. GUILD. REGISTRY. CARD ≈', 110, 113, 9, { sw: 1.4, gap: 0.3, maxX: 700 });
    zh(Z, '冒险者公会 · 登记证', 110, 118, 13, { ls: 2, fit: wReg });

    const wName = run(GI, P.latinName, 112, 133, 50, { sw: 1.5, gap: 0.36, maxX: R(890) });
    zh(ZI, P.name, 112, 162, 64, { weight: 700, ls: 3, fit: wName });

    const wSub = run(GI, P.latinSub, 94, 223, 15, { sw: 1.5, gap: 0.3, maxX: R(880) });
    zh(ZI, `职业：${P.job}　·　${P.title}`, 94, 231, 23, { weight: 700, fit: wSub });

    stroke(base, `M80 254H${R(846)}L${R(888)} ${T(296)}`, 1.5);
    stroke(base, 'M90 249L80 254L90 259', 1.5);

    const descWords = Math.ceil(W / 28);
    const wDesc = [];
    for (let i = 0; i < 3; i++) {
      const maxX = i === 2 ? Math.round(98 + (R(860) - 98) * 0.68) : R(860);
      wDesc.push(run(GI, babble(descWords, true) + '.', 98, 268 + i * 20, 11, { sw: 1.3, gap: 0.14, space: 0.5, maxX }));
    }
    (P.intro || []).slice(0, 3).forEach((line, i) => zh(ZI, line, 98, 274 + i * 28, 22, { weight: 600, fit: wDesc[i] }));

    // rule that closes the profile block and runs into the level box
    stroke(base, `M80 ${T(352)}H${R(888)}`, 1.5);

    // ---------- portrait ----------

    stroke(base, chamfer(R(930), 92, 338, 260 + dt, 18), 1.8);
    stroke(base, chamfer(R(938), 100, 322, 244 + dt, 13), 1);
    stroke(base, `M${R(1236)} 112V${332 + dt}`, 1);
    const vcol = $('g', { transform: `translate(${R(1252)} 118) rotate(90)` }, base);
    run(vcol, babble(30), 0, 0, 11, { sw: 1.6, gap: 0.2, space: 0.5, maxX: 210 + dt });

    const portrait = $('g', { 'clip-path': 'url(#portraitClip)' }, base);
    if (P.avatar) {
      $('image', { href: P.avatar, x: R(944), y: 106, width: 286, height: 234 + dt, preserveAspectRatio: 'xMidYMid slice', filter: 'url(#printed)' }, portrait);
    } else {
      const fig = $('g', { transform: `translate(${R(948)} ${104 + dt})`, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, portrait);
      const body = 'M60 236C70 200 100 186 126 176L150 206L176 178C210 184 246 200 262 236Z';
      $('path', { d: body, fill: 'url(#hatchD)' }, fig);
      stroke(fig, body, 1.6);
      stroke(fig, 'M122 128L126 176M172 150L176 178', 1.6);
      $('path', {
        d: 'M200 78C206 88 208 96 210 104L220 122L210 126C212 132 211 136 207 138C209 144 205 152 196 154C184 156 172 150 164 142',
        fill: 'var(--paper)', stroke: 'currentColor', 'stroke-width': 1.6,
      }, fig);
      // hair: spikes swept back around the skull, then bangs over the forehead
      const hx = 145, hy = 88, hrx = 60, hry = 56, N = 7, a0 = 150, a1 = 345;
      const pt = (deg, k) => {
        const a = (deg * Math.PI) / 180;
        return `${(hx + hrx * k * Math.cos(a)).toFixed(1)} ${(hy + hry * k * Math.sin(a)).toFixed(1)}`;
      };
      let hair = 'M' + pt(a0, 0.98);
      for (let i = 0; i < N; i++) {
        const d = (a1 - a0) / N;
        hair += 'L' + pt(a0 + d * (i + 0.5) - 16, 1.14) + 'L' + pt(a0 + d * (i + 1), 0.99);
      }
      hair += 'L208 92L197 86L199 104L188 96L172 100L160 114L150 126L132 130L112 126Z';
      $('path', { d: hair, class: 'paper', stroke: 'currentColor', 'stroke-width': 1.6 }, fig);
      stroke(fig, 'M112 66L128 84M140 50L148 74M168 52L170 76M98 92L116 100', 1);
      stroke(fig, 'M180 100L194 98M187 104H190', 1.6);
    }

    // ---------- level (moves as one unit) ----------

    const shift = `translate(${dx} ${dt})`;
    const lv = $('g', { transform: shift }, base);
    const lvG = $('g', { transform: shift }, G);
    const lvZ = $('g', { transform: shift }, Z);
    const lvGI = $('g', { transform: shift }, GI);
    const lvZI = $('g', { transform: shift }, ZI);
    $('path', { d: 'M888 300H1000V398H888Z', class: 'paper', stroke: 'currentColor', 'stroke-width': 1.8 }, lv);
    stroke(lv, 'M894 306H994V392H894Z', 1);
    stroke(lv, 'M894 328H994', 1);
    stroke(lv, 'M880 312V292H900M1008 312V292H988M880 386V406H900M1008 386V406H988', 1.4);
    $('path', {
      d: 'M944 296C938 288 938 280 944 272C950 280 950 288 944 296ZM944 296C934 294 928 288 926 280C934 280 940 286 944 296ZM944 296C954 294 960 288 962 280C954 280 948 286 944 296Z',
      class: 'paper', stroke: 'currentColor', 'stroke-width': 1.3,
    }, lv);
    stroke(lv, 'M926 299H962', 1.3);
    [934, 944, 954].forEach((x) => $('circle', { cx: x, cy: 384, r: 1.8, fill: 'currentColor' }, lv));
    const wLv = run(lvG, '‹ OOO ›', 944, 312, 9, { sw: 1.3, gap: 0.3, anchor: 'middle' });
    zh(lvZ, '等级 Lv.', 944, 317, 12, { anchor: 'middle', ls: 1, fit: wLv });
    run(lvGI, String(P.level), 944, 337, 34, { sw: 2.6, gap: 0.3, anchor: 'middle' });
    zh(lvZI, String(P.level), 944, 358, 52, { anchor: 'middle', weight: 700 });

    // ---------- stats ----------

    const top = T(408);
    const bot = B(682);
    const sx1 = 476 + Math.round(dx / 2);
    const wStats = run(G, 'ABILITY SCORES OF THE BEARER', 98, T(370), 20, { sw: 3.4, gap: 0.12, space: 0.4, maxX: Math.round(660 + dx / 2) });
    zh(Z, '能力值', 98, T(380), 20, { weight: 700, ls: 6, fit: wStats }).classList.add('form');

    stroke(base, `M88 ${top}H${sx1}V${bot}H88Z`, 1.1);
    function eye(cx, cy) {
      stroke(base, `M${cx - 9} ${cy}Q${cx} ${cy - 7} ${cx + 9} ${cy}Q${cx} ${cy + 7} ${cx - 9} ${cy}Z`, 1.2);
      $('circle', { cx, cy, r: 2, fill: 'currentColor' }, base);
    }
    const rh = 32 + Math.min(10, Math.round(dm / 12));
    const pitch = (bot - 30 - T(418)) / 6;
    P.stats.slice(0, 6).forEach(([label, latin, value], i) => {
      const y = Math.round(T(418) + i * pitch);
      const cy = y + rh / 2;
      stroke(base, `M104 ${y}H${sx1 - 8}V${y + rh}H104L94 ${cy}Z`, 1.3);
      const wLabel = run(G, latin, 116, cy - 6, 12, { sw: 1.4, gap: 0.3, maxX: sx1 - 140 });
      zh(Z, label, 116, cy, 16, { weight: 500, ls: 2, fit: wLabel }).classList.add('form');
      eye(sx1 - 124, cy);
      eye(sx1 - 30, cy);
      run(GI, String(value), sx1 - 77, cy - 8, 16, { sw: 2.6, gap: 0.3, anchor: 'middle' });
      zh(ZI, String(value), sx1 - 77, cy + 1, 30, { anchor: 'middle', weight: 700 });
    });
    const sdx = Math.round((88 + sx1) / 2);
    [-10, 0, 10].forEach((o) => $('circle', { cx: sdx + o, cy: B(668), r: 1.8, fill: 'currentColor' }, base));

    // ---------- skills ----------

    const kx0 = 490 + Math.round(dx / 2);
    const kx1 = R(790);
    stroke(base, `M${kx0} ${top}H${kx1}V${bot}H${kx0}Z`, 1.1);
    const wSkills = run(G, 'ACQUIRED SKILLS', kx0 + 14, T(418), 18, { sw: 3.4, gap: 0.12, space: 0.4, maxX: kx1 - 10 });
    zh(Z, '习得技能', kx0 + 14, T(428), 18, { weight: 700, ls: 4, fit: wSkills }).classList.add('form');
    stroke(base, `M${kx0 + 6} ${T(446)}H${kx1 - 6}`, 1.4);
    const krh = 26 + Math.min(8, Math.round(dm / 14));
    const kp = (bot - 30 - T(456)) / 6;
    for (let i = 0; i < 6; i++) {
      const y = Math.round(T(456) + i * kp);
      const cy = y + krh / 2;
      stroke(base, `M${kx0 + 22} ${cy - 8}L${kx0 + 15} ${cy}L${kx0 + 22} ${cy + 8}`, 1.3);
      stroke(base, `M${kx0 + 26} ${y}H${kx1 - 10}V${y + krh}H${kx0 + 26}Z`, 1.2);
      const skill = P.skills[i];
      if (skill) {
        // small sun mark, name, and a tag box on the right, as on the anime card
        const sx = kx0 + 40;
        let sun = '';
        for (let k = 0; k < 8; k++) {
          const a = (k / 8) * Math.PI * 2;
          sun += `M${(sx + Math.cos(a) * 4.5).toFixed(1)} ${(cy + Math.sin(a) * 4.5).toFixed(1)}L${(sx + Math.cos(a) * 8).toFixed(1)} ${(cy + Math.sin(a) * 8).toFixed(1)}`;
        }
        stroke(base, sun, 1.2);
        $('circle', { cx: sx, cy, r: 2.6, fill: 'currentColor' }, base);
        stroke(base, `M${kx1 - 54} ${cy - 6}H${kx1 - 18}V${cy + 6}H${kx1 - 54}Z`, 1);
        const wSkill = run(GI, skill[1], kx0 + 56, cy - 6, 12, { sw: 1.4, gap: 0.24, maxX: kx1 - 62 });
        zh(ZI, skill[0], kx0 + 56, cy, 19, { weight: 700, fit: wSkill });
        run(base, babble(2), kx1 - 50, cy - 3, 6, { sw: 1.5, gap: 0.15, space: 0.4, maxX: kx1 - 20 });
      } else {
        const sx = kx0 + 40;
        $('circle', { cx: sx, cy, r: 4.5, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.1, 'stroke-dasharray': '2 2' }, base);
        const muted = $('g', { opacity: 0.55 }, base);
        run(muted, babble(3), kx0 + 56, cy - 6, 12, { sw: 1.4, gap: 0.24, space: 0.6, maxX: kx1 - 62 });
      }
    }
    const kdx = Math.round((kx0 + kx1) / 2);
    [-10, 0, 10].forEach((o) => $('circle', { cx: kdx + o, cy: B(668), r: 1.8, fill: 'currentColor' }, base));

    // ---------- connector between the halves ----------

    stroke(base, `M${R(804)} ${bot}V${T(484)}L${R(888)} ${T(400)}`, 1.5);
    $('path', { d: `M${R(814)} ${bot}V${T(489)}L${R(878)} ${T(425)}V${bot}Z`, fill: 'url(#hatchV)' }, base);
    stroke(base, `M${R(814)} ${bot}V${T(489)}L${R(878)} ${T(425)}V${bot}`, 1);
    stroke(base, `M${R(912)} ${T(404)}H${R(944)}V${B(680)}H${R(912)}ZM${R(918)} ${T(410)}V${B(674)}M${R(938)} ${T(410)}V${B(674)}`, 1);

    // ---------- class emblem ----------

    [[958, 980], [1234, 1256]].forEach(([x, tx]) => {
      stroke(base, `M${R(x)} ${T(396)}H${R(x + 26)}V${B(648)}H${R(x)}Z`, 1.2);
      const g = $('g', { transform: `translate(${R(tx)} ${T(404)}) rotate(90)` }, base);
      run(g, babble(30), 0, 0, 16, { sw: 1.8, gap: 0.2, space: 0.5, maxX: 236 + dm });
    });

    const et = T(372);
    const eb = B(668);
    stroke(base, `M${R(990)} ${et}H${R(1228)}V${eb}H${R(990)}Z`, 2);
    $('rect', { x: R(996), y: et + 6, width: 226, height: eb - et - 12, fill: 'url(#hatchH)' }, base);
    stroke(base, `M${R(996)} ${et + 6}H${R(1222)}V${eb - 6}H${R(996)}Z`, 1);

    const CX = R(1109);
    const CY = Math.round((T(386) + B(582)) / 2);
    $('circle', { cx: CX, cy: CY, r: 98, class: 'paper', stroke: 'currentColor', 'stroke-width': 1.4 }, base);
    $('circle', { cx: CX, cy: CY, r: 92, fill: 'none', stroke: 'currentColor', 'stroke-width': 0.8 }, base);
    let rays = '';
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      const r2 = i % 2 ? 30 : 38;
      rays += `M${(CX + Math.cos(a) * 17).toFixed(1)} ${(CY + Math.sin(a) * 17).toFixed(1)}L${(CX + Math.cos(a) * r2).toFixed(1)} ${(CY + Math.sin(a) * r2).toFixed(1)}`;
    }
    stroke(base, rays, 1);
    $('circle', { cx: CX, cy: CY, r: 12, class: 'paper', stroke: 'currentColor', 'stroke-width': 1.6 }, base);
    $('circle', { cx: CX, cy: CY, r: 4, fill: 'currentColor' }, base);

    $('rect', { x: R(1012), y: B(596), width: 194, height: 54, class: 'paper', stroke: 'currentColor', 'stroke-width': 1.2 }, base);
    const zz = $('g', { class: 'emblem-zz', transform: `translate(${dx} ${dy})` }, base);
    stroke(zz, 'M1060 632L1070 614L1080 632L1090 614L1100 632L1110 614L1120 632L1130 614L1140 632L1150 614L1160 632M1056 637H1164', 1.4);
    stroke(zz, 'M1030 613L1038 623L1030 633L1022 623ZM1188 613L1196 623L1188 633L1180 623Z', 1.2);
    run(base, babble(12), R(1014), B(655), 6, { sw: 1.6, gap: 0.2, space: 0.5, maxX: R(1204) });

    const label = zh(base, '', CX, B(623), 17, { anchor: 'middle', weight: 900, ls: 3 });
    label.classList.add('emblem-label');

    P.links.forEach((link, i) => {
      const a = -Math.PI / 2 + (i / P.links.length) * Math.PI * 2;
      const x = CX + Math.cos(a) * 66;
      const y = CY + Math.sin(a) * 66;
      const external = /^https?:/.test(link.href);
      const el = $('a', Object.assign({ href: link.href, class: 'emblem-link', 'aria-label': link.label },
        external ? { target: '_blank', rel: 'noopener' } : {}), base);
      $('title', null, el).textContent = link.label;
      // a larger invisible disc so the hover target is generous
      $('circle', { cx: x, cy: y, r: 30, fill: 'transparent' }, el);
      // the medallion grows from its own centre on hover; ink and gold versions cross-fade
      const med = $('g', { class: 'medal', style: `transform-origin:${x.toFixed(1)}px ${y.toFixed(1)}px` }, el);
      $('circle', { cx: x, cy: y, r: 24, class: 'paper icon-bg', stroke: 'currentColor', 'stroke-width': 1.8 }, med);
      $('circle', { class: 'icon-ring', cx: x, cy: y, r: 20, fill: 'none', stroke: 'currentColor', 'stroke-width': 0.8 }, med);
      const s = 26 / 24;
      const glyph = {
        d: ICONS[link.icon] || ICONS.user,
        transform: `translate(${(x - 13).toFixed(1)} ${(y - 13).toFixed(1)}) scale(${s})`,
        fill: 'none', 'stroke-width': 1.7 / s, 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
      };
      $('path', Object.assign({ class: 'icon-ink', stroke: 'currentColor' }, glyph), med);
      const gold = $('g', { class: 'icon-gold', filter: 'url(#emboss)' }, med);
      $('circle', { cx: x, cy: y, r: 24, fill: 'none', stroke: 'url(#foil)', 'stroke-width': 2.6 }, gold);
      $('circle', { cx: x, cy: y, r: 20, fill: 'none', stroke: 'url(#foil)', 'stroke-width': 1.2 }, gold);
      $('path', Object.assign({ stroke: 'url(#foil)' }, glyph, { 'stroke-width': 2.2 / s }), gold);
      const show = () => {
        label.textContent = link.hint || link.label;
        label.removeAttribute('textLength');
        if (label.getComputedTextLength() > 176) {
          label.setAttribute('textLength', 176);
          label.setAttribute('lengthAdjust', 'spacingAndGlyphs');
        }
        svg.classList.add('show-label');
        wand.classList.add('is-near');
      };
      const hide = () => {
        svg.classList.remove('show-label');
        wand.classList.remove('is-near');
      };
      el.addEventListener('mouseenter', show);
      el.addEventListener('focus', show);
      el.addEventListener('mouseleave', hide);
      el.addEventListener('blur', hide);
    });
  }

  let frame = 0;
  // Chinese widths are measured, so lay out again once the web font has arrived
  if (document.fonts) document.fonts.ready.then(render);
  new ResizeObserver(() => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(render);
  }).observe(stage);

  // ---------- the reading spell ----------
  // The wand tip carries a lens that shows the card in Chinese. A double click casts
  // the spell across the whole card; another double click lifts it again.

  const lensZh = document.getElementById('lensZh');
  const lensGl = document.getElementById('lensGl');
  const fx = document.getElementById('fx');
  const ctx = fx.getContext('2d');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const LENS = 150; // lens radius in card units
  const COVER = 1e5; // radius that covers any card

  const st = { cx: -1e4, cy: -1e4, r: 0, inside: false, full: false, tween: null };
  const sparks = [];
  let dpr = 1;

  function sizeFx() {
    dpr = Math.min(2, devicePixelRatio || 1);
    fx.width = innerWidth * dpr;
    fx.height = innerHeight * dpr;
  }
  sizeFx();
  addEventListener('resize', sizeFx);

  function toCard(x, y) {
    const m = svg.getScreenCTM();
    return m ? new DOMPoint(x, y).matrixTransform(m.inverse()) : { x: -1e4, y: -1e4 };
  }

  function farthestCorner(p) {
    const vb = svg.viewBox.baseVal;
    return Math.max(
      Math.hypot(p.x, p.y), Math.hypot(vb.width - p.x, p.y),
      Math.hypot(p.x, vb.height - p.y), Math.hypot(vb.width - p.x, vb.height - p.y),
    ) + 40;
  }

  function addSpark(x, y, speed, life) {
    const a = Math.random() * Math.PI * 2;
    const v = speed * (0.3 + Math.random() * 0.7);
    sparks.push({
      x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v,
      life: 1, decay: 1 / (life * (0.6 + Math.random() * 0.6)),
      size: 1.5 + Math.random() * 3, spin: Math.random() * Math.PI,
    });
  }

  function cast(x, y) {
    st.cx = x;
    st.cy = y;
    const p = toCard(x, y);
    st.full = !st.full;
    const from = st.full ? st.r : farthestCorner(p);
    const to = st.full ? farthestCorner(p) : (st.inside ? LENS : 0);
    if (reduceMotion) {
      st.r = st.full ? COVER : to;
    } else {
      st.tween = { from, to, t0: performance.now(), dur: st.full ? 1200 : 750, cx: x, cy: y };
      for (let i = 0; i < (st.full ? 90 : 40); i++) addSpark(x, y, st.full ? 9 : 5, 55);
    }
    wand.classList.remove('is-casting');
    void wand.offsetWidth;
    wand.classList.add('is-casting');
  }

  function drawRing(x, y, r, now, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = 'rgba(190, 120, 40, 0.95)';
    ctx.shadowColor = 'rgba(255, 200, 110, 0.95)';
    ctx.shadowBlur = 14;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 9]);
    ctx.lineDashOffset = -now / 40;
    ctx.beginPath();
    ctx.arc(x, y, Math.max(0, r - 8), 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    const rot = now / 1800;
    for (let i = 0; i < 8; i++) {
      const a = rot + (i * Math.PI) / 4;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(a) * (r + 3), y + Math.sin(a) * (r + 3));
      ctx.lineTo(x + Math.cos(a) * (r + 10), y + Math.sin(a) * (r + 10));
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawSpark(s) {
    const k = s.size * (0.6 + s.life * 0.6);
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.spin);
    ctx.globalAlpha = Math.max(0, s.life);
    ctx.fillStyle = '#ffe7a6';
    ctx.shadowColor = 'rgba(255, 190, 90, 1)';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(0, -k * 2);
    ctx.lineTo(k * 0.45, -k * 0.45);
    ctx.lineTo(k * 2, 0);
    ctx.lineTo(k * 0.45, k * 0.45);
    ctx.lineTo(0, k * 2);
    ctx.lineTo(-k * 0.45, k * 0.45);
    ctx.lineTo(-k * 2, 0);
    ctx.lineTo(-k * 0.45, -k * 0.45);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function tick(now) {
    let cx = st.cx;
    let cy = st.cy;
    let ringAlpha = 1;
    if (st.tween) {
      const k = Math.min(1, (now - st.tween.t0) / st.tween.dur);
      const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      st.r = st.tween.from + (st.tween.to - st.tween.from) * e;
      cx = st.tween.cx;
      cy = st.tween.cy;
      ringAlpha = st.full ? 1 - k * 0.7 : 1;
      if (k >= 1) {
        st.tween = null;
        if (st.full) st.r = COVER;
      }
    } else if (!st.full) {
      st.r += ((st.inside ? LENS : 0) - st.r) * 0.25;
    }

    const p = toCard(cx, cy);
    for (const c of [lensZh, lensGl]) {
      c.setAttribute('cx', p.x.toFixed(1));
      c.setAttribute('cy', p.y.toFixed(1));
      c.setAttribute('r', Math.max(0, st.r).toFixed(1));
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    const m = svg.getScreenCTM();
    const rs = st.r * (m ? m.a : 1);
    if (rs > 3 && st.r < COVER) drawRing(cx, cy, rs, now, ringAlpha);
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.x += s.vx;
      s.y += s.vy;
      s.vx *= 0.95;
      s.vy = s.vy * 0.95 + 0.05;
      s.spin += 0.08;
      s.life -= s.decay;
      if (s.life <= 0) sparks.splice(i, 1);
      else drawSpark(s);
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  if (canHover) {
    document.body.classList.add('has-wand');
    addEventListener('pointermove', (e) => {
      st.cx = e.clientX;
      st.cy = e.clientY;
      st.inside = true;
      wand.style.transform = `translate(${e.clientX - 24}px, ${e.clientY - 24}px)`;
      const fp = toCard(e.clientX, e.clientY);
      foil.setAttribute('gradientTransform', `translate(${(fp.x * 0.35).toFixed(1)} ${(fp.y * 0.15).toFixed(1)})`);
      wand.classList.add('is-on');
      if (!reduceMotion && Math.random() < 0.45) addSpark(e.clientX, e.clientY, 1.2, 28);
    });
    document.addEventListener('mouseout', (e) => {
      if (e.relatedTarget) return;
      st.inside = false;
      wand.classList.remove('is-on');
    });
  }

  svg.addEventListener('dblclick', (e) => {
    e.preventDefault();
    cast(e.clientX, e.clientY);
  });

  // touch screens: double tap casts the spell
  let lastTap = 0;
  svg.addEventListener('pointerup', (e) => {
    if (e.pointerType !== 'touch') return;
    const now = performance.now();
    if (now - lastTap < 320) {
      lastTap = 0;
      cast(e.clientX, e.clientY);
    } else {
      lastTap = now;
    }
  });

  // index.html?read opens the card with the spell already cast
  if (new URLSearchParams(location.search).has('read')) {
    st.full = true;
    st.r = COVER;
  }

  // plain-text copy for screen readers and search engines
  const sr = document.getElementById('sr-profile');
  sr.innerHTML = `<h1>${P.name}</h1><p>${P.job} · ${P.title} · Lv.${P.level}</p><p>${(P.intro || []).join('')}</p>` +
    `<ul>${P.stats.map(([l, , v]) => `<li>${l}：${v}</li>`).join('')}</ul>` +
    `<ul>${P.skills.map(([s]) => `<li>${s}</li>`).join('')}</ul>`;
})();
