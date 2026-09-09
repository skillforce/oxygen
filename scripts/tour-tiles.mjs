/**
 * Cuts the imported panoramas into the tile pyramid the viewer streams.
 *
 * A 6000px equirectangular JPEG is ~8 MB; the viewer must not download that
 * before showing anything. So each panorama becomes a low level loaded up
 * front and a full-resolution level fetched tile by tile as the user looks
 * around, plus a `preview` used during the fade-in and a `thumb` for the
 * virtual tour's link previews.
 *
 *   node scripts/tour-tiles.mjs          # only what changed
 *   node scripts/tour-tiles.mjs --force  # everything
 *
 * Re-cutting is expensive and almost always unnecessary, so results are keyed
 * by source size and mtime in `public/tour/.cache.json`: re-shooting one point
 * costs one point's work.
 */
import { readdirSync, existsSync, mkdirSync, rmSync, statSync, writeFileSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import sharp from 'sharp';

const root = resolve(import.meta.dirname, '..');
const srcDir = join(root, 'panoramas');
const outDir = join(root, 'public', 'tour');
const cachePath = join(outDir, '.cache.json');
const manifestPath = join(root, 'src', 'data', 'tourManifest.json');

const FORMAT = 'webp';
const QUALITY = 82;
const PREVIEW_WIDTH = 2048;
const THUMB_WIDTH = 480;
/** Grid per level, coarsest first. Widths are resolved per panorama below. */
const LEVELS = [
  { width: 1080, cols: 4, rows: 2 },
  { width: null, cols: 8, rows: 4 }, // null = the source's own width
];

const force = process.argv.includes('--force');
const cache = !force && existsSync(cachePath) ? JSON.parse(readFileSync(cachePath, 'utf8')) : {};

const ids = readdirSync(srcDir)
  .filter((f) => /^tour_(.+)\.jpg$/.test(f))
  .map((f) => f.match(/^tour_(.+)\.jpg$/)[1])
  .sort();

if (!ids.length) throw new Error('В panoramas/ нет файлов tour_*.jpg');

const panoramas = [];

for (const id of ids) {
  const source = join(srcDir, `tour_${id}.jpg`);
  const { size, mtimeMs } = statSync(source);
  const stamp = `${size}:${Math.round(mtimeMs)}`;
  const dir = join(outDir, id);

  const meta = await sharp(source).metadata();
  const levels = LEVELS.map((level) => ({ ...level, width: level.width ?? meta.width }));
  const entry = {
    id,
    format: FORMAT,
    levels: levels.map(({ width, cols, rows }) => ({ width, cols, rows })),
    sourceWidth: meta.width,
    sourceHeight: meta.height,
  };
  panoramas.push(entry);

  if (cache[id] === stamp && existsSync(join(dir, `preview.${FORMAT}`))) {
    console.log(`${id}: без изменений`);
    continue;
  }

  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });

  await sharp(source)
    .resize(PREVIEW_WIDTH, PREVIEW_WIDTH / 2)
    .toFormat(FORMAT, { quality: QUALITY })
    .toFile(join(dir, `preview.${FORMAT}`));
  await sharp(source)
    .resize(THUMB_WIDTH, THUMB_WIDTH / 2)
    .toFormat(FORMAT, { quality: QUALITY })
    .toFile(join(dir, `thumb.${FORMAT}`));

  for (const [index, { width, cols, rows }] of levels.entries()) {
    const height = width / 2;
    // Resizing once per level and slicing the result keeps the expensive
    // Lanczos pass off the per-tile path.
    const scaled = await sharp(source).resize(width, height).toBuffer();
    const tileWidth = Math.round(width / cols);
    const tileHeight = Math.round(height / rows);
    const levelDir = join(dir, String(index));
    mkdirSync(levelDir, { recursive: true });

    for (let col = 0; col < cols; col += 1) {
      for (let row = 0; row < rows; row += 1) {
        await sharp(scaled)
          .extract({ left: col * tileWidth, top: row * tileHeight, width: tileWidth, height: tileHeight })
          .toFormat(FORMAT, { quality: QUALITY })
          .toFile(join(levelDir, `${col}_${row}.${FORMAT}`));
      }
    }
  }

  cache[id] = stamp;
  console.log(`${id}: нарезал ${meta.width}×${meta.height}`);
}

writeFileSync(cachePath, `${JSON.stringify(cache, null, 2)}\n`);
writeFileSync(manifestPath, `${JSON.stringify({ format: FORMAT, panoramas }, null, 2)}\n`);
console.log(`Готово: ${panoramas.length} панорам, манифест обновлён`);
