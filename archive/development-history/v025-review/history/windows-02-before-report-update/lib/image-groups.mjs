import { originalResources } from './domain.mjs';

export const officialGroupId = 'official';
export const imageTypes = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp']
]);

export function sourceUrl(value) {
  if (!value) return '';
  let url;
  try { url = new URL(value); } catch { throw Error('请输入完整的来源网址'); }
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) {
    throw Error('来源网址只支持不含账号密码的 HTTP 或 HTTPS 地址');
  }
  return url.href;
}

export function validateImageGroups(manifest) {
  const groups = manifest.imageGroups ?? [];
  if (!Array.isArray(groups)) throw Error('图片组清单无效');
  const ids = new Set([officialGroupId]);
  const resources = new Map(manifest.resources.map(resource => [resource.path, resource]));
  for (const group of groups) {
    if (!group || typeof group.id !== 'string' || !/^upload-[a-f\d-]{36}$/.test(group.id) ||
        ids.has(group.id) || !group.name || !['name', 'source', 'url', 'notes', 'updatedAt'].every(key => typeof group[key] === 'string') ||
        !Number.isFinite(Date.parse(group.updatedAt)) || (!group.front && !group.back)) {
      throw Error('图片组清单无效');
    }
    ids.add(group.id);
    sourceUrl(group.url);
    for (const side of ['front', 'back']) {
      if (group[side] === null) continue;
      const resource = resources.get(group[side]);
      if (resource?.role !== 'uploaded-image' || !imageTypes.has(resource.mediaType) ||
          !resource.path.startsWith('images/uploads/' + group.id + '/')) {
        throw Error('图片组引用了无效的图片资源');
      }
    }
  }
  if (manifest.preferredImageGroupId !== undefined && !ids.has(manifest.preferredImageGroupId)) {
    throw Error('展示组引用无效');
  }
}

export function imageGroups(record) {
  const resources = new Map(record.manifest.resources.map(resource => [resource.path, resource]));
  const official = originalResources(record);
  return [
    {
      id: officialGroupId,
      name: '官网图片',
      images: official.map(resource => ({
        resource,
        label: { obverse: '正面', reverse: '背面' }[resource.visualSide] ?? '方向未知'
      })),
      cover: official.find(image => image.visualSide === 'obverse') ?? official[0]
    },
    ...(record.manifest.imageGroups ?? []).map(group => {
      const images = [
        { resource: resources.get(group.front), label: '正面' },
        { resource: resources.get(group.back), label: '背面' }
      ].filter(image => image.resource);
      return { ...group, images, cover: images[0]?.resource };
    })
  ];
}

export function displayGroup(record, groups = imageGroups(record)) {
  return groups.find(group => group.id === record.manifest.preferredImageGroupId && group.cover)
    ?? groups.find(group => group.cover);
}

export function mergeImageGroupMetadata(current, incoming) {
  const groups = new Map((current.imageGroups ?? []).map(group => [group.id, group]));
  for (const group of incoming.imageGroups ?? []) {
    const previous = groups.get(group.id);
    if (!previous || Date.parse(previous.updatedAt) < Date.parse(group.updatedAt)) groups.set(group.id, group);
  }
  const preferredImageGroupId = current.preferredImageGroupId ?? incoming.preferredImageGroupId;
  return {
    ...(groups.size ? { imageGroups: [...groups.values()] } : {}),
    ...(preferredImageGroupId !== undefined ? { preferredImageGroupId } : {})
  };
}

export function storeImageGroup(record, group, additions) {
  const groups = new Map((record.manifest.imageGroups ?? []).map(item => [item.id, item]));
  groups.set(group.id, group);
  const resources = new Map(record.manifest.resources.map(resource => [resource.path, resource]));
  const files = new Map(record.files);
  for (const { resource, bytes } of additions) {
    if (!resources.has(resource.path)) resources.set(resource.path, resource);
    if (!files.has(resource.path)) files.set(resource.path, bytes);
  }
  const manifest = { ...record.manifest, imageGroups: [...groups.values()], resources: [...resources.values()] };
  validateImageGroups(manifest);
  return { ...record, manifest, files: [...files] };
}
