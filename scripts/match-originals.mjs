// Matches canvas placeholder images to drive originals by difference hash.
import sharp from 'sharp';
import { readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const [canvasDir, outFile, ...roots] = process.argv.slice(2);
const IMG = /\.(jpe?g|png)$/i;

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...await walk(p));
    else if (IMG.test(e.name)) out.push(p);
  }
  return out;
}
async function dhash(file) {
  const { data } = await sharp(file, { failOn: 'none' }).rotate().greyscale().resize(17, 16, { fit: 'fill' }).raw().toBuffer({ resolveWithObject: true });
  const bits = [];
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) bits.push(data[y * 17 + x] > data[y * 17 + x + 1] ? 1 : 0);
  return bits;
}
const dist = (a, b) => a.reduce((n, v, i) => n + (v !== b[i]), 0);

const originals = [];
for (const r of roots) for (const f of await walk(r)) {
  try { const m = await sharp(f).metadata(); originals.push({ f, w: m.width, h: m.height, hash: await dhash(f) }); } catch {}
}
const result = {};
for (const name of (await readdir(canvasDir)).filter((n) => /^[0-9a-f]{32}\.jpg$/.test(n))) {
  const h = await dhash(path.join(canvasDir, name));
  const ranked = originals.map((o) => ({ ...o, d: dist(h, o.hash) })).sort((a, b) => a.d - b.d || b.w - a.w);
  const best = ranked[0];
  result[name.slice(0, 32)] = { file: best.f, d: best.d, w: best.w, h: best.h, next: ranked[1]?.d };
}
await writeFile(outFile, JSON.stringify(result, null, 1));
console.log(originals.length, 'originals scanned');
