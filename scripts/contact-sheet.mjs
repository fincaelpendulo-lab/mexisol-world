// Makes numbered contact sheets: node contact-sheet.mjs outPrefix step dir...
import sharp from 'sharp';
import { readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
const [out, stepArg, ...dirs] = process.argv.slice(2);
const step = Number(stepArg);
const files = [];
async function walk(d) { for (const e of await readdir(d, { withFileTypes: true })) { if (e.name.startsWith('.')) continue; const p = path.join(d, e.name); if (e.isDirectory()) await walk(p); else if (/\.jpe?g$/i.test(e.name)) files.push(p); } }
for (const d of dirs) await walk(d);
files.sort();
const pick = files.filter((_, i) => i % step === 0);
const W = 240, H = 160, COLS = 8, PER = 48;
const index = {};
for (let s = 0; s * PER < pick.length; s++) {
  const chunk = pick.slice(s * PER, s * PER + PER);
  const tiles = await Promise.all(chunk.map(async (f, i) => {
    const n = s * PER + i; index[n] = f;
    const img = await sharp(f, { failOn: 'none' }).rotate().resize(W, H, { fit: 'cover' }).toBuffer().catch(() => null);
    const label = Buffer.from(`<svg width="${W}" height="${H}"><rect width="34" height="20" fill="black"/><text x="4" y="15" font-size="14" fill="white" font-family="Arial">${n}</text></svg>`);
    return img ? sharp(img).composite([{ input: label }]).toBuffer() : null;
  }));
  const rows = Math.ceil(chunk.length / COLS);
  await sharp({ create: { width: COLS * W, height: rows * H, channels: 3, background: '#fff' } })
    .composite(tiles.map((t, i) => t && ({ input: t, left: (i % COLS) * W, top: Math.floor(i / COLS) * H })).filter(Boolean))
    .jpeg({ quality: 70 }).toFile(`${out}-${s}.jpg`);
}
await writeFile(`${out}.json`, JSON.stringify(index, null, 1));
console.log(pick.length, 'photos on', Math.ceil(pick.length / PER), 'sheets');
