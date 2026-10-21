// The quest board: every post as a quest sheet, filtered by quest line, tag,
// category or search, twelve to a page; the filters live in the URL.
// The notice stand beside it shows the guild's numbers, newest quests and tags;
// the adventurer's dossier on the other side shows who keeps the board.
(function () {
  'use strict';

  const { LINES, esc, eris, sheet, frame, mountChrome, loadQuests, loadSearch, dossier, follow } = window.GUILD;
  const PER_PAGE = 12;

  mountChrome('board');
  frame(document.getElementById('board'));

  const $quests = document.getElementById('quests');
  const $pager = document.getElementById('pager');
  const $lines = document.getElementById('lines');
  const $q = document.getElementById('q');
  const $note = document.getElementById('note');
  const $stand = document.getElementById('stand');
  const $dossier = document.getElementById('dossier');

  const params = new URLSearchParams(location.search);
  const state = {
    line: params.get('line') || '',
    tag: params.get('tag') || '',
    cat: params.get('cat') || '',
    q: params.get('q') || '',
    page: Math.max(1, Number(params.get('page')) || 1),
  };
  $q.value = state.q;

  let all = [];
  let texts = null;
  let shown = [];
  let cols = 0;

  // deal the sheets into columns left to right, so reading order runs along rows
  const colCount = () => Math.max(1, Math.floor(($quests.clientWidth + 24) / 254));
  function deal() {
    cols = colCount();
    $quests.style.setProperty('--cols', cols);
    if (!shown.length) {
      $quests.innerHTML = '<p class="empty">告示板上没有符合条件的委托。换个关键词试试？</p>';
      return;
    }
    const lanes = Array.from({ length: cols }, () => []);
    shown.forEach((q, i) => lanes[i % cols].push(sheet(q, i)));
    $quests.innerHTML = lanes.map((l) => `<ol class="qcol">${l.join('')}</ol>`).join('');
  }
  new ResizeObserver(() => {
    if (shown.length && colCount() !== cols) deal();
  }).observe($quests);

  // the query string for a page, filters included, so a copied or middle-clicked
  // pager link keeps the current filter instead of jumping back to the whole board
  function query(page = state.page) {
    const p = new URLSearchParams();
    for (const k of ['line', 'tag', 'cat', 'q']) if (state[k]) p.set(k, state[k]);
    if (page > 1) p.set('page', page);
    return p.toString();
  }

  function sync() {
    const qs = query();
    history.replaceState(null, '', qs ? '?' + qs : location.pathname);
  }

  function matches(q) {
    if (state.line && String(q.line) !== state.line) return false;
    if (state.tag && !q.tags.includes(state.tag)) return false;
    if (state.cat && !q.cats.includes(state.cat)) return false;
    if (state.q) {
      const hay = `${q.title} ${q.tags.join(' ')} ${q.cats.join(' ')} ${q.excerpt} ${texts ? texts.get(q.no) || '' : ''}`.toLowerCase();
      if (!state.q.toLowerCase().split(/\s+/).filter(Boolean).every((t) => hay.includes(t))) return false;
    }
    return true;
  }

  function renderLines() {
    const counts = {};
    for (const q of all) counts[q.line] = (counts[q.line] || 0) + 1;
    const btn = (id, label, n) =>
      `<button class="tag" type="button" data-line="${id}" aria-pressed="${state.line === id}">${esc(label)}<small>${n}</small></button>`;
    $lines.innerHTML = btn('', '全部委托', all.length) +
      Object.keys(LINES).filter((id) => counts[id]).map((id) => btn(id, LINES[id].name, counts[id])).join('');
  }

  function renderStand() {
    const total = all.reduce((s, q) => s + q.words, 0);
    const tagCount = new Map();
    for (const q of all) for (const t of q.tags) tagCount.set(t, (tagCount.get(t) || 0) + 1);
    const top = [...tagCount].sort((a, b) => b[1] - a[1]).slice(0, 16);
    const latest = [...all].sort((a, b) => b.no - a.no).slice(0, 5);
    $stand.innerHTML = `<h2>公会公告</h2>
      <ul>
        <li>欢迎来到阿克塞尔冒险者公会！</li>
        <li>新委托不定期张贴，接取请点委托单。</li>
        <li>完成委托后可到留言板交流冒险心得。</li>
      </ul>
      <h3>公会账簿</h3>
      <dl>
        <dt>张贴委托</dt><dd>${all.length} 张</dd>
        <dt>累计报酬</dt><dd>${eris(total)} 艾莉丝</dd>
        <dt>开张至今</dt><dd>${new Date().getFullYear() - 2019} 年</dd>
      </dl>
      <h3>最新张贴</h3>
      <ul>${latest.map((q) => `<li><a href="q/${q.no}.html">${esc(q.title)}</a></li>`).join('')}</ul>
      <h3>热门标签</h3>
      <div class="tags-cloud">${top.map(([t]) => `<a href="?tag=${encodeURIComponent(t)}" data-tag="${esc(t)}">${esc(t)}</a>`).join('')}</div>`;
  }

  function render() {
    const list = all.filter(matches).sort((a, b) => (b.sticky - a.sticky) || (b.no - a.no));
    const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
    state.page = Math.min(Math.max(1, Math.floor(state.page) || 1), pages);
    const slice = list.slice((state.page - 1) * PER_PAGE, state.page * PER_PAGE);

    shown = slice;
    deal();

    const bits = [];
    if (state.tag) bits.push(`标签「${esc(state.tag)}」`);
    if (state.cat) bits.push(`分类「${esc(state.cat)}」`);
    if (state.q) bits.push(`关键词「${esc(state.q)}」`);
    $note.hidden = !bits.length;
    if (bits.length) $note.innerHTML = `${bits.join(' · ')}：找到 ${list.length} 张委托<button type="button" id="clear">清除筛选</button>`;

    const link = (p, label) =>
      `<a class="tag" href="?${query(p)}" data-page="${p}"${p < 1 || p > pages ? ' aria-disabled="true"' : ''}>${label}</a>`;
    $pager.innerHTML = pages > 1
      ? `${link(state.page - 1, '← 上一页')}<span>第 ${state.page} / ${pages} 页告示</span>${link(state.page + 1, '下一页 →')}`
      : '';
    renderLines();
    sync();
  }

  $lines.addEventListener('click', (e) => {
    const b = e.target.closest('[data-line]');
    if (!b) return;
    state.line = b.dataset.line;
    state.page = 1;
    render();
  });

  $stand.addEventListener('click', (e) => {
    const a = e.target.closest('[data-tag]');
    if (!a) return;
    e.preventDefault();
    Object.assign(state, { tag: a.dataset.tag, line: '', page: 1 });
    render();
    document.getElementById('board').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  $pager.addEventListener('click', (e) => {
    // only the two links: <body data-page="board"> also matches a bare [data-page],
    // so a click on the "page x / y" label used to turn the page into NaN
    const a = e.target.closest('a[data-page]');
    if (!a || !$pager.contains(a)) return;
    e.preventDefault();
    if (a.getAttribute('aria-disabled') === 'true') return;
    state.page = Number(a.dataset.page);
    render();
    document.getElementById('board').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  $note.addEventListener('click', (e) => {
    if (e.target.id !== 'clear') return;
    Object.assign(state, { tag: '', cat: '', q: '', page: 1 });
    $q.value = '';
    render();
  });

  // full-text search: the post bodies load on the first keystroke
  let timer = 0;
  $q.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      state.q = $q.value.trim();
      state.page = 1;
      if (state.q && !texts) texts = new Map((await loadSearch()).map((s) => [s.no, s.text]));
      render();
    }, 160);
  });

  follow([document.querySelector('.dossier'), document.querySelector('.stand')]);
  dossier($dossier, []);
  loadQuests().then(async (quests) => {
    all = quests;
    if (state.q) texts = new Map((await loadSearch()).map((s) => [s.no, s.text]));
    renderStand();
    dossier($dossier, all);
    render();
  }).catch(() => {
    $quests.innerHTML = '<p class="empty">委托单取回失败了，请刷新页面再试一次。</p>';
  });
})();
