// The back of the adventurer's card: a plain academic homepage (content in
// js/academic.js). The brass button in the corner flips between the two sides;
// index.html#about opens straight onto the back. Only the back has the language
// and day/night switches — the card itself always follows the stored theme.
(function () {
  'use strict';

  const A = window.ACADEMIC;
  const root = document.documentElement;
  const stage = document.getElementById('stage');
  const about = document.getElementById('about');
  const flipBtn = document.getElementById('flip');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!A || !about || !flipBtn) return;

  const LANG_KEY = 'about-lang';
  const THEME_KEY = 'guild-theme';
  let lang = 'en';
  try { lang = localStorage.getItem(LANG_KEY) === 'zh' ? 'zh' : 'en'; } catch (e) { /* default */ }

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // a field is either one string for both languages or { en, zh }
  const t = (v) => (v == null ? '' : typeof v === 'string' ? v : v[lang] ?? v.en ?? '');
  const away = (href) => (/^https?:/.test(href) ? ' target="_blank" rel="noopener"' : '');

  const UI = {
    about: { en: 'About', zh: '简介' },
    interests: { en: 'Research Interests', zh: '研究兴趣' },
    education: { en: 'Education', zh: '教育经历' },
    experience: { en: 'Experience', zh: '经历' },
    awards: { en: 'Honors & Awards', zh: '荣誉' },
    projects: { en: 'Projects', zh: '项目' },
    posts: { en: 'Recent Posts', zh: '近期文章' },
    publications: { en: 'Publications', zh: '论文' },
    contact: { en: 'Contact', zh: '联系方式' },
    certificate: { en: 'Certificate', zh: '证书' },
    allPosts: { en: 'All posts on the blog →', zh: '去博客看全部文章 →' },
    min: { en: 'min read', zh: '分钟' },
    sections: { en: 'Sections', zh: '板块' },
    present: { en: 'present', zh: '至今' },
    todo: { en: 'to be added', zh: '待填' },
    toCard: { en: 'Flip back to the adventurer card', zh: '翻回冒险者卡片' },
    cardShort: { en: 'Card', zh: '冒险者卡片' },
    toZh: { en: '切换到中文', zh: '切换到中文' },
    toEn: { en: 'Switch to English', zh: 'Switch to English' },
    toDay: { en: 'Switch to day', zh: '切换到白天' },
    toNight: { en: 'Switch to night', zh: '切换到夜晚' },
    updated: { en: 'Flip the card in the corner to meet the adventurer.', zh: '点右上角翻转卡片，去见见那位冒险者。' },
  };

  // shorter names for the same sections, for the top bar
  const NAV = {
    about: { en: 'About', zh: '简介' },
    experience: { en: 'Experience', zh: '经历' },
    awards: { en: 'Honors', zh: '荣誉' },
    projects: { en: 'Projects', zh: '项目' },
    posts: { en: 'Posts', zh: '文章' },
    publications: { en: 'Publications', zh: '论文' },
    contact: { en: 'Contact', zh: '联系' },
  };

  const ICON = {
    mail: '<path d="M3.5 6h17v12h-17zM3.5 6.5l8.5 6.5 8.5-6.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
    github: '<path fill="currentColor" d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>',
    scholar: '<path d="M2.5 9.5L12 3.5l9.5 6-9.5 6zM6.5 12v4.5c3.5 3 7.5 3 11 0V12M21.5 9.5v6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>',
    cv: '<path d="M6 2.5h8.5L19 7v14.5H6zM14 2.5V7.5h5M9 12h7M9 15.5h7M9 19h4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>',
    blog: '<path d="M3 5Q8 3 12 6Q16 3 21 5V19Q16 17 12 20Q8 17 3 19ZM12 6V20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
  };
  ICON.pin = '<path d="M12 21.5s-6.5-6.2-6.5-11.5a6.5 6.5 0 0 1 13 0c0 5.3-6.5 11.5-6.5 11.5z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="12" cy="10" r="2.3" fill="none" stroke="currentColor" stroke-width="1.8"/>';
  ICON.phone = '<path d="M6.5 3.5h3l1.5 4.5-2 1.5a11 11 0 0 0 5.5 5.5l1.5-2 4.5 1.5v3a2 2 0 0 1-2 2C10.5 19.5 4.5 13.5 4.5 5.5a2 2 0 0 1 2-2z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>';
  const icon = (k) => `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">${ICON[k] || ICON.blog}</svg>`;

  // the corner buttons' faces
  const CARD = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><path d="M3.5 8.5h11v12h-11z"/><path d="M8 5.5V3.5h12.5v12h-3"/><path d="M11.5 1.8l-2 1.8 2 1.8"/></svg>';
  const SUN = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5V5M12 19V21.5M2.5 12H5M19 12H21.5M5.3 5.3L7 7M17 17L18.7 18.7M5.3 18.7L7 17M17 7L18.7 5.3"/></svg>';
  const MOON = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M19.5 14.5A8 8 0 0 1 9.5 4.5A8 8 0 1 0 19.5 14.5Z"/></svg>';

  const todo = (s) => /TODO|待填|20XX/.test(s);
  const mark = (s) => (todo(s) ? `<span class="todo">${esc(s)}</span>` : esc(s));

  // each section that has something in it gets an entry in the top bar
  let shown = [];
  function section(key, body) {
    if (!body) return '';
    shown.push(key);
    return `<section class="about__sec" id="about-${key}"><h2><span aria-hidden="true">◆</span>${esc(t(UI[key]))}</h2>${body}</section>`;
  }

  // recent posts come from the blog's own quest list, fetched the first time the back is shown
  let posts = null;
  function loadPosts() {
    if (posts || !(A.recentPosts > 0)) return;
    posts = [];
    fetch('guild/data/quests.json')
      .then((r) => r.json())
      .then((all) => {
        posts = all.slice().sort((a, b) => (b.date > a.date ? 1 : -1)).slice(0, A.recentPosts);
        if (isBack()) render();
      })
      .catch(() => { /* no posts section */ });
  }
  function postRows() {
    if (!posts || !posts.length) return '';
    const day = (iso) => {
      const d = new Date(iso);
      return lang === 'zh' ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        : d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };
    return `<ul class="rows">${posts.map((q) => `<li><span class="when">${esc(day(q.date))}</span><div>` +
      `<a class="post" href="guild/q/${q.no}.html">${esc(q.title)}</a>` +
      `<p class="muted">${esc([(q.cats || []).join(' / '), q.minutes ? `${q.minutes} ${t(UI.min)}` : ''].filter(Boolean).join(' · '))}</p>` +
      `${q.summary ? `<p class="excerpt">${esc(q.summary)}</p>` : ''}</div></li>`).join('')}</ul>`;
  }

  function render() {
    root.lang = lang === 'zh' ? 'zh-CN' : 'en';
    about.lang = root.lang;
    const name = t(A.name);
    const links = A.links.map((l) => {
      const label = t(l.label);
      const text = t(l.text);
      const body = `${icon(l.icon)}<span class="about__link-label">${esc(label)}</span>${text ? `<span class="about__link-text">${mark(text)}</span>` : ''}`;
      return l.href
        ? `<li><a href="${esc(l.href)}"${away(l.href)}>${body}</a></li>`
        : `<li><span class="is-empty" title="${esc(t(UI.todo))}">${body}</span></li>`;
    }).join('');

    const when = (v) => `<span class="when">${mark(t(v).replace(/–\s*$/, `– ${t(UI.present)}`))}</span>`;
    const opt = (v, cls = 'muted') => (t(v) ? `<p class="${cls}">${mark(t(v))}</p>` : '');
    const points = (items) => ((items || []).length ? `<ul class="points">${items.map((x) => `<li>${mark(t(x))}</li>`).join('')}</ul>` : '');
    const linkList = (list) => {
      const ls = (list || []).map((l) => (l.href
        ? `<a href="${esc(l.href)}"${away(l.href)}>${esc(t(l.label))}</a>`
        : `<span class="is-empty">${esc(t(l.label))}</span>`)).join('');
      return ls ? `<p class="links">${ls}</p>` : '';
    };
    const rows = (list, fn) => ((list || []).length ? `<ul class="rows">${list.map(fn).join('')}</ul>` : '');

    // biography, with interests and education under it
    const bio = (A.bio || []).map((p) => `<p>${mark(t(p))}</p>`).join('');
    const interests = (A.interests || []).length
      ? `<div><h3>${esc(t(UI.interests))}</h3><ul class="chips">${A.interests.map((x, i) => `<li style="--c: var(--party-${i % 4})">${esc(t(x))}</li>`).join('')}</ul></div>`
      : '';
    const edu = rows(A.education, (e) => `<li>${when(e.time)}<div><strong>${esc(t(e.school))}</strong><p>${mark(t(e.degree))}</p>${opt(e.note)}</div></li>`);
    const biography = bio + (interests || edu
      ? `<div class="about__facts">${interests}${edu ? `<div><h3>${esc(t(UI.education))}</h3>${edu}</div>` : ''}</div>`
      : '');

    const experience = rows(A.experience, (x) => `<li>${when(x.time)}<div><strong>${mark(t(x.role))}</strong>` +
      `<p class="muted">${mark([t(x.org), t(x.place)].filter(Boolean).join(' · '))}</p>${opt(x.note)}${points(x.items)}</div></li>`);

    const awards = rows(A.awards, (a) => `<li>${when(a.time)}<div><strong>${mark(t(a.title))}</strong>` +
      `${t(a.org) ? ` <span class="org">${esc(t(a.org))}</span>` : ''}${opt(a.text)}` +
      `${a.link ? linkList([{ label: UI.certificate, href: a.link }]) : ''}</div></li>`);

    const projects = rows(A.projects, (p) => `<li>${when(p.time)}<div><strong>${mark(t(p.title))}</strong>` +
      `${opt(p.text, '')}${points(p.items)}${linkList(p.links)}</div></li>`);

    const me = A.me ? new RegExp(A.me.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g') : null;
    const pubs = rows(A.publications, (w) => {
      const authors = t(w.authors) ? `<p class="authors">${(me ? esc(t(w.authors)).replace(me, (m) => `<strong>${m}</strong>`) : esc(t(w.authors)))}</p>` : '';
      return `<li>${when(w.year)}<div><strong>${mark(t(w.title))}</strong>${authors}` +
        `<p class="muted">${mark([t(w.venue), t(w.status)].filter(Boolean).join(' · '))}</p>${linkList(w.links)}</div></li>`;
    });

    const recent = postRows();

    const C = A.contact || {};
    const contactItems = (C.items || []).map((c) => {
      const body = `${icon(c.icon)}<span>${mark(t(c.text))}</span>`;
      return `<li>${c.href ? `<a href="${esc(c.href)}"${away(c.href)}>${body}</a>` : `<span>${body}</span>`}</li>`;
    }).join('');
    const contact = opt(C.text, '') + (contactItems ? `<ul class="contact">${contactItems}</ul>` : '');

    shown = [];
    about.querySelector('.about__page').innerHTML = `
      <aside class="about__side">
        <img class="about__avatar" src="${esc(A.avatar)}" alt="" width="160" height="160">
        <h1>${esc(name)}</h1>
        ${A.alias && A.alias !== name ? `<p class="about__alias">${esc(A.alias)}</p>` : ''}
        <p class="about__role">${esc(t(A.role))}</p>
        <p class="about__aff">${esc(t(A.affiliation))}</p>
        ${t(A.location) ? `<p class="muted">${esc(t(A.location))}</p>` : ''}
        <ul class="about__links">${links}</ul>
      </aside>
      <div class="about__main">
        ${section('about', biography)}
        ${section('experience', experience)}
        ${section('awards', awards)}
        ${section('projects', projects)}
        ${section('posts', recent ? `${recent}<p class="links"><a href="guild/">${esc(t(UI.allPosts))}</a></p>` : '')}
        ${section('publications', pubs)}
        ${section('contact', contact)}
        <p class="about__foot">${esc(t(UI.updated))}</p>
      </div>`;
    brand.textContent = name;
    menu.innerHTML = shown.map((k, i) => `<li><a href="#about-${k}" data-key="${k}" style="--c: var(--party-${i % 4})">${esc(t(NAV[k]))}</a></li>`).join('');
    menu.setAttribute('aria-label', t(UI.sections));
    document.title = `${name} · ${lang === 'zh' ? '个人主页' : 'Homepage'}`;
    paintButtons();
    spy();
  }

  // ---------- the top bar: jump to a section, and light up the one being read ----------
  const nav = about.querySelector('.about__nav');
  const brand = about.querySelector('.about__brand');
  const menu = about.querySelector('.about__menu');
  let pinned = null;
  let settle = 0;

  function light(key) {
    for (const a of menu.querySelectorAll('a')) {
      const on = a.dataset.key === key;
      a.classList.toggle('is-active', on);
      if (on) {
        a.setAttribute('aria-current', 'location');
        // the menu scrolls sideways on narrow screens: keep the lit entry in view
        if (menu.scrollWidth > menu.clientWidth) {
          menu.scrollTo({ left: a.offsetLeft - (menu.clientWidth - a.offsetWidth) / 2, behavior: reduce ? 'auto' : 'smooth' });
        }
      } else a.removeAttribute('aria-current');
    }
  }

  function spy() {
    if (pinned) return light(pinned);
    const top = nav.getBoundingClientRect().bottom;
    const line = top + (about.clientHeight - top) * 0.3;
    let key = shown[0];
    for (const k of shown) {
      const sec = document.getElementById(`about-${k}`);
      if (sec && sec.getBoundingClientRect().top <= line) key = k;
    }
    if (about.scrollTop + about.clientHeight >= about.scrollHeight - 2) key = shown[shown.length - 1];
    light(key);
  }

  const jump = (y) => about.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
  menu.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-key]');
    if (!a) return;
    // the page's own hash stays #about, which is what keeps the back showing
    e.preventDefault();
    const sec = document.getElementById(`about-${a.dataset.key}`);
    pinned = a.dataset.key;
    light(pinned);
    jump(sec.getBoundingClientRect().top - about.getBoundingClientRect().top + about.scrollTop - nav.offsetHeight - 20);
    clearTimeout(settle);
    settle = setTimeout(() => { pinned = null; spy(); }, 1200);
  });
  brand.addEventListener('click', (e) => {
    e.preventDefault();
    jump(0);
  });
  about.addEventListener('scroll', () => {
    if (pinned) {
      clearTimeout(settle);
      settle = setTimeout(() => { pinned = null; spy(); }, 160);
    }
    spy();
  }, { passive: true });
  addEventListener('resize', spy);

  // ---------- corner buttons ----------
  const langBtn = document.querySelector('.about__lang');
  const themeBtn = document.querySelector('.about__theme');
  const isBack = () => document.body.classList.contains('is-back');

  function paintButtons() {
    const back = isBack();
    const label = back ? t(UI.toCard) : '翻转卡片：学术主页';
    langBtn.hidden = themeBtn.hidden = !back;
    flipBtn.innerHTML = `${CARD}<span>${esc(back ? t(UI.cardShort) : '学术主页')}</span>`;
    flipBtn.setAttribute('aria-label', label);
    flipBtn.title = label;
    langBtn.textContent = lang === 'zh' ? 'EN' : '中';
    langBtn.title = t(lang === 'zh' ? UI.toEn : UI.toZh);
    langBtn.setAttribute('aria-label', langBtn.title);
    const day = root.dataset.theme === 'day';
    themeBtn.innerHTML = day ? MOON : SUN;
    themeBtn.title = t(day ? UI.toNight : UI.toDay);
    themeBtn.setAttribute('aria-label', themeBtn.title);
  }

  langBtn.addEventListener('click', () => {
    lang = lang === 'zh' ? 'en' : 'zh';
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) { /* still switches */ }
    render();
  });
  themeBtn.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'day' ? 'night' : 'day';
    try { localStorage.setItem(THEME_KEY, root.dataset.theme); } catch (e) { /* still switches */ }
    paintButtons();
  });

  // ---------- the flip: the card turns edge-on, then the back turns into view ----------
  const cardTitle = document.title;
  let busy = false;
  const turn = (el, from, to, easing) => (reduce
    ? Promise.resolve()
    : el.animate([{ transform: `perspective(1800px) rotateY(${from}deg)` }, { transform: `perspective(1800px) rotateY(${to}deg)` }],
      { duration: 300, easing }).finished);

  // the card's wand stands in for the pointer; the back keeps the ordinary mouse
  const wand = document.body.classList.contains('has-wand');
  function show(back) {
    document.body.classList.toggle('has-wand', wand && !back);
    document.body.classList.toggle('is-back', back);
    stage.classList.toggle('is-away', back);
    about.hidden = !back;
    if (back) {
      loadPosts();
      render();
    }
    else {
      root.lang = 'zh-CN';
      document.title = cardTitle;
    }
    paintButtons();
  }

  async function flip() {
    if (busy) return;
    busy = true;
    const back = !isBack();
    await turn(back ? stage : about, 0, back ? -90 : 90, 'ease-in');
    show(back);
    await turn(back ? about : stage, back ? 90 : -90, 0, 'ease-out');
    history.replaceState(null, '', back ? '#about' : location.pathname + location.search);
    if (back) about.scrollTop = 0;
    busy = false;
  }
  flipBtn.addEventListener('click', flip);
  addEventListener('hashchange', () => { if ((location.hash === '#about') !== isBack()) show(location.hash === '#about'); });

  show(location.hash === '#about');

  // until the visitor has flipped once, the button gives a little shake now and then
  let flipped = false;
  try { flipped = localStorage.getItem('card-flipped') === '1'; } catch (e) { /* show the hint */ }
  if (!flipped && !reduce) flipBtn.classList.add('is-hinting');
  flipBtn.addEventListener('click', () => {
    flipBtn.classList.remove('is-hinting');
    try { localStorage.setItem('card-flipped', '1'); } catch (e) { /* fine */ }
  });
})();
