import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pack, unpack, merge, hash } from '../lib/archive.mjs';
import { displayGroup, storeImageGroup, sourceUrl } from '../lib/image-groups.mjs';

test('uploaded group and cover round-trip through PMGX and survive older imports and new captures', async () => {
  const official = new Uint8Array([255, 216, 1, 255, 217]);
  const uploaded = new Uint8Array([255, 216, 2, 255, 217]);
  const original = {
    note: { certificationNumber: '8077301-001', name: 'Test note', grade: { numeric: 67 } },
    manifest: {
      noteId: 'pmg:8077301-001', archiveId: 'baseline', captures: [{ id: 'old' }],
      resources: [{ path: 'official.jpg', role: 'original', mediaType: 'image/jpeg', visualSide: 'obverse' }]
    },
    files: [['official.jpg', official]]
  };
  const before = await unpack(await pack(original));
  const id = 'upload-00000000-0000-4000-8000-000000000001';
  const digest = await hash(uploaded);
  const path = `images/uploads/${id}/${digest}.jpg`;
  const group = {
    id, name: 'Back only', source: 'Test source', url: sourceUrl('https://example.org/lot/1'),
    notes: 'Test provenance', updatedAt: '2026-11-10T00:00:00Z', front: null, back: path
  };
  const edited = storeImageGroup(before, group, [{
    resource: { path, role: 'uploaded-image', mediaType: 'image/jpeg', sha256: digest, bytes: uploaded.length },
    bytes: uploaded
  }]);
  edited.manifest.preferredImageGroupId = id;
  const restored = await unpack(await pack(edited));
  const active = displayGroup(restored);
  assert.equal(active.cover.path, path);
  assert.deepEqual(active.images.map(image => image.label), ['背面']);
  assert.deepEqual(restored.manifest.imageGroups, [group]);
  assert.deepEqual(new Map(restored.files).get(path), uploaded);
  assert.deepEqual(new Map(restored.files).get('official.jpg'), official);
  const older = await merge(restored, before);
  assert.equal(displayGroup(older).id, id);
  const newerCapture = await unpack(await pack({
    ...original, manifest: { ...original.manifest, captures: [{ id: 'new' }] }
  }));
  const recaptured = await merge(older, newerCapture);
  assert.deepEqual(recaptured.manifest.captures.map(item => item.id), ['old', 'new']);
  assert.deepEqual(recaptured.manifest.imageGroups, [group]);
  assert.equal(displayGroup(recaptured).id, id);
  assert.throws(() => storeImageGroup(before, { ...group, back: 'official.jpg' }, []), /无效的图片资源/);
});
