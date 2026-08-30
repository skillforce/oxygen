/**
 * Pre-compresses text assets in dist/ so nginx can serve them with
 * `gzip_static on` instead of re-compressing identical bytes per request.
 *
 * Brotli files are emitted too, but stock nginx has no brotli_static module —
 * see nginx/nginx.conf. They are harmless if unused.
 */
import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { gzip, brotliCompress, constants } from 'node:zlib';
import { promisify } from 'node:util';

const gzipAsync = promisify(gzip);
const brotliAsync = promisify(brotliCompress);

const COMPRESSIBLE = new Set(['.html', '.css', '.js', '.mjs', '.svg', '.json', '.webmanifest', '.xml', '.txt', '.map']);
const MIN_BYTES = 1024;

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else yield path;
  }
}

let files = 0;
let raw = 0;
let gz = 0;
let br = 0;

for await (const file of walk('dist')) {
  if (!COMPRESSIBLE.has(extname(file))) continue;
  if ((await stat(file)).size < MIN_BYTES) continue;

  const buf = await readFile(file);
  const [gzBuf, brBuf] = await Promise.all([
    gzipAsync(buf, { level: constants.Z_BEST_COMPRESSION }),
    brotliAsync(buf, { params: { [constants.BROTLI_PARAM_QUALITY]: 11, [constants.BROTLI_PARAM_SIZE_HINT]: buf.length } }),
  ]);

  await Promise.all([writeFile(`${file}.gz`, gzBuf), writeFile(`${file}.br`, brBuf)]);
  files += 1;
  raw += buf.length;
  gz += gzBuf.length;
  br += brBuf.length;
}

const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
console.log(`precompress: ${files} file(s)  raw ${kb(raw)}  gzip ${kb(gz)}  brotli ${kb(br)}`);
