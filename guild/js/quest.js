// The reading page (guild/q/<no>.html): fills in the quest line, card script and
// stamps, drives the reading-progress bar and the contents, copies code, and
// loads the comment thread.
(function () {
  'use strict';

  const { LINES, stamps, mountChrome, giscus, dossier, follow, loadQuests } = window.GUILD;

  mountChrome('board');

  const writ = document.querySelector('.writ');
  const no = Number(writ.dataset.no);
  const line = LINES[writ.dataset.line] || LINES[0];
  writ.querySelector('.writ__line').textContent = line.name;
  writ.querySelector('.writ__stamps').innerHTML = stamps(no, Number(writ.dataset.minutes));

  // the adventurer's dossier in the left margin; its reading list needs the quest index
  const $dossier = document.getElementById('dossier');
  dossier($dossier, []);
  loadQuests().then((quests) => dossier($dossier, quests)).catch(() => {});
  follow([document.querySelector('.dossier')]);

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // reading progress: how far through the writ itself
  const bar = document.querySelector('.progress');
  function progress() {
    const r = writ.getBoundingClientRect();
    const span = r.height - innerHeight;
    const p = span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 1;
    bar.style.setProperty('--p', p.toFixed(4));
  }
  addEventListener('scroll', progress, { passive: true });
  addEventListener('resize', progress);
  progress();

  // a sealed quest: the body and contents arrive encrypted. Ask for the password,
  // decrypt them in the browser, then set up the contents as for any other quest.
  // A key that worked is kept for the rest of the browser session.
  const seal = document.querySelector('.seal');
  const opened = seal ? unseal(seal) : Promise.resolve();
  opened.then(reading);

  function unseal(form) {
    const S = JSON.parse(form.querySelector('.seal__data').textContent);
    const bytes = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const KEY = `seal-${no}`;
    const input = form.querySelector('.seal__input');
    const error = form.querySelector('.seal__error');
    const btn = form.querySelector('.seal__btn');

    const derive = async (password) => {
      const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
      return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: bytes(S.salt), iterations: S.iter, hash: 'SHA-256' },
        base, { name: 'AES-GCM', length: 256 }, true, ['decrypt']);
    };
    const open = async (key) => {
      const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes(S.iv) }, key, bytes(S.data));
      return JSON.parse(new TextDecoder().decode(plain));
    };

    return new Promise((resolve) => {
      const reveal = ({ html, toc: list }, instant) => {
        const prose = document.querySelector('.prose');
        prose.innerHTML = html;
        prose.hidden = false;
        const toc = document.querySelector('.toc');
        toc.removeAttribute('data-sealed');
        if (list.length >= 2) {
          const top = Math.min(...list.map((t) => t.level));
          const ol = document.createElement('ol');
          for (const t of list) {
            const li = document.createElement('li');
            li.className = `l${t.level - top + 2}`;
            const a = document.createElement('a');
            a.href = `#${t.id}`;
            a.textContent = t.text;
            li.append(a);
            ol.append(li);
          }
          toc.append(ol);
        } else toc.hidden = true;
        form.classList.add('is-open');
        // let the lock spring open before it goes
        setTimeout(() => { form.remove(); resolve(); }, reduce || instant ? 0 : 650);
      };

      // the key from earlier in this session, if there is one
      let saved = null;
      try { saved = sessionStorage.getItem(KEY); } catch (e) { /* ask */ }
      if (saved && crypto.subtle) {
        crypto.subtle.importKey('raw', bytes(saved), 'AES-GCM', false, ['decrypt'])
          .then(open)
          .then((data) => { form.classList.add('is-instant'); reveal(data, true); })
          .catch(() => { try { sessionStorage.removeItem(KEY); } catch (e) { /* fine */ } });
      }

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!crypto.subtle) {
          error.textContent = '这个浏览器不支持解封（需要 HTTPS 或较新的浏览器）。';
          error.hidden = false;
          return;
        }
        btn.disabled = true;
        error.hidden = true;
        try {
          const key = await derive(input.value);
          const data = await open(key);
          try {
            const raw = new Uint8Array(await crypto.subtle.exportKey('raw', key));
            sessionStorage.setItem(KEY, btoa(String.fromCharCode(...raw)));
          } catch (err) { /* not remembered, still open */ }
          reveal(data);
        } catch (err) {
          error.textContent = '口令不对，封印纹丝不动。';
          error.hidden = false;
          form.classList.remove('is-shaking');
          void form.offsetWidth;
          form.classList.add('is-shaking');
          input.select();
        } finally {
          btn.disabled = false;
        }
      });
      input.focus({ preventScroll: true });
    });
  }

  // everything that needs the body: the progress bar and the contents
  function reading() {
    progress();
    // contents: in the right margin on wide screens, a folding strip above the writ otherwise
    const toc = document.querySelector('.toc');
    const wide = matchMedia('(min-width: 1520px)');
    if (toc && !toc.hidden) {
      const h2 = toc.querySelector('h2');
      h2.innerHTML = '<button class="toc__toggle" type="button">委托要点<span aria-hidden="true">▾</span></button>';
      const btn = h2.firstChild;
      const sync = () => btn.setAttribute('aria-expanded', String(wide.matches || toc.classList.contains('is-open')));
      btn.addEventListener('click', () => {
        if (wide.matches) return;
        toc.classList.toggle('is-open');
        sync();
      });
      wide.addEventListener('change', sync);
      sync();
    }

    // contents: highlight the section being read. The current section is the last
    // heading above a reading line a quarter of the way down the window; near the end
    // of the writ the line slides down to its foot, so the short closing sections
    // still get their turn. Its parent heading is marked too, and on wide screens the
    // contents box scrolls itself to keep the highlighted entry in view.
    const links = [...document.querySelectorAll('.toc a')];
    const pairs = links
      .map((a) => ({ a, h: document.getElementById(decodeURIComponent(a.hash.slice(1))), level: Number(a.parentNode.className.slice(1)) || 2 }))
      .filter((p) => p.h);
    if (pairs.length && toc) {
      let current = null;
      let pinned = null;      // a clicked entry, held until the scroll it started settles
      let pinTimer = 0;
      let userTimer = 0;      // the reader is scrolling the contents box by hand
      let userScrolling = false;
      let ticking = false;

      const pick = () => {
        if (pinned) return pinned;
        const vh = innerHeight;
        const foot = writ.getBoundingClientRect().bottom;
        // 0 while the writ's end is below the window, 1 once its end is at 60% height
        const t = Math.min(1, Math.max(0, (vh - foot) / (vh * 0.4)));
        const line = vh * (0.25 + 0.65 * t * t);
        let found = null;
        for (const p of pairs) {
          if (p.h.getBoundingClientRect().top - 2 <= line) found = p;
          else break;
        }
        return found;
      };

      const reveal = (a) => {
        if (userScrolling || toc.scrollHeight <= toc.clientHeight + 4) return;
        const box = toc.getBoundingClientRect();
        const r = a.getBoundingClientRect();
        if (r.top >= box.top + box.height * 0.2 && r.bottom <= box.bottom - box.height * 0.2) return;
        toc.scrollTo({ top: toc.scrollTop + (r.top - box.top) - box.height / 2 + r.height / 2, behavior: reduce ? 'auto' : 'smooth' });
      };

      const paint = () => {
        ticking = false;
        const next = pick();
        if (next === current) return;
        current = next;
        // the nearest higher-level entry before the current one is its parent section
        let parent = null;
        if (current) {
          for (let k = pairs.indexOf(current) - 1; k >= 0; k--) {
            if (pairs[k].level < current.level) { parent = pairs[k]; break; }
          }
        }
        for (const p of pairs) {
          p.a.classList.toggle('is-active', p === current);
          p.a.classList.toggle('is-trail', p === parent);
          if (p === current) p.a.setAttribute('aria-current', 'location');
          else p.a.removeAttribute('aria-current');
        }
        if (current && wide.matches) reveal(current.a);
      };
      const queue = () => {
        if (!ticking) { ticking = true; requestAnimationFrame(paint); }
      };

      // a click jumps there: light it at once rather than every heading passed on the way
      toc.addEventListener('click', (e) => {
        const a = e.target.closest('a');
        const p = a && pairs.find((x) => x.a === a);
        if (!p) return;
        pinned = p;
        queue();
        clearTimeout(pinTimer);
        pinTimer = setTimeout(() => { pinned = null; queue(); }, 1200);
      });
      addEventListener('scroll', () => {
        if (pinned) {
          // keep holding until the page has stopped moving for a moment
          clearTimeout(pinTimer);
          pinTimer = setTimeout(() => { pinned = null; queue(); }, 160);
        }
        queue();
      }, { passive: true });
      addEventListener('resize', queue);
      // don't pull the contents box back while the reader is scrolling it
      const hold = () => {
        userScrolling = true;
        clearTimeout(userTimer);
        userTimer = setTimeout(() => { userScrolling = false; }, 1500);
      };
      toc.addEventListener('wheel', hold, { passive: true });
      toc.addEventListener('touchmove', hold, { passive: true });
      paint();
    }
  }

  // interactive lightbox for all prose images & vector SVGs (wheel zoom, drag pan, dblclick)
  const IMG_EXT = /\.(?:svg|png|jpe?g|webp|gif|avif|bmp)(?:[?#].*)?$/i;
  let lb = null;

  function ensureLightbox() {
    if (lb) return lb;
    const root = document.createElement('div');
    root.className = 'lightbox';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', '图片放大预览');
    root.hidden = true;
    root.innerHTML =
      '<div class="lightbox__bar">' +
        '<span class="lightbox__caption"></span>' +
        '<div class="lightbox__actions">' +
          '<button type="button" class="lightbox__btn" data-act="out" title="缩小 (-)">−</button>' +
          '<button type="button" class="lightbox__btn lightbox__pct" data-act="reset" title="适应窗口 (0)">100%</button>' +
          '<button type="button" class="lightbox__btn" data-act="in" title="放大 (+)">+</button>' +
          '<a class="lightbox__btn lightbox__raw" target="_blank" rel="noopener" title="在新标签页打开原图">原图 ↗</a>' +
          '<button type="button" class="lightbox__btn lightbox__close" data-act="close" title="关闭 (Esc)">✕</button>' +
        '</div>' +
      '</div>' +
      '<div class="lightbox__stage"><img class="lightbox__img" alt="" draggable="false"></div>' +
      '<div class="lightbox__hint">滚轮缩放 · 拖拽平移 · 双击放大/还原 · Esc 关闭</div>';
    document.body.append(root);

    const stage = root.querySelector('.lightbox__stage');
    const img = root.querySelector('.lightbox__img');
    const caption = root.querySelector('.lightbox__caption');
    const pct = root.querySelector('.lightbox__pct');
    const rawLink = root.querySelector('.lightbox__raw');

    const S = { scale: 1, tx: 0, ty: 0, dragging: false, moved: false, sx: 0, sy: 0, ox: 0, oy: 0, pinchDist: 0, pinchScale: 1 };
    const MIN = 0.5;
    const MAX = 6;
    const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

    const apply = () => {
      img.style.transform = `translate3d(${S.tx.toFixed(1)}px, ${S.ty.toFixed(1)}px, 0) scale(${S.scale.toFixed(4)})`;
      pct.textContent = `${Math.round(S.scale * 100)}%`;
      stage.classList.toggle('is-zoomed', S.scale > 1.01);
    };

    const reset = () => {
      S.scale = 1;
      S.tx = 0;
      S.ty = 0;
      apply();
    };

    const zoomAt = (nextScale, clientX, clientY) => {
      const target = clamp(nextScale, MIN, MAX);
      if (Math.abs(target - S.scale) < 1e-4) return;
      const rect = stage.getBoundingClientRect();
      const cx = clientX - (rect.left + rect.width / 2);
      const cy = clientY - (rect.top + rect.height / 2);
      const ratio = target / S.scale;
      S.tx = cx - (cx - S.tx) * ratio;
      S.ty = cy - (cy - S.ty) * ratio;
      S.scale = target;
      if (S.scale <= 1.001) {
        S.tx = 0;
        S.ty = 0;
      }
      apply();
    };

    const open = (src, alt) => {
      img.src = src;
      img.alt = alt || '';
      caption.textContent = alt || '';
      rawLink.href = src;
      reset();
      root.hidden = false;
      document.documentElement.classList.add('has-lightbox');
    };

    const close = () => {
      if (root.hidden) return;
      root.hidden = true;
      document.documentElement.classList.remove('has-lightbox');
      img.removeAttribute('src');
    };

    root.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-act]');
      if (btn) {
        const act = btn.dataset.act;
        const r = stage.getBoundingClientRect();
        const midX = r.left + r.width / 2;
        const midY = r.top + r.height / 2;
        if (act === 'in') zoomAt(S.scale * 1.35, midX, midY);
        else if (act === 'out') zoomAt(S.scale / 1.35, midX, midY);
        else if (act === 'reset') reset();
        else if (act === 'close') close();
        return;
      }
      if (e.target === stage && !S.moved) close();
    });

    stage.addEventListener('wheel', (e) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.18 : 1 / 1.18;
      zoomAt(S.scale * factor, e.clientX, e.clientY);
    }, { passive: false });

    stage.addEventListener('dblclick', (e) => {
      e.preventDefault();
      if (S.scale > 1.15) reset();
      else zoomAt(2.4, e.clientX, e.clientY);
    });

    stage.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || e.pointerType === 'touch') return;
      S.dragging = true;
      S.moved = false;
      S.sx = e.clientX;
      S.sy = e.clientY;
      S.ox = S.tx;
      S.oy = S.ty;
      stage.classList.add('is-dragging');
      stage.setPointerCapture(e.pointerId);
    });

    stage.addEventListener('pointermove', (e) => {
      if (!S.dragging) return;
      const dx = e.clientX - S.sx;
      const dy = e.clientY - S.sy;
      if (Math.hypot(dx, dy) > 4) S.moved = true;
      S.tx = S.ox + dx;
      S.ty = S.oy + dy;
      apply();
    });

    const endDrag = () => {
      if (!S.dragging) return;
      S.dragging = false;
      stage.classList.remove('is-dragging');
      setTimeout(() => { S.moved = false; }, 0);
    };
    stage.addEventListener('pointerup', endDrag);
    stage.addEventListener('pointercancel', endDrag);

    // touch drag & pinch-to-zoom
    stage.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        S.dragging = true;
        S.sx = e.touches[0].clientX;
        S.sy = e.touches[0].clientY;
        S.ox = S.tx;
        S.oy = S.ty;
      } else if (e.touches.length === 2) {
        S.dragging = false;
        const [a, b] = e.touches;
        S.pinchDist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
        S.pinchScale = S.scale;
      }
    }, { passive: true });

    stage.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1 && S.dragging) {
        e.preventDefault();
        S.tx = S.ox + (e.touches[0].clientX - S.sx);
        S.ty = S.oy + (e.touches[0].clientY - S.sy);
        apply();
      } else if (e.touches.length === 2 && S.pinchDist > 0) {
        e.preventDefault();
        const [a, b] = e.touches;
        const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
        zoomAt(S.pinchScale * (dist / S.pinchDist), (a.clientX + b.clientX) / 2, (a.clientY + b.clientY) / 2);
      }
    }, { passive: false });

    stage.addEventListener('touchend', () => {
      S.dragging = false;
      S.pinchDist = 0;
    });

    document.addEventListener('keydown', (e) => {
      if (root.hidden) return;
      const r = stage.getBoundingClientRect();
      const midX = r.left + r.width / 2;
      const midY = r.top + r.height / 2;
      if (e.key === 'Escape') close();
      else if (e.key === '+' || e.key === '=') zoomAt(S.scale * 1.3, midX, midY);
      else if (e.key === '-') zoomAt(S.scale / 1.3, midX, midY);
      else if (e.key === '0') reset();
    });

    lb = { open, close };
    return lb;
  }

  document.addEventListener('click', (e) => {
    const img = e.target.closest('.prose img');
    if (!img || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const link = img.closest('a[href]');
    let targetSrc = img.currentSrc || img.src;
    if (link) {
      const href = link.getAttribute('href') || '';
      // If the image is wrapped in a link to an image/SVG (or the same src), open lightbox instead of navigating away
      if (IMG_EXT.test(href) || link.href === img.src || link.href === img.currentSrc) {
        e.preventDefault();
        targetSrc = link.href || targetSrc;
      } else {
        return; // genuine external hyperlink image
      }
    }
    ensureLightbox().open(targetSrc, img.alt || (link && link.title) || '');
  });

  // copy a code block
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('.code__copy');
    if (!btn) return;
    const code = btn.closest('.code').querySelector('code').innerText;
    try {
      await navigator.clipboard.writeText(code);
      btn.textContent = '已抄录';
    } catch {
      btn.textContent = '抄录失败';
    }
    setTimeout(() => { btn.textContent = '抄录'; }, 1600);
  });

  const thread = document.querySelector('.giscus');
  if (thread) giscus(thread, thread.dataset.term);
})();
