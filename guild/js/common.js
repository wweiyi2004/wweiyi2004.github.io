// Shared by every guild page: the hanging sign and nav, quest sheets, red
// stamps, the adventurer's dossier, side panels that follow the scroll, the
// quest index and the giscus comment loader.
(function () {
  'use strict';

  const G = window.GLYPHS;
  // pages in guild/q/ set data-base="../" so links resolve from either level
  const BASE = document.body.dataset.base || '';

  // The six quest lines (the old 专题 page). Ids match tools/build.mjs.
  const LINES = {
    1: { name: 'AI 与开发工具', kicker: 'AI · SOFTWARE', seal: '器', desc: '模型工具、Agent、Claude Code，以及自己做过的软件项目。' },
    2: { name: '嵌入式与工程', kicker: 'HARDWARE · PRACTICE', seal: '工', desc: '电子设计竞赛、软硬件协同，以及把算法真正跑起来的过程。' },
    3: { name: '大学课程', kicker: 'COURSES · KNOWLEDGE', seal: '学', desc: '复习指南、知识库、课程笔记与学习记录。' },
    4: { name: '算法竞赛', kicker: 'ALGORITHM · ARCHIVE', seal: '算', desc: '从题解、训练计划到退役游记，完整保留曾经的 OI 时间线。' },
    5: { name: '随笔与创作', kicker: 'LIFE · WRITING', seal: '记', desc: '成长记录、校园生活、观点文章和一些不太技术的表达。' },
    6: { name: '动漫与阅读', kicker: 'ANIME · READING', seal: '番', desc: '追番记录、轻小说阅读笔记，以及那些留下印象的故事。' },
    0: { name: '杂项委托', kicker: 'MISCELLANY', seal: '杂', desc: '' },
  };

  const NAV = [
    ['index.html#hall', '委托告示板', 'board'],
    ['lines.html', '任务线', 'lines'],
    ['bestiary.html', '魔物图鉴', 'bestiary'],
    ['board.html', '留言板', 'ledger'],
  ];

  // giscus: the repository and category the Hexo blog used; old posts keep
  // their threads because the term is the post's old URL path
  const GISCUS = {
    repo: 'wweiyi2004/BlogComment',
    repoId: 'R_kgDOPK11pw',
    category: 'Announcements',
    categoryId: 'DIC_kwDOPK11p84Cs0hp',
  };

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // front-matter dates are Asia/Shanghai wall-clock time; show that calendar day
  // everywhere, so the board and the quest page agree for readers abroad too
  const fmtDate = (iso) => {
    if (!iso) return '';
    const d = new Date(new Date(iso).getTime() + 8 * 3600e3);
    return `${d.getUTCFullYear()}.${String(d.getUTCMonth() + 1).padStart(2, '0')}.${String(d.getUTCDate()).padStart(2, '0')}`;
  };

  // difficulty, from the reading time
  const rank = (minutes) => (minutes <= 2 ? 1 : minutes <= 6 ? 2 : minutes <= 12 ? 3 : minutes <= 25 ? 4 : 5);

  // the little marks inside the red stamps
  const MARKS = [
    'M12 3L14.6 9.2L21 9.6L16 13.8L17.6 20L12 16.6L6.4 20L8 13.8L3 9.6L9.4 9.2Z', // star
    'M5 19L15 9M13 7L17 3L21 7L17 11M7 15L9 17M4 20L6 18', // sword
    'M4 6Q8 4 12 6Q16 4 20 6V18Q16 16 12 18Q8 16 4 18ZM12 6V18', // book
    'M4 17L6 8L10 12L12 6L14 12L18 8L20 17Z', // crown
    'M12 21C5 15 5 8 12 3C19 8 19 15 12 21ZM12 7V21', // leaf
    'M12 21C7 21 5 17 7 13C8 15 9 15 10 14C9 10 11 6 14 3C14 7 18 9 18 14C18 18 15 21 12 21Z', // flame
    'M12 12m-1 0a1 1 0 1 1 2 0a3 3 0 1 1-6 0a5 5 0 1 1 10 0a7 7 0 1 1-14 0', // spiral
    'M16 4A8 8 0 1 0 20 15A6.5 6.5 0 1 1 16 4Z', // moon
    'M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0-8 0M12 3V6M12 18V21M3 12H6M18 12H21M5.6 5.6L7.8 7.8M16.2 16.2L18.4 18.4M5.6 18.4L7.8 16.2M16.2 7.8L18.4 5.6', // sun
  ];
  function stamps(no, minutes) {
    const n = rank(minutes);
    const r = G.rng(no * 131);
    let out = '';
    for (let i = 0; i < n; i++) {
      const d = MARKS[Math.floor(r() * MARKS.length)];
      out += `<span class="stamp"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><path d="${d}"/></svg></span>`;
    }
    return `<span class="stamps" role="img" aria-label="难度 ${n} 级">${out}</span>`;
  }

  const eris = (n) => n.toLocaleString('en-US');

  // a stable small tilt per quest, so the board looks hand-pinned
  const tilt = (no) => ((G.rng(no * 7919)() - 0.5) * 2.6).toFixed(2) + 'deg';

  const asset = (src) => (/^https?:\/\//.test(src) ? src : BASE + src);

  // the padlock a sealed quest's sheet carries beside its number
  const LOCK = '<svg viewBox="0 0 12 13" aria-hidden="true"><path d="M3.5 6V4a2.5 2.5 0 0 1 5 0v2" fill="none" stroke="currentColor" stroke-width="1.6"/><rect x="1.5" y="6" width="9" height="6.5" rx="1.2" fill="currentColor"/></svg>';

  function sheet(q, i) {
    const line = LINES[q.line] || LINES[0];
    const art = q.cover
      ? `<div class="sheet__art"><img src="${esc(asset(q.cover))}" alt="" loading="lazy"></div>`
      : '';
    return `<li><a class="sheet" href="${BASE}q/${q.no}.html" style="--r:${tilt(q.no)};--i:${i}">
      ${q.sticky ? '<span class="urgent">紧急</span>' : ''}
      <div class="sheet__no"><span>No.${q.no}${q.locked ? ` <span class="sheet__lock" title="封印委托">${LOCK}封印</span>` : ''}</span><span>${esc(line.name)}</span></div>
      ${art}
      <h3 class="sheet__title">${esc(q.title)}</h3>
      ${q.summary && !q.cover ? `<p class="sheet__excerpt">${esc(q.summary)}</p>` : ''}
      <p class="sheet__reward">报酬 ${eris(q.words)} 艾莉丝</p>
      <p class="sheet__time">讨伐耗时 约 ${q.minutes} 分钟 · <span class="sheet__date">${fmtDate(q.date)}</span></p>
      ${stamps(q.no, q.minutes)}
    </a></li>`;
  }

  function header(active) {
    const sub = G.svg('AXEL ADVENTURERS GUILD', 9, { sw: 1.3, gap: 0.3 });
    const nav = NAV.map(([href, label, key]) =>
      `<a class="tag" href="${BASE}${href}"${key === active ? ' aria-current="page"' : ''}>${label}</a>`).join('');
    return `<a class="sign" href="${BASE}index.html">
        <span class="sign__title">冒险者公会 · 委托告示板</span>
        <span class="sign__sub" aria-hidden="true">${sub}</span>
      </a>
      <nav class="nav" aria-label="公会">${nav}<a class="tag tag--back" href="${BASE}../index.html#card">← 冒险者卡片</a></nav>`;
  }

  function footer() {
    return `<p>吾名惠惠，红魔族第一的魔法师。一日一爆裂 · EXPLOSION!</p>
      <p>© 2019 – ${new Date().getFullYear()} wweiyi · <a href="https://github.com/wweiyi2004">GitHub</a> · 托管于 GitHub Pages</p>`;
  }

  // day / night: the <head> of every page sets data-theme before first paint
  // (stored choice, else the system preference); this button flips and stores it
  const THEME_KEY = 'guild-theme';
  const SUN = '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5V5M12 19V21.5M2.5 12H5M19 12H21.5M5.3 5.3L7 7M17 17L18.7 18.7M5.3 18.7L7 17M17 7L18.7 5.3"/></svg>';
  const MOON = '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M19.5 14.5A8 8 0 0 1 9.5 4.5A8 8 0 1 0 19.5 14.5Z"/></svg>';
  const UP = '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V6M6 11L12 5L18 11M6 2.5H18"/></svg>';

  function theme() {
    return document.documentElement.dataset.theme === 'day' ? 'day' : 'night';
  }

  function controls() {
    const box = document.createElement('div');
    box.className = 'fabs';
    box.innerHTML = `
      <button class="fab fab--theme" type="button"></button>
      <button class="fab fab--top" type="button" aria-label="回到顶部" title="回到顶部">${UP}</button>`;
    document.body.appendChild(box);

    const flip = box.querySelector('.fab--theme');
    const paint = () => {
      const day = theme() === 'day';
      flip.innerHTML = day ? MOON : SUN;
      const label = day ? '切换到夜晚' : '切换到白天';
      flip.setAttribute('aria-label', label);
      flip.title = label;
    };
    paint();
    flip.addEventListener('click', () => {
      const next = theme() === 'day' ? 'night' : 'day';
      document.documentElement.dataset.theme = next;
      try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* private mode: still switches */ }
      paint();
      paintGiscus();
    });

    const top = box.querySelector('.fab--top');
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    top.addEventListener('click', () => {
      scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
      document.querySelector('header.hall a')?.focus({ preventScroll: true });
    });
    const show = () => top.classList.toggle('is-shown', scrollY > innerHeight * 0.6);
    addEventListener('scroll', show, { passive: true });
    show();
  }

  function mountChrome(active) {
    const h = document.querySelector('header.hall');
    if (h) h.innerHTML = header(active);
    const f = document.querySelector('footer.floor');
    if (f) f.innerHTML = footer();
    controls();
  }

  // the board's frame: rules, clasps, rivets and gold script on four sides
  function frame(board) {
    const words = G.rng(20160114);
    const across = (n) => G.svg(G.babble(n, words), 12, { sw: 1.6, gap: 0.28 });
    const down = (n) => G.svg(G.babble(n, words), 11, { sw: 1.6, gap: 0.28, vertical: true });
    board.insertAdjacentHTML('afterbegin', `
      <span class="board__rule" aria-hidden="true"></span>
      <span class="board__rule board__rule--inner" aria-hidden="true"></span>
      <span class="board__script board__script--top" aria-hidden="true">${across(3)}${across(4)}${across(3)}</span>
      <span class="board__script board__script--bottom" aria-hidden="true">${across(3)}${across(4)}${across(3)}</span>
      <span class="board__script board__script--left" aria-hidden="true">${down(4)}${down(4)}</span>
      <span class="board__script board__script--right" aria-hidden="true">${down(4)}${down(4)}</span>
      <span class="board__clasps board__clasps--top" aria-hidden="true"><span class="clasp"></span><span class="clasp"></span></span>
      <span class="board__clasps board__clasps--bottom" aria-hidden="true"><span class="clasp"></span><span class="clasp"></span></span>
      <span class="board__rivets" aria-hidden="true"><span></span><span></span></span>`);

    // the side script is written for a full board: on a short one (a search with few
    // or no hits) keep only the words that fit between the clasps, instead of letting
    // them run down the wall
    const sides = board.querySelectorAll('.board__script--left, .board__script--right');
    const fit = () => {
      for (const side of sides) {
        const room = side.clientHeight;
        let used = 0;
        for (const word of side.children) {
          word.style.display = '';
          used += word.getBoundingClientRect().height;
          if (used > room) word.style.display = 'none';
        }
      }
    };
    fit();
    if ('ResizeObserver' in window) new ResizeObserver(fit).observe(board);
  }

  // brand marks (Simple Icons; the Bangumi TV is redrawn from its site icon), keyed by link label
  const BRANDS = {
    github: ['#181717', 'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12'],
    bilibili: ['#00a1d6', 'M17.813 4.653h.854c1.51.054 2.769.578 3.773 1.574 1.004.995 1.524 2.249 1.56 3.76v7.36c-.036 1.51-.556 2.769-1.56 3.773s-2.262 1.524-3.773 1.56H5.333c-1.51-.036-2.769-.556-3.773-1.56S.036 18.858 0 17.347v-7.36c.036-1.511.556-2.765 1.56-3.76 1.004-.996 2.262-1.52 3.773-1.574h.774l-1.174-1.12a1.234 1.234 0 0 1-.373-.906c0-.356.124-.658.373-.907l.027-.027c.267-.249.573-.373.92-.373.347 0 .653.124.92.373L9.653 4.44c.071.071.134.142.187.213h4.267a.836.836 0 0 1 .16-.213l2.853-2.747c.267-.249.573-.373.92-.373.347 0 .662.151.929.4.267.249.391.551.391.907 0 .355-.124.657-.373.906zM5.333 7.24c-.746.018-1.373.276-1.88.773-.506.498-.769 1.13-.786 1.894v7.52c.017.764.28 1.395.786 1.893.507.498 1.134.756 1.88.773h13.334c.746-.017 1.373-.275 1.88-.773.506-.498.769-1.129.786-1.893v-7.52c-.017-.765-.28-1.396-.786-1.894-.507-.497-1.134-.755-1.88-.773zM8 11.107c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c0-.373.129-.689.386-.947.258-.257.574-.386.947-.386zm8 0c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c.017-.391.15-.711.4-.96.249-.249.56-.373.933-.373Z'],
    qq: ['#1ebafc', 'M21.395 15.035a40 40 0 0 0-.803-2.264l-1.079-2.695c.001-.032.014-.562.014-.836C19.526 4.632 17.351 0 12 0S4.474 4.632 4.474 9.241c0 .274.013.804.014.836l-1.08 2.695a39 39 0 0 0-.802 2.264c-1.021 3.283-.69 4.643-.438 4.673.54.065 2.103-2.472 2.103-2.472 0 1.469.756 3.387 2.394 4.771-.612.188-1.363.479-1.845.835-.434.32-.379.646-.301.778.343.578 5.883.369 7.482.189 1.6.18 7.14.389 7.483-.189.078-.132.132-.458-.301-.778-.483-.356-1.233-.646-1.846-.836 1.637-1.384 2.393-3.302 2.393-4.771 0 0 1.563 2.537 2.103 2.472.251-.03.581-1.39-.438-4.673'],
    bangumi: ['#f09199', 'M7.1 .9l.9-.7 3.5 4.8H10zM16.9 .9l-.9-.7-3.5 4.8H14zM3.5 5h17A2.5 2.5 0 0 1 23 7.5v9a2.5 2.5 0 0 1-2.5 2.5H9.6L5 23.2 5.6 19H3.5A2.5 2.5 0 0 1 1 16.5v-9A2.5 2.5 0 0 1 3.5 5zM4.2 8.6v1.2l2.6.9-2.6.9v1.2l4.6-2.1zM19.8 8.6l-4.6 2.1 4.6 2.1v-1.2l-2.6-.9 2.6-.9zM9.8 9.4l2.2 4 2.2-4zM4.2 14.2v.9h4.4v-.9zM4.2 15.9v.9h4.4v-.9zM15.4 14.2v.9h4.4v-.9zM15.4 15.9v.9h4.4v-.9z'],
  };

  // the adventurer's dossier: who keeps the board, where to find them, what to read
  // first and their friends' guilds; js/profile.js and guild/js/friends.js fill it in
  function dossier(el, quests) {
    const P = window.PROFILE;
    const friends = window.FRIENDS || [];
    if (!el || !P) return;
    const socials = P.links.filter((l) => BRANDS[l.label.toLowerCase()]).map((l) => {
      const [color, d] = BRANDS[l.label.toLowerCase()];
      const tip = l.hint || l.label;
      const away = /^https?:/.test(l.href) ? ' target="_blank" rel="noopener"' : '';
      return `<a class="seal-link" href="${esc(l.href)}"${away} style="--brand:${color}" title="${esc(tip)}" aria-label="${esc(tip)}">` +
        `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="${d}"/></svg></a>`;
    }).join('');
    const reads = quests.filter((q) => q.recommend).sort((a, b) => b.no - a.no);
    const read = (q) => `<li><a href="${BASE}q/${q.no}.html"><span class="reads__no">No.${q.no}</span>${esc(q.title)}</a></li>`;
    const friend = (f) => `<li><a href="${esc(f.link)}" target="_blank" rel="noopener">` +
      `<span class="friends__face" data-initial="${esc([...f.name.replace(/^[^\p{L}\p{N}]+/u, '')][0] || '?')}">${f.avatar ? `<img src="${esc(f.avatar)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : ''}</span>` +
      `<span class="friends__name">${esc(f.name)}</span><span class="friends__descr">${esc(f.descr || '')}</span></a></li>`;
    el.innerHTML = `<h2>冒险者档案</h2>
      <div class="dossier__id">
        <a class="portrait" href="${BASE}index.html" title="回到委托告示板">
          <img src="${BASE}../${esc(P.avatar)}" alt="${esc(P.name)} 的头像" width="120" height="120">
          <span class="portrait__lv">Lv.${P.level}</span>
        </a>
        <p class="dossier__name">${esc(P.name)}</p>
        <p class="dossier__job">${esc(P.job)} · ${esc(P.title)}</p>
        <p class="dossier__intro">${P.intro.map(esc).join(' · ')}</p>
      </div>
      <div class="seal-links">${socials}</div>
      ${reads.length ? `<h3>推荐阅读</h3><ol class="reads">${reads.map(read).join('')}</ol>` : ''}
      ${friends.length ? `<h3>友情链接</h3><ul class="friends">${friends.map(friend).join('')}</ul>` : ''}
      <p class="dossier__foot"><a href="${BASE}board.html">想交换友链？到留言板登记 →</a></p>`;
    // the first letter of a friend's name shows until their avatar loads, and stays if it fails
    for (const img of el.querySelectorAll('.friends__face img')) {
      const face = img.parentNode;
      const done = () => face.classList.add('is-loaded');
      if (img.complete && img.naturalWidth) done();
      img.addEventListener('load', done, { once: true });
      img.addEventListener('error', () => img.remove(), { once: true });
    }
  }

  // The side panels are sticky. One taller than the window would hide its foot, so its
  // offset follows the scroll: going down it slides up until its foot shows, going up
  // it slides back until its head shows; a short one simply stays at the top.
  function follow(list) {
    const GAP = 20;
    const panels = list.filter(Boolean);
    const offsets = new Map(panels.map((el) => [el, GAP]));
    let lastY = scrollY;
    const update = () => {
      const dy = scrollY - lastY;
      lastY = scrollY;
      for (const el of panels) {
        if (getComputedStyle(el).position !== 'sticky') continue;
        // the dossier's nail hangs above its frame: line the frames up, not the boxes
        const frame = el.querySelector('.dossier__board, .stand__board');
        const lift = frame ? frame.getBoundingClientRect().top - el.getBoundingClientRect().top : 0;
        const max = GAP - lift;
        const min = Math.min(max, innerHeight - el.offsetHeight - GAP);
        const top = Math.min(max, Math.max(min, offsets.get(el) - dy));
        offsets.set(el, top);
        el.style.top = `${top.toFixed(1)}px`;
      }
    };
    addEventListener('scroll', update, { passive: true });
    addEventListener('resize', update);
    // panels change height as their content arrives
    const ro = new ResizeObserver(update);
    panels.forEach((el) => ro.observe(el));
    update();
  }


  let questsPromise = null;
  const loadQuests = () => (questsPromise ||= fetch(BASE + 'data/quests.json').then((r) => r.json()));
  let searchPromise = null;
  const loadSearch = () => (searchPromise ||= fetch(BASE + 'data/search.json').then((r) => r.json()));

  // giscus cannot follow the CSS theme by itself: give it the matching theme on
  // load, and push a config change to the loaded iframe when the lamp is flipped
  const giscusTheme = () => (theme() === 'day' ? 'light' : 'dark');
  function paintGiscus() {
    for (const f of document.querySelectorAll('iframe.giscus-frame')) {
      try {
        f.contentWindow.postMessage({ giscus: { setConfig: { theme: giscusTheme() } } }, 'https://giscus.app');
      } catch (e) { /* iframe not ready yet: it will read data-theme when it loads */ }
    }
  }

  function giscus(el, term) {
    const s = document.createElement('script');
    const attrs = {
      src: 'https://giscus.app/client.js',
      'data-repo': GISCUS.repo,
      'data-repo-id': GISCUS.repoId,
      'data-category': GISCUS.category,
      'data-category-id': GISCUS.categoryId,
      'data-mapping': 'specific',
      'data-term': term,
      'data-strict': '0',
      'data-reactions-enabled': '1',
      'data-emit-metadata': '0',
      'data-input-position': 'top',
      'data-theme': giscusTheme(),
      'data-lang': 'zh-CN',
      'data-loading': 'lazy',
      crossorigin: 'anonymous',
      async: '',
    };
    for (const k in attrs) s.setAttribute(k, attrs[k]);
    el.appendChild(s);
    // the iframe arrives lazily; once it does, apply the theme chosen meanwhile
    const watch = new MutationObserver(() => {
      const f = el.querySelector('iframe.giscus-frame');
      if (!f) return;
      watch.disconnect();
      f.addEventListener('load', paintGiscus);
      paintGiscus();
    });
    watch.observe(el, { childList: true, subtree: true });
  }

  window.GUILD = { BASE, LINES, esc, fmtDate, rank, stamps, eris, tilt, asset, sheet, frame, dossier, follow, mountChrome, loadQuests, loadSearch, giscus };
})();
