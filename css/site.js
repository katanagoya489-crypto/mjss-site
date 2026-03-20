const NAV_ITEMS = [
  { href: 'index.html', label: 'ホーム' },
  { href: 'concept.html', label: '理念' },
  { href: 'rules.html', label: 'お願い' },
  { href: 'entry.html', label: '参加フォーム' },
  { href: 'next-performers.html', label: '次回参加者' },
  { href: 'past-performers.html', label: '過去参加者' },
  { href: 'creators.html', label: 'クリエイター' },
  { href: 'staff.html', label: 'スタッフ' },
  { href: 'omake.html', label: 'おまけ' },
  { href: 'works.html', label: '仕事依頼' }
];
function buildImageUrl(rawImage) {
  if (!rawImage || typeof rawImage !== 'string') return '';
  const value = rawImage.trim();
  if (!value) return '';
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  if (value.startsWith('/')) return value;
  if (value.startsWith('images/')) return '/' + value;
  return '/images/uploads/' + value;
}
async function loadSiteConfig() {
  const res = await fetch('/data/site.json');
  return await res.json();
}
function applySiteStyle(site = {}) {
  const root = document.documentElement;
  const map = {
    font_family: '--font-family',
    text_color: '--text-color',
    heading_color: '--heading-color',
    button_text_color: '--button-text-color',
    button_border_color: '--button-border-color',
    button_bg_color: '--button-bg-color',
    nav_text_color: '--nav-text-color',
    nav_border_color: '--nav-border-color',
    nav_bg_color: '--nav-bg-color',
    bg_top_color: '--bg-top-color',
    bg_bottom_color: '--bg-bottom-color',
    heading_size: '--heading-size',
    body_size: '--body-size',
    nav_size: '--nav-size',
    button_size: '--button-size',
  };
  Object.entries(map).forEach(([k, v]) => { if (site[k]) root.style.setProperty(v, site[k]); });
  document.title = document.title.replace('MJSS', site.site_name || 'MJSS');
}
function renderNav(current) {
  const wrap = document.getElementById('site-nav');
  if (!wrap) return;
  wrap.innerHTML = NAV_ITEMS.map(item => `<a href="${item.href}" class="nav-pill"${item.href===current?' aria-current="page"':''}>${item.label}</a>`).join('');
}
function safeText(v){ return (v || '').replace(/[&<>"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m])); }
function nl2br(v){ return safeText(v).replace(/\n/g, '<br>'); }
async function renderSimplePage(jsonPath) {
  const site = await loadSiteConfig(); applySiteStyle(site); renderNav(location.pathname.split('/').pop() || 'index.html');
  const data = await (await fetch(jsonPath)).json();
  document.getElementById('page-title').textContent = data.title || '';
  document.getElementById('page-body').innerHTML = nl2br(data.body || '');
}
async function renderCollectionPage(jsonPath, targetId, type) {
  const site = await loadSiteConfig(); applySiteStyle(site); renderNav(location.pathname.split('/').pop() || 'index.html');
  const data = await (await fetch(jsonPath)).json();
  const items = Array.isArray(data.items) ? data.items : []; const container = document.getElementById(targetId); container.innerHTML = '';
  items.forEach(item => {
    const img = buildImageUrl(item.image); let buttons = '';
    if (type === 'performer') { if (item.x_url && item.x_url !== '#') buttons += `<a class="btn" href="${item.x_url}" target="_blank" rel="noopener noreferrer">Xを見る</a>`; if (item.media_url && item.media_url !== '#') buttons += `<a class="btn" href="${item.media_url}" target="_blank" rel="noopener noreferrer">媒体を見る</a>`; }
    else if (type === 'creator') { if (item.x_url && item.x_url !== '#') buttons += `<a class="btn" href="${item.x_url}" target="_blank" rel="noopener noreferrer">Xを見る</a>`; if (item.portfolio_url && item.portfolio_url !== '#') buttons += `<a class="btn" href="${item.portfolio_url}" target="_blank" rel="noopener noreferrer">ポートフォリオ</a>`; }
    const pills = Array.isArray(item.tags) ? item.tags.map(t => `<span class="pill">${safeText(t)}</span>`).join('') : (item.role ? `<span class="pill">${safeText(item.role)}</span>` : '');
    const el = document.createElement('article'); el.className = 'card';
    el.innerHTML = `<div class="thumb">${img ? `<img src="${img}" alt="${safeText(item.name || '')}" class="thumb-image">` : '画像枠'}</div><h3>${safeText(item.name || '')}</h3><div class="pill-row">${pills}</div><div class="text-block">${nl2br(item.description || '')}</div><div class="actions">${buttons}</div>`;
    container.appendChild(el);
  });
}
async function renderStaffPage() {
  const site = await loadSiteConfig(); applySiteStyle(site); renderNav(location.pathname.split('/').pop() || 'index.html');
  const page = await (await fetch('/data/staff-page.json')).json(); const list = await (await fetch('/data/staff-list.json')).json();
  document.getElementById('page-title').textContent = page.title || ''; document.getElementById('page-body').innerHTML = nl2br(page.body || '');
  const container = document.getElementById('staff-list'); container.innerHTML = '';
  (list.items || []).forEach(item => {
    const img = buildImageUrl(item.image); const el = document.createElement('article'); el.className = 'card';
    el.innerHTML = `<div class="thumb">${img ? `<img src="${img}" alt="${safeText(item.name || '')}" class="thumb-image">` : '画像枠'}</div><h3>${safeText(item.name || '')}</h3><div class="pill-row">${item.role ? `<span class="pill">${safeText(item.role)}</span>` : ''}</div><div class="text-block">${nl2br(item.description || '')}</div>`;
    container.appendChild(el);
  });
}
async function renderOmakePage() {
  const site = await loadSiteConfig(); applySiteStyle(site); renderNav(location.pathname.split('/').pop() || 'index.html');
  const page = await (await fetch('/data/omake-page.json')).json(); const blog = await (await fetch('/data/staff-blog.json')).json();
  document.getElementById('page-title').textContent = page.title || ''; document.getElementById('page-body').innerHTML = nl2br(page.body || '');
  const container = document.getElementById('blog-list'); container.innerHTML = '';
  (blog.items || []).forEach(item => {
    const el = document.createElement('article'); el.className = 'card';
    el.innerHTML = `<div class="meta">${safeText(item.date || '')}</div><h3>${safeText(item.title || '')}</h3><div class="text-block">${nl2br(item.body || '')}</div>`;
    container.appendChild(el);
  });
}
async function renderHome() {
  const site = await loadSiteConfig(); applySiteStyle(site); renderNav('index.html');
  document.getElementById('logo-badge').innerHTML = site.hero_logo_image ? `<img class="logo-image" src="${buildImageUrl(site.hero_logo_image)}" alt="${safeText(site.site_name || 'MJSS')}">` : safeText(site.site_name || 'MJSS');
  document.getElementById('hero-title').textContent = site.hero_title || '';
  document.getElementById('hero-lead').innerHTML = nl2br(site.hero_lead || '');
  document.getElementById('hero-announcement').textContent = site.announcement || '';
  const hero = document.getElementById('hero-inner'); const bg = buildImageUrl(site.hero_bg_image); if (bg) hero.style.backgroundImage = `url('${bg}')`;
}
