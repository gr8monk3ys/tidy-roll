import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const EXT = path.join(ROOT, 'extension');

const manifest = JSON.parse(await readFile(path.join(EXT, 'manifest.json'), 'utf8'));
const pkg = JSON.parse(await readFile(path.join(ROOT, 'package.json'), 'utf8'));

describe('manifest.json', () => {
  test('is Manifest V3 with the required fields', () => {
    assert.equal(manifest.manifest_version, 3);
    assert.ok(manifest.name.length > 0 && manifest.name.length <= 75, 'store name limit is 75 chars');
    assert.ok(/^\d+\.\d+\.\d+$/.test(manifest.version));
    assert.ok(manifest.description.length > 0 && manifest.description.length <= 132,
      'store description limit is 132 chars');
  });

  test('version matches package.json', () => {
    assert.equal(manifest.version, pkg.version);
  });

  test('asks only for the storage permission', () => {
    assert.deepEqual(manifest.permissions, ['storage']);
    assert.equal(manifest.host_permissions, undefined);
    assert.equal(manifest.content_scripts, undefined);
  });

  test('every referenced file exists', async () => {
    const files = [
      ...Object.values(manifest.icons),
      ...Object.values(manifest.action.default_icon),
      manifest.action.default_popup,
    ];
    for (const file of files) {
      await assert.doesNotReject(access(path.join(EXT, file)), `missing: ${file}`);
    }
  });

  test('app entry point and demo samples exist', async () => {
    await assert.doesNotReject(access(path.join(EXT, 'app', 'app.html')));
    const demoSource = await readFile(path.join(EXT, 'app', 'demo.js'), 'utf8');
    const sampleFiles = [...demoSource.matchAll(/file: '([^']+)'/g)].map((match) => match[1]);
    assert.ok(sampleFiles.length >= 10, 'expected a meaningful demo roll');
    for (const file of sampleFiles) {
      await assert.doesNotReject(access(path.join(EXT, 'app', 'samples', file)), `missing sample: ${file}`);
    }
  });
});
