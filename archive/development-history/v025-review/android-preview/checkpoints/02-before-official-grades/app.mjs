import { initScorePicker } from './score-picker.mjs';

const $ = id => document.getElementById(id);
const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const note = {
  cert: '8077301-001', name: 'Hawaii – WWII Emergency Issue', year: '1935A', region: 'US',
  denomination: '$1', grade: '67 EPQ', catalog: '2300', serial: 'S51786112C', gradingDate: '2020-10-13'
};
const groups = [{
  id: 'official', name: '官网图片', source: 'PMG 中国网站', url: 'https://www.pmgnotes.cn/certlookup/8077301-001/67/',
  notes: '已保存的公开官网样例', front: { url: 'assets/front.jpg', filename: 'PMG8077301-001_REV.JPG' },
  back: { url: 'assets/back.jpg', filename: 'PMG8077301-001_OBV.JPG' }
}];
let preferred = 'official';
let selected = 'official';
let currentTab = 'images';
let site = 'cn';
let deleted = false;
let ascending = false;
let editing = null;
let toastTimeout;
let scorePicker;
const editorImages = { front: null, back: null };

function toast(message) {
  $('toast').textContent = message;
  $('toast').hidden = false;
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => { $('toast').hidden = true; }, 3200);
}

function message(title, text) {
  $('message-title').textContent = title;
  $('message-content').textContent = text;
  $('message-actions').replaceChildren();
  $('message-dialog').showModal();
}

