import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import path from 'node:path';

const root = path.resolve('dist-pages');
const html = await fs.readFile(path.join(root, 'index.html'), 'utf8');
const base = process.env.PAGES_BASE_PATH || '/framecut/';
assert(html.includes(`name="framecut-base" content="${base}"`), 'Missing static asset base');
assert(!html.includes('127.0.0.1'), 'Production HTML must not use a localhost address');
const references = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(match => match[1]);
for (const reference of references) {
  assert(reference.startsWith(base), `Asset outside site base: ${reference}`);
  await fs.access(path.join(root, reference.slice(base.length)));
}
const manifest = JSON.parse(await fs.readFile(path.join(root, 'ffmpeg/core-manifest.json'), 'utf8'));
let size = 0;
for (const part of manifest.parts) size += (await fs.stat(path.join(root, 'ffmpeg', part))).size;
assert.equal(size, manifest.size, 'Incomplete WASM engine');
for (const asset of ['ffmpeg/bootstrap.js', 'ffmpeg/worker.js', 'ffmpeg/ffmpeg-core.js', 'demo.mp4', 'demo-poster.svg', '.nojekyll']) {
  await fs.access(path.join(root, asset));
}
console.log(`Static deployment verified: ${base}, ${references.length} HTML assets, ${size} engine bytes.`);
