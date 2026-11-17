import { hash } from '../lib/archive.mjs';
import { displayGroup, imageGroups, imageTypes, officialGroupId, sourceUrl, storeImageGroup } from '../lib/image-groups.mjs';

async function prepareImage(file, id) {
  if (!imageTypes.has(file.type)) throw Error('请选择 JPG、PNG 或 WebP 图片');
  const bitmap = await createImageBitmap(file);
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const sha256 = await hash(bytes);
    return {
      bytes,
      resource: {
        path: `images/uploads/${id}/${sha256}.${imageTypes.get(file.type)}`,
        role: 'uploaded-image', mediaType: file.type, sha256, bytes: bytes.length,
        originalFilename: file.name, width: bitmap.width, height: bitmap.height
      }
    };
  } finally {
    bitmap.close();
  }
}

export function mountImageGroups(root, initial, { escape, imageUrl, commit, toast, run }) {
  let record = initial;
  let editId = null;
  let busy = false;
  root.innerHTML = `
    <div class="image-group-heading">
      <div><h3>钞票图片</h3><p>选择一组作为详情页与藏品卡片的默认图片。</p></div>
      <button type="button" class="primary" data-add-group>＋ 添加图片组</button>
    </div>
    <div data-display-images></div>
    <div class="image-group-list" data-image-group-list></div>
    <form class="image-group-form" hidden>
      <h4 data-edit-title></h4>
      <label>组名<input name="name" maxlength="100" required></label>
      <div class="image-group-columns">
        <label>正面图片<input name="front" type="file" accept="image/jpeg,image/png,image/webp"><small data-side-hint="front"></small></label>
        <label>背面图片<input name="back" type="file" accept="image/jpeg,image/png,image/webp"><small data-side-hint="back"></small></label>
      </div>
      <div class="image-group-columns">
        <label>来源名称<input name="source" maxlength="160"></label>
        <label>来源网址<input name="url" type="url" maxlength="2048" placeholder="https://"></label>
      </div>
      <label>备注<textarea name="notes" rows="2" maxlength="2000"></textarea></label>
      <p class="image-group-error" role="alert" hidden></p>
      <div class="image-group-actions">
        <button type="button" data-cancel-group>取消</button>
        <button type="submit" class="primary">保存图片组</button>
      </div>
    </form>`;

  const form = root.querySelector('form');
  const error = form.querySelector('[role="alert"]');
  const pictures = root.querySelector('[data-display-images]');
  const list = root.querySelector('[data-image-group-list]');

  function render() {
    const groups = imageGroups(record);
    const active = displayGroup(record, groups);
    pictures.innerHTML = active
      ? `<p class="image-group-caption">当前展示 · ${escape(active.name)}</p><div class="detail-images">${active.images.map(({ resource, label }) => `
          <div><img src="${imageUrl(record, resource)}" alt="${escape(label)}" data-image="${escape(resource.path)}">
          <small>${escape(label)} · ${escape(resource.width ?? '?')} × ${escape(resource.height ?? '?')}
          · <button type="button" data-download="${escape(resource.path)}">保存原图</button></small></div>`).join('')}</div>`
      : '<div class="placeholder"><b>暂无图片</b>可为这张藏品添加一组正面或背面图片。</div>';
    list.innerHTML = groups.map(group => {
      const official = group.id === officialGroupId;
      const chosen = group.id === active?.id;
      const link = group.url ? `<a href="${escape(sourceUrl(group.url))}" target="_blank" rel="noopener noreferrer">查看来源 ↗</a>` : '';
      return `<div class="image-group-row${chosen ? ' is-display' : ''}">
        <div><strong>${escape(group.name)}</strong>
          <span class="badge">${official ? '官网采集' : '自行上传'} · ${group.images.length} 张</span>
          ${chosen ? '<span class="badge">当前展示组</span>' : ''}
          ${group.source || link ? `<p>${escape(group.source || '')} ${link}</p>` : ''}
          ${group.notes ? `<p>${escape(group.notes)}</p>` : ''}
        </div>
        <div class="image-group-actions">
          ${official ? '' : `<button type="button" data-edit-group="${escape(group.id)}">编辑</button>`}
          <button type="button" data-display-group="${escape(group.id)}" ${chosen || !group.cover ? 'disabled' : ''}>设为展示组</button>
        </div>
      </div>`;
    }).join('');
  }

  function edit(group) {
    editId = group?.id ?? null;
    form.reset();
    form.querySelector('[data-edit-title]').textContent = group ? '编辑图片组' : '添加图片组';
    for (const name of ['name', 'source', 'url', 'notes']) form.elements[name].value = group?.[name] ?? '';
    for (const side of ['front', 'back']) {
      form.querySelector(`[data-side-hint="${side}"]`).textContent = group?.[side] ? '已保存图片，选新文件可替换' : '可选';
    }
    error.hidden = true;
    form.hidden = false;
    form.elements.name.focus();
  }

  root.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button || busy) return;
    if (button.hasAttribute('data-add-group')) edit();
    if (button.hasAttribute('data-edit-group')) edit(record.manifest.imageGroups.find(group => group.id === button.dataset.editGroup));
    if (button.hasAttribute('data-cancel-group')) form.hidden = true;
    if (button.hasAttribute('data-display-group')) run(async () => {
      busy = true;
      try {
        const id = button.dataset.displayGroup;
        record = await commit(current => {
          if (!imageGroups(current).some(group => group.id === id && group.cover)) throw Error('这组图片已不可用');
          return { ...current, manifest: { ...current.manifest, preferredImageGroupId: id } };
        });
        render();
        toast('已更新默认展示组');
      } finally { busy = false; }
    });
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy) return;
    busy = true;
    const submit = form.querySelector('[type="submit"]');
    submit.disabled = true;
    error.hidden = true;
    try {
      const fields = new FormData(form);
      const id = editId ?? 'upload-' + crypto.randomUUID();
      const name = fields.get('name').trim();
      if (!name) throw Error('请输入图片组名称');
      const url = sourceUrl(fields.get('url').trim());
      const additions = new Map();
      for (const side of ['front', 'back']) {
        const file = fields.get(side);
        if (file?.name) additions.set(side, await prepareImage(file, id));
      }
      record = await commit(current => {
        const previous = current.manifest.imageGroups?.find(group => group.id === id);
        const group = {
          id, name, url,
          source: fields.get('source').trim(),
          notes: fields.get('notes').trim(),
          updatedAt: new Date().toISOString(),
          front: additions.get('front')?.resource.path ?? previous?.front ?? null,
          back: additions.get('back')?.resource.path ?? previous?.back ?? null
        };
        if (!group.front && !group.back) throw Error('请至少选择一张正面或背面图片');
        return storeImageGroup(current, group, additions.values());
      });
      form.hidden = true;
      render();
      toast('图片组已保存');
    } catch (failure) {
      error.textContent = failure.message || '图片组保存失败';
      error.hidden = false;
    } finally {
      busy = false;
      submit.disabled = false;
    }
  });
  render();
}
