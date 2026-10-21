// The opening scene on the board page.
// The intro section is a few screens tall with a sticky full-screen stage; scrolling
// through it zooms the picture into the quest board drawn in it, then fades the
// picture away, and the real board below grows from small to full size as it rises.
// Arriving with filters (?line= ?tag= ?q= ?page=) or #hall skips straight to the board.
(function () {
  'use strict';

  const intro = document.getElementById('intro');
  const scene = document.getElementById('scene');
  if (!intro || !scene) return;
  const stage = intro.querySelector('.intro__stage');
  const caption = intro.querySelector('.intro__caption');
  const floor = document.querySelector('.hall-floor');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // the scene has a day and a night picture; follow the theme, including live toggles
  const pick = () => {
    const set = scene.dataset[document.documentElement.dataset.theme === 'day' ? 'day' : 'night'];
    if (!set || scene.getAttribute('srcset') === set) return;
    scene.setAttribute('srcset', set);
    scene.setAttribute('src', set.split(' ')[0]);
  };
  pick();
  new MutationObserver(pick).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  // where the board sits in the picture, as fractions: left top right bottom
  const [bx0, by0, bx1, by1] = scene.dataset.board.split(/\s+/).map(Number);

  const clamp = (v) => Math.min(1, Math.max(0, v));
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  // skip the scene when the visitor is clearly already browsing the board
  const q = new URLSearchParams(location.search);
  if (['line', 'tag', 'cat', 'q', 'page'].some((k) => q.has(k)) || location.hash === '#hall') {
    history.scrollRestoration = 'manual';
    requestAnimationFrame(() => document.getElementById('hall').scrollIntoView({ behavior: 'auto', block: 'start' }));
  }

  intro.querySelector('.intro__hint').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('hall').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  });

  if (reduce) {
    intro.classList.add('is-still');
    return;
  }

  let geo = null;
  function measure() {
    const vw = stage.clientWidth;
    const vh = stage.clientHeight;
    const iw = scene.naturalWidth || Number(scene.getAttribute('width'));
    const ih = scene.naturalHeight || Number(scene.getAttribute('height'));
    // object-fit: cover
    const c = Math.max(vw / iw, vh / ih);
    const dw = iw * c;
    const dh = ih * c;
    const ox = (vw - dw) / 2;
    const oy = (vh - dh) / 2;
    const cx = ox + ((bx0 + bx1) / 2) * dw;
    const cy = oy + ((by0 + by1) / 2) * dh;
    const bw = (bx1 - bx0) * dw;
    const bh = (by1 - by0) * dh;
    geo = { vw, vh, cx, cy, zoom: Math.max(vw / bw, vh / bh) * 1.08 };
    scene.style.transformOrigin = `${cx}px ${cy}px`;
  }

  let ticking = false;
  function frame() {
    ticking = false;
    if (!geo) measure();
    const vh = innerHeight;

    // 0 → 1 over the intro's scroll length
    const r = intro.getBoundingClientRect();
    const p = clamp(-r.top / (intro.offsetHeight - vh));
    const z = ease(clamp(p / 0.5));
    const s = 1 + (geo.zoom - 1) * z;
    const tx = (geo.vw / 2 - geo.cx) * z;
    const ty = (geo.vh / 2 - geo.cy) * z;
    scene.style.transform = `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px) scale(${s.toFixed(4)})`;
    scene.style.opacity = (1 - clamp((p - 0.42) / 0.36)).toFixed(3);
    caption.style.opacity = (1 - clamp(p / 0.08)).toFixed(3);
    caption.style.transform = `translateY(${(p * 40).toFixed(1)}px)`;

    // the real board grows as it comes up into view
    if (floor) {
      const top = floor.getBoundingClientRect().top;
      const g = ease(clamp((vh - top) / (vh * 0.65)));
      if (g >= 1) {
        floor.style.transform = '';
        floor.style.opacity = '';
      } else {
        floor.style.transform = `scale(${(0.55 + 0.45 * g).toFixed(4)})`;
        floor.style.opacity = (0.25 + 0.75 * g).toFixed(3);
      }
    }
  }
  const request = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(frame);
    }
  };

  addEventListener('scroll', request, { passive: true });
  addEventListener('resize', () => { geo = null; request(); });
  if (scene.complete) request();
  else scene.addEventListener('load', () => { geo = null; request(); });
  request();
})();