function page(name, syncHash = true) {
  scorePicker?.close();
  if (!['library', 'query', 'more'].includes(name)) name = 'library';
  for (const candidate of ['library', 'query', 'more']) $(candidate + '-page').hidden = candidate !== name;
  document.querySelectorAll('[data-page]').forEach(button => {
    if (button.dataset.page === name) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
  if (syncHash && location.hash !== '#' + name) history.replaceState(null, '', '#' + name);
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function renderLayoutCard(layout) {
  const image = layout.image
    ? `<img src="${escape(layout.image.url)}" alt="${escape(layout.label)} · 公开样例 8077301-001">`
    : '<div class="text-cover"><span>HAWAII</span><strong>1935A</strong><small>文字封面方案</small></div>';
  const grade = layout.grade ? `<span class="note-grade">${escape(layout.grade)}</span>` : '';
  return `<button class="note-card" ${layout.id === 'main' ? 'id="open-note"' : ''}
      data-layout="${layout.id}" aria-label="查看公开样例 8077301-001 · ${escape(layout.label)}">
    <div class="note-photo">${image}</div>
    <div class="note-info">
      <div class="layout-label">${escape(layout.label)}</div>
      <h2>${escape(layout.title)}</h2>
      <p class="note-country">${escape(layout.subtitle)}</p>
      <div class="note-meta"><span>8077301-001</span>${grade}</div>
    </div>
  </button>`;
}

function renderLibrary() {
  const search = $('search').value.trim().toLowerCase();
  const matchesSearch = [note.cert, note.name, note.catalog, note.serial, note.year, note.region].join(' ').toLowerCase().includes(search);
  const matchesRegion = !$('country').value || $('country').value === note.region;
  const matchesGrade = !$('minimum-grade').value || Number($('minimum-grade').value) <= 67;
  const visible = !deleted && matchesSearch && matchesRegion && matchesGrade;
  const group = groups.find(item => item.id === preferred) || groups[0];
  const cover = group.front || group.back;
  $('library-count').textContent = visible ? '1 张公开样例 · 4 种排版预览' : '0 张公开样例';
  $('trash-summary').textContent = deleted ? '1 张样例 · 可恢复' : '暂无已删除藏品';
  const layouts = [
    { id: 'main', label: '排版样例 1 · 正面', title: 'Hawaii – WWII Emergency Issue', image: cover, subtitle: 'US · 1935A', grade: '67 EPQ' },
    { id: 'reverse', label: '排版样例 2 · 背面', title: 'Hawaii 1935A · 纸币背面', image: groups[0].back, subtitle: 'US · 1935A', grade: '67 EPQ' },
    { id: 'text', label: '排版样例 3 · 文字', title: 'Hawaii – WWII Emergency Issue', image: null, subtitle: 'US · 1935A', grade: '' },
    { id: 'long-title', label: '排版样例 4 · 长标题', title: 'Hawaii - WWII Emergency Issue, $1 1935A Small Size', image: groups[0].front, subtitle: 'US · 1935A', grade: '67 EPQ' }
  ];
  if (ascending) layouts.reverse();
  $('library-results').innerHTML = visible
    ? layouts.map(renderLayoutCard).join('')
    : '<div class="empty">没有符合条件的公开样例</div>';
  $('library-results').querySelectorAll('[data-layout]').forEach(button => button.addEventListener('click', openDetail));
}

function openDetail() {
  selected = preferred;
  currentTab = 'images';
  renderDetail();
  if (!$('detail').open) $('detail').showModal();
}

function renderDetail() {
  document.querySelectorAll('[data-tab]').forEach(button => button.setAttribute('aria-selected', String(button.dataset.tab === currentTab)));
  const panel = $('detail-panel');
  if (currentTab === 'info') {
    const fields = [['PMG 评级号码', note.cert], ['地区', note.region], ['钞票年份', note.year], ['分数', note.grade], ['目录号', note.catalog], ['冠字号', note.serial], ['评级日期', note.gradingDate], ['印章类型', 'Brown'], ['签名', 'Julian / Morgenthau'], ['评论', 'Exceptional Paper Quality']];
    panel.innerHTML = '<dl class="metadata">' + fields.map(([label, value]) => `<div><dt>${escape(label)}</dt><dd>${escape(value)}</dd></div>`).join('') + '</dl>';
    return;
  }
  if (currentTab === 'archive') {
    panel.innerHTML = '<div class="archive-preview"><small>网页存档布局预览</small><img src="assets/pmg-logo.svg" alt="PMG" style="max-width:90px"><h3>8077301-001 · 67 EPQ</h3><img src="assets/front.jpg" alt="公开样例钞票"><p>Hawaii – WWII Emergency Issue</p><small>此面板展示静态样例，原生版将在这里查看保存的网页截图与快照。</small></div>';
    return;
  }
  if (currentTab === 'history') {
    panel.innerHTML = '<div class="history-item"><h3>中国网站 · 样例采集</h3><p>2026-11-05 · 公开样例</p><p>认证信息、正反面原图、网页截图与静态页面</p></div>';
    return;
  }
  const group = groups.find(item => item.id === selected) || groups[0];
  panel.innerHTML = `<div class="group-selector" aria-label="图片组">${groups.map(item => `<button data-select="${escape(item.id)}" aria-pressed="${item.id === selected}">${escape(item.name)}${item.id === preferred ? ' · 展示' : ''}</button>`).join('')}</div><div class="group-pair">${['front', 'back'].map(side => `<figure class="group-image">${group[side] ? `<img src="${escape(group[side].url)}" alt="${side === 'front' ? '正面' : '背面'}原图"><figcaption><span>${side === 'front' ? '正面' : '背面'} · 原始图片</span><button data-save="${side}">保存原图</button></figcaption>` : `<div class="missing-side">未上传${side === 'front' ? '正面' : '背面'}</div>`}</figure>`).join('')}</div><div class="group-source"><b>${escape(group.source || '未填写来源')}</b>${group.url ? `<a href="${escape(group.url)}" target="_blank" rel="noopener noreferrer">${escape(group.url)}</a>` : ''}${group.notes ? `<p>${escape(group.notes)}</p>` : ''}</div><div class="group-controls"><button id="set-display" ${selected === preferred ? 'disabled' : ''}>${selected === preferred ? '当前展示组' : '设为展示组'}</button><button id="new-group">＋ 添加图片组</button>${group.id !== 'official' ? '<button id="edit-group">编辑</button>' : ''}</div>`;
  panel.querySelectorAll('[data-select]').forEach(button => button.addEventListener('click', () => { selected = button.dataset.select; renderDetail(); }));
  panel.querySelectorAll('[data-save]').forEach(button => button.addEventListener('click', () => download(group[button.dataset.save].url, group[button.dataset.save].filename)));
  $('set-display').onclick = () => { preferred = selected; renderLibrary(); renderDetail(); toast('已更新卡片和详情的展示组'); };
  $('new-group').onclick = () => editGroup();
  $('edit-group')?.addEventListener('click', () => editGroup(group));
}

function editGroup(group) {
  editing = group?.id || null;
  $('group-form').reset();
  $('group-editor').querySelector('h2').textContent = group ? '编辑图片组' : '添加图片组';
  for (const key of ['name', 'source', 'url', 'notes']) $('group-form').elements[key].value = group?.[key] || '';
  for (const side of ['front', 'back']) { editorImages[side] = group?.[side] || null; renderEditorImage(side); }
  $('group-error').hidden = true;
  $('group-editor').showModal();
}

function renderEditorImage(side) {
  const region = document.querySelector(`[data-preview="${side}"]`);
  region.innerHTML = editorImages[side] ? `<img src="${escape(editorImages[side].url)}" alt="待保存${side === 'front' ? '正面' : '背面'}">` : `＋ 选择${side === 'front' ? '正面' : '背面'}`;
}

function download(url, filename) {
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
}

function queryPreview() {
  scorePicker.close();
  if (!$('query-form').reportValidity()) return;
  const cert = $('query-cert').value.replace(/\D/g, '');
  const grade = String(Number($('query-grade').value));
  if (cert !== '8077301001' || grade !== '67') {
    message('预览样例范围', '当前界面预览仅提供 8077301-001 / 67 的公开样例。原生版会使用你填写的号码和评分访问所选官网。');
    return;
  }
  const website = site === 'cn' ? '中国网站' : '全球网站';
  $('site-address').textContent = site === 'cn' ? 'www.pmgnotes.cn' : 'www.pmgnotes.com';
  $('query-state').textContent = website + ' · 样例流程';
  $('official-content').innerHTML = '<small>已保存的公开样例 · 非实时查询</small><img class="official-sample" src="assets/front.jpg" alt="Hawaii 1935A 官网原图"><div class="official-fields"><div><span>PMG 评级号码</span><b>8077301-001</b></div><div><span>等级</span><b>67 EPQ</b></div><div><span>地区 / 年份</span><b>US / 1935A</b></div></div>';
  $('capture-result').hidden = false;
}

document.querySelectorAll('[data-page]').forEach(button => button.onclick = () => page(button.dataset.page));
$('query-site').onchange = () => {
  site = $('query-site').value;
  $('site-address').textContent = site === 'cn' ? 'www.pmgnotes.cn' : 'www.pmgnotes.com';
};
$('verify-help').onclick = () => message('检验 PMG 评级', '使用封套上的评级号码和评分，在所选官方网站核对认证信息。本页提供 8077301-001 / 67 的公开样例流程。');
document.querySelectorAll('[data-tab]').forEach(button => button.onclick = () => { currentTab = button.dataset.tab; renderDetail(); });
$('search').oninput = renderLibrary;
$('country').onchange = renderLibrary;
$('minimum-grade').oninput = renderLibrary;
$('filter-button').onclick = () => { $('filter-panel').hidden = !$('filter-panel').hidden; };
$('sort-button').onclick = () => { ascending = !ascending; $('sort-button').textContent = ascending ? '年份升序 ↑' : '年份降序 ↓'; renderLibrary(); };
$('reset-filter').onclick = () => { $('country').value = ''; $('minimum-grade').value = ''; renderLibrary(); };
$('add-note')?.addEventListener('click', () => page('query'));
$('more-top').onclick = () => page('more');
$('close-detail').onclick = () => $('detail').close();
$('close-editor').onclick = () => $('group-editor').close();
$('message-close').onclick = () => $('message-dialog').close();
$('query-form').onsubmit = event => { event.preventDefault(); queryPreview(); };
$('refresh-demo').onclick = queryPreview;
$('open-query-note').onclick = openDetail;
scorePicker = initScorePicker({
  input: $('query-grade'),
  toggle: $('score-picker-toggle'),
  panel: $('score-picker'),
  options: $('score-options'),
  closeButton: $('score-picker-close')
});
const systemTheme = matchMedia('(prefers-color-scheme: dark)');
let themeMode = 'system';
function applyTheme(mode) {
  if (!['system', 'light', 'dark'].includes(mode)) return;
  themeMode = mode;
  const theme = mode === 'system' ? (systemTheme.matches ? 'dark' : 'light') : mode;
  document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.themeMode = mode;
  $('theme-mode').value = mode;
}
window.pmgPreviewTheme = applyTheme;
window.addEventListener('message', event => {
  if (event.source !== parent || event.origin !== location.origin) return;
  if (event.data?.type === 'pmg-preview-theme') applyTheme(event.data.value);
});
systemTheme.addEventListener('change', () => { if (themeMode === 'system') applyTheme('system'); });
$('theme-mode').onchange = () => applyTheme($('theme-mode').value);
const requestedTheme = new URLSearchParams(location.search).get('theme');
applyTheme(['system', 'light', 'dark'].includes(requestedTheme) ? requestedTheme : 'system');

$('group-form').addEventListener('change', async event => {
  const side = event.target.name;
  if (!['front', 'back'].includes(side)) return;
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw Error('请选择 JPG、PNG 或 WebP 图片');
    const decoded = await createImageBitmap(file);
    decoded.close();
    editorImages[side] = { url: URL.createObjectURL(file), filename: file.name, file };
    renderEditorImage(side);
  } catch (failure) { $('group-error').textContent = failure.message; $('group-error').hidden = false; }
});
$('group-form').onsubmit = event => {
  event.preventDefault();
  try {
    const form = $('group-form');
    const name = form.elements.name.value.trim();
    if (!name) throw Error('请输入图片组名称');
    if (!editorImages.front && !editorImages.back) throw Error('请至少选择一张正面或背面图片');
    let url = form.elements.url.value.trim();
    if (url) {
      const link = new URL(url);
      if (!['http:', 'https:'].includes(link.protocol) || link.username || link.password) throw Error('网址需使用不含账号密码的 HTTP 或 HTTPS 地址');
      url = link.href;
    }
    const group = { id: editing || 'upload-' + crypto.randomUUID(), name, source: form.elements.source.value.trim(), url, notes: form.elements.notes.value.trim(), front: editorImages.front, back: editorImages.back };
    const position = groups.findIndex(item => item.id === group.id);
    if (position < 0) groups.push(group); else groups[position] = group;
    selected = group.id;
    $('group-editor').close();
    renderDetail();
    renderLibrary();
    toast('已保存到本次界面预览');
  } catch (failure) { $('group-error').textContent = failure.message; $('group-error').hidden = false; }
};
$('delete-note').onclick = () => {
  $('detail').close();
  deleted = true;
  renderLibrary();
  toast('样例已移入回收站，可在更多中恢复');
};
$('trash-open').onclick = () => {
  message('回收站', deleted ? '8077301-001 · Hawaii – WWII Emergency Issue' : '回收站为空');
  if (deleted) {
    const restore = document.createElement('button');
    restore.className = 'primary'; restore.textContent = '恢复样例藏品';
    restore.onclick = () => { deleted = false; renderLibrary(); $('message-dialog').close(); toast('已恢复样例藏品'); };
    $('message-actions').append(restore);
  }
};
document.querySelectorAll('[data-info]').forEach(button => button.onclick = () => message(button.dataset.info === 'import' ? '导入档案' : '导出整库', 'Android 原生版会通过系统文件选择器读写 PMGX 和整库 ZIP，并包含原图、网页快照、文字信息和图片组。这个控件目前用于确认界面位置。'));
$('export-preview').onclick = () => {
  const exported = { format: 'pmg-android-ui-preview', preferredImageGroupId: preferred, groups: groups.map(({ id, name, source, url, notes, front, back }) => ({ id, name, source, url, notes, frontFilename: front?.filename, backFilename: back?.filename })) };
  const url = URL.createObjectURL(new Blob([JSON.stringify(exported, null, 2)], { type: 'application/json' }));
  download(url, 'PMG-Android-UI-preview-settings.json');
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
renderLibrary();
function pageFromHash() {
  page(location.hash.slice(1) || 'library', false);
}
window.addEventListener('hashchange', pageFromHash);
pageFromHash();
