/**
 * Renames Insta360 Studio exports into the tour's own numbering.
 *
 * Studio names every export after the camera's shutter counter
 * (`IMG_20260906_191230_00_merged.jpg`), which says nothing about where the
 * point sits in the club. This script maps those files onto `P01…Pnn` and
 * copies them to `panoramas/tour_<id>.jpg`, which is what the tiler reads.
 *
 *   node scripts/tour-import.mjs --scan exported   # build the mapping
 *   node scripts/tour-import.mjs                   # copy per the mapping
 *
 * The mapping lives in `scripts/tour-sources.json` so that a re-shoot of one
 * point is a one-line edit rather than a re-run that renumbers everything.
 * Scanning orders points by capture time; edit the file if the walking order
 * of the tour differs from the order they were shot in.
 */
import { readdirSync, statSync, existsSync, mkdirSync, copyFileSync, writeFileSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const mappingPath = join(root, 'scripts', 'tour-sources.json');
const outDir = join(root, 'panoramas');

/** Studio writes one folder per merge, holding a single `*_merged.jpg`. */
const findExports = (dir) => {
  const base = resolve(root, dir);
  if (!existsSync(base)) throw new Error(`Нет папки с экспортом: ${base}`);
  const found = [];
  for (const entry of readdirSync(base).sort()) {
    const full = join(base, entry);
    if (!statSync(full).isDirectory()) continue;
    const jpg = readdirSync(full).find((f) => f.endsWith('.jpg'));
    if (jpg) found.push(join(full, jpg));
  }
  return found;
};

const scanIndex = process.argv.indexOf('--scan');

if (scanIndex !== -1) {
  const dir = process.argv[scanIndex + 1] ?? 'panoramas-export';
  const files = findExports(dir);
  if (!files.length) throw new Error(`В ${dir} нет экспортированных панорам`);
  // The filename carries `YYYYMMDD_HHMMSS`, so a plain sort is capture order.
  const sources = Object.fromEntries(
    files.map((file, i) => [`P${String(i + 1).padStart(2, '0')}`, file.slice(root.length + 1)]),
  );
  writeFileSync(mappingPath, `${JSON.stringify(sources, null, 2)}\n`);
  console.log(`Записал ${files.length} точек в scripts/tour-sources.json`);
  process.exit(0);
}

if (!existsSync(mappingPath)) {
  throw new Error('Нет scripts/tour-sources.json — сначала запустите с --scan <папка>');
}

const sources = JSON.parse(readFileSync(mappingPath, 'utf8'));
mkdirSync(outDir, { recursive: true });

for (const [id, relative] of Object.entries(sources)) {
  const from = join(root, relative);
  if (!existsSync(from)) throw new Error(`${id}: исходник не найден — ${relative}`);
  copyFileSync(from, join(outDir, `tour_${id}.jpg`));
}

console.log(`Импортировал ${Object.keys(sources).length} панорам в panoramas/`);
