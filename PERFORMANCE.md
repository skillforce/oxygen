# Oxygen Fitness — Performance & Dead-Code Audit

**Audited:** 2026-08-30 · **Stack:** Astro 4.16 (static, zero framework JS) · nginx-unprivileged:stable-alpine
**Scope:** single page (`src/pages/index.astro`), 12 components, 1 data module, 24 source images, 1 video.

---

## 0. Baseline (measured, not estimated)

| Metric | Value | How measured |
|---|---|---|
| `dist/` total | **2.6 MB** | `du -sh dist` |
| `dist/index.html` | 43.7 KB raw / **7.2 KB gzip** | `gzip -9 -c` |
| `dist/_astro/index.*.css` | 33.2 KB raw / **6.3 KB gzip** | `gzip -9 -c` |
| Hero video | **596 KB** (mp4, autoplay) | `ls -la` |
| Generated AVIFs | 54 files / **1.5 MB** | `du -ch dist/_astro/*.avif` |
| Font files emitted | 13 woff2 / **212 KB** | `du -ch dist/_astro/*.woff2` |
| `<img>` tags in HTML | **43** (38 gallery + 5 cards) | `grep -c '<img'` |
| Cold build (no image cache) | **23.2 s wall / 51.9 s CPU** | `rm -rf node_modules/.astro && time astro build` |
| Warm build (cached images) | **1.7 s** | `time astro build` |
| Source images on disk | **21 MB** (largest 2.0 MB) | `du -sh src/assets/images` |

The HTML/CSS payload is already small. **All meaningful runtime cost is media, fonts, and paint work** — that is where this plan concentrates.

---

## 1. Runtime wins, ranked by impact

### P0-1 — 212 KB of program-card background images are downloaded and never seen

`src/components/ProgramsSection.astro:8,29,30,93-108`

Each of the 5 cards does **two** things with the same photo:

1. `getImage({ width: 1080 })` → injected as `--img` and painted via `background-image` (line 95).
2. `<Image widths={[640,1080,1600]}>` → an absolutely positioned `.parallax-img` at `z-index:-1`, `opacity:.88`, covering the whole card (line 102).

The card has `isolation:isolate`, so the `z-index:-1` `<img>` paints **above** the card background. The background is therefore ~88% occluded by the `<img>` and contributes almost nothing visually — but the browser still fetches it.

Measured waste (the five `--img` URLs in `dist/index.html`):

```
gym-racks…1z9dKY.avif          46,447
cardio-treadmills…1HSMGB.avif  46,773
boxing-bags…Z1qA2eq.avif       34,127
functional-red…ZP0g.avif       58,156
lounge-sofa…1liDrm.avif        32,018
                              --------
                              217,521 B ≈ 212 KB
```

Worse: the CSS `background-image` shorthand on line 93-95 **also** declares the darkening gradient, and `.card.image::before` (line 107) declares the *identical* gradient again — two stacked copies of the same overlay.

**Fix:** delete the `getImage` call, the `background` import in the map, the `--img` inline style, and the `var(--img)` layer. Keep the `<img>` (it is responsive; the background was not) and keep `::before` as the single gradient. Set `background-color:#191a1c` as the placeholder.
**Saves:** ~212 KB transfer, 5 requests, 5 fewer sharp encodes at build.

---

### P0-2 — The LCP image is a fixed 1920 px AVIF with no responsive variants

`src/components/HeroSection.astro:8,12`

```js
const heroPoster = await getImage({ src: machinesBrick, width: 1920, format: 'avif' });
```

That single 1920 px file is **124,883 B**, and it is served identically to a 390 px phone. It is also the most likely **LCP element** (a CSS `background-image` on `.hero-media` is an eligible LCP candidate), and because it is referenced from a CSS custom property it is **not discoverable by the preload scanner** — the browser cannot start fetching it until the stylesheet has been downloaded and parsed.

**Fix (three parts):**

1. Generate 3 widths (`768 / 1280 / 1920`) with `getImage` and select via `image-set()` on `.hero-media`, or restructure the hero to use a real `<img fetchpriority="high" decoding="async">` behind the panel. A real `<img>` is preferable — it gets full `srcset`/`sizes` negotiation *and* preload-scanner discovery for free.
2. Add `<link rel="preload" as="image" fetchpriority="high" imagesrcset=… >` in `BaseLayout`'s `head` slot for whichever variant wins.
3. Drop either the CSS `--hero-poster` background **or** the `poster=` attribute — they are the same URL, so it is one fetch today, but keeping both means two places to keep in sync.

**Saves:** ~100 KB on mobile; moves LCP discovery earlier by roughly one round-trip.

---

### P0-3 — 596 KB autoplaying video ships to every device, including phones on cellular

`src/components/HeroSection.astro:13-15`

```html
<video autoplay muted loop playsinline preload="metadata" …>
```

`preload="metadata"` is overridden in practice by `autoplay`: the browser must buffer enough to start playback, so the file downloads on load and competes for bandwidth with the LCP image and the fonts. It also ignores `prefers-reduced-motion` — the global reduced-motion block at `BaseLayout.astro:165-168` neutralises CSS animations but does nothing to a `<video>`.

**Fix:**

- Gate playback behind `window.matchMedia('(min-width: 721px)')` **and** `(prefers-reduced-motion: no-preference)`; on everything else show the poster only and never attach the `<source>`. Build the `<source>` element in JS (or use `<video preload="none">` + `.load()`), so no bytes move when the gate fails.
- Add an AV1/WebM alternate `<source>` before the mp4 — the same grade typically encodes 40-55% smaller.
- Cap the encode at 1280×720 and ~1.2 Mbps; it is a background plate behind a 99%-opaque gradient (`.hero::before`, line 61-70) and does not need more.

**Saves:** 596 KB on mobile and reduced-motion users; ~250-300 KB on desktop from AV1.

---

### P0-4 — Render-blocking external stylesheet for a single-page site

`dist/index.html` ends its `<head>` with `<link rel="stylesheet" href="/_astro/index.*.css">` — 6.3 KB gzip in a **separate request** that blocks first paint.

**Fix** in `astro.config.mjs`:

```js
export default defineConfig({
  site,
  build: { inlineStylesheets: 'always' },
});
```

At 6.3 KB gzip on a one-page site with no repeat-navigation benefit to preserve, inlining is unambiguously the right trade.
**Saves:** one render-blocking round-trip (~50-200 ms on mobile networks).

---

### P1-5 — Fonts are never preloaded; the LCP headline waits on the network

Thirteen `@font-face` blocks, no `<link rel="preload">` anywhere. The hero H1 uses `Archivo Black` (18.6 KB) and the kicker/subtitle use `JetBrains Mono` cyrillic 500 (5.4 KB); both are discovered only after CSS parses. `font-display:swap` is correctly set, so text paints in fallback first — but that guarantees a **layout shift** when the real faces arrive, because `Archivo Black` and the Times-ish fallback (see P1-9) have wildly different metrics.

**Fix:**

1. Preload exactly the three faces the above-the-fold content needs: `archivo-black-latin-400`, `jetbrains-mono-cyrillic-500`, `open-sans-cyrillic-400`.
2. Add `size-adjust` / `ascent-override` / `descent-override` to a `@font-face` fallback definition so swap is metric-neutral, or accept the shift and at least make it small.

**Saves:** measurable CLS reduction and earlier text paint.

---

### P1-6 — `backdrop-filter` on a `position:fixed` header repaints a blur on every scroll frame

`src/components/SiteHeader.astro:35-36` (`blur(14px) saturate(1.1)` on `.nav.scrolled`, which is `position:fixed` at line 21)

A full-width fixed backdrop blur forces the compositor to re-sample and re-blur the content beneath it on **every** scroll frame. This is the single most common source of scroll jank on mid-range Android. Two more `backdrop-filter` layers exist at `HeroSection.astro:189` and `PrimaryCta.astro:19` — those are on small, static pills and are cheap by comparison.

Mitigating factor already present: at `≤820px` the nav becomes `position:absolute` (line 79), so phones escape the worst of it. Tablets and laptops do not.

**Fix:** reduce to `blur(8px)`, drop the `saturate()`, and add `will-change:backdrop-filter` **or** — preferred — replace with a solid `rgba(26,27,29,.92)` background. At 78% opacity over a near-black page the blur is barely perceptible.

---

### P1-7 — Per-frame GPU filters on video and on 19 gallery images

- `HeroSection.astro:100` — `filter:contrast(1.09) saturate(.72) brightness(.72)` on a **playing video**. This runs the filter pipeline on every decoded frame, forever, for the life of the page.
- `GallerySection.astro:141` — `filter:saturate(1.02)` on every gallery `<img>`. A 2% saturation bump is visually indistinguishable but forces each image onto a filtered paint path.

**Fix:** bake both grades into the assets. Re-encode the video with the contrast/saturation/brightness applied (`ffmpeg -vf eq=contrast=1.09:saturation=0.72:brightness=-0.28`) and delete the CSS filter. Delete `saturate(1.02)` outright.
**Saves:** continuous GPU work on the hero; one paint pass per gallery image.

---

### P1-8 — Unthrottled `pointermove` mutating a custom property that drives a blended radial gradient

`src/components/HomeScripts.astro:29-38`

```js
heroEl.addEventListener('pointermove', (event) => {
  const rect = heroEl.getBoundingClientRect();   // forced layout, every event
  …
  heroEl.style.setProperty('--mx', `${x}%`);      // invalidates .hero-spot
});
```

Three problems compounding:

1. `getBoundingClientRect()` inside the handler forces a **synchronous layout** on every pointer event (~120/s on a high-refresh trackpad).
2. `--mx`/`--my` feed `.hero-spot`, which is a viewport-sized `radial-gradient` with **`mix-blend-mode:screen`** (`HeroSection.astro:245-252`). Every update repaints and re-blends a full-screen layer.
3. The listener is attached on touch devices too, where it can never produce a meaningful result.

**Fix:** hoist `getBoundingClientRect()` out of the handler (recompute on `resize`/`scroll`), coalesce updates into a single `requestAnimationFrame`, add `{ passive: true }`, and attach only when `matchMedia('(hover: hover) and (pointer: fine)')` matches.

---

### P1-9 — Correctness *and* performance bug: `Archivo Black` has no Cyrillic and 11 rules have no fallback

`BaseLayout.astro:78-81` declares only `archivo-black-latin-400-normal.woff2`. Eleven rules then request `font-family:'Archivo Black'` with **no fallback stack at all**:

| File | Selector | Renders Cyrillic |
|---|---|---|
| `GallerySection.astro:113` | `.gallery-head h2` | «Наш зал.» |
| `ProgramsSection.astro:83` | `.card h3` | «Железо. Без очередей.» |
| `JoinSection.astro:109` | `.plan .name` | «Месяц», «3 месяца» |
| `PrimaryCta.astro:19` | `.hero-cta` | «Записаться» |
| `Ticker.astro`, `SiteFooter.astro`, `Brand.astro` | — | Latin only, fine |

Because the requested family cannot supply the glyphs, those strings fall through to the **browser default font** (typically Times) — not to Open Sans. Additionally `BaseLayout.astro:208` sets `font-weight:900` on `.display` while Archivo Black ships only weight 400, so the browser applies **synthetic bold** on top.

**Fix:** define one token and use it everywhere —
`--font-display: 'Archivo Black', 'Open Sans', system-ui, sans-serif;` — and change `font-weight:900` → `400`.
**Effect:** correct rendering, no synthetic-bold rasterisation, no extra fallback-font lookup.

---

### P2-10 — The gallery renders all 19 images twice into the DOM

`src/components/GallerySection.astro:76-99`

The desktop `.masonry` and the mobile `.mobile-masonry` emit **separate, complete** copies of every tile — 38 `<figure>` + 38 `<img>` with full `srcset`, of which exactly half are `display:none` at any viewport.

**Measured payoff — smaller than it looks.** Stripping the `.mobile-masonry` block out of the built HTML:

```
raw    43,674 -> 34,055 B   (-9,619 B)
gzip    7,205 ->  6,953 B   (-252 B)
```

The two copies are near-identical text, so gzip already erases almost all of it. **The real saving is 19 fewer `<figure>`/`<img>` node pairs** for the parser, style engine, and IntersectionObserver to walk — not transfer. Treat this as a DOM/recalc cleanup, not a bandwidth win.

**Do not just switch to `column-count:2`.** The masonry *look* survives — it is the same `break-inside:avoid` + `aspect-ratio` mechanism the desktop already uses at 5/4/3 columns — but the *balance* does not. CSS multi-column splits content **contiguously** in document order; `splitIntoBalancedColumns` picks an arbitrary subset. With the current shape cycle (`index % 7` over 19 tiles) the best contiguous split is items 1-10 / 11-19:

| | column heights (column-widths) | ragged bottom |
|---|---|---|
| naive `column-count:2` | 12.33 vs 10.90 | **1.43** ≈ **412 px** at a 640 px viewport |
| current exhaustive split | 11.61 vs 11.62 | 0.01 ≈ 3 px |

A 412 px empty gap under one column is very visible.

**Fix that keeps both:** render one list, but emit the tiles in **column-major order** — compute the balanced 2-way partition at build time and output `[...columnA, ...columnB]`. Multi-column's contiguous split then lands exactly on the balanced boundary, so you get one DOM copy *and* the balance.

This also improves the desktop breakpoints, because source order was never tuned for them either (ragged bottom, in column-widths):

| columns | source order | column-major reorder |
|---|---|---|
| 2 | 1.43 | **0.01** |
| 3 | 1.57 | **1.18** |
| 4 | 1.43 | **1.19** |
| 5 | 1.15 | **1.11** |

Strictly better at every breakpoint. Cost: the photos appear in a different position on desktop than they do today — cosmetic only, alt text and content unaffected.

**Caveat to verify in a real browser:** multi-column balancing is approximate and browser-specific. Chrome binary-searches a target height then greedy-fills, which lands on the intended boundary here — but confirm in Safari and Firefox at 2/3/4/5 columns before shipping. If it proves flaky, keeping the current two-block markup is a perfectly defensible 252-byte trade.

---

### P2-11 — `overflow-x:hidden` on both `html` and `body`

`BaseLayout.astro:157-163` plus `main{overflow-x:clip}` at line 185. Setting `overflow-x` on `html` promotes the root to a scroll container, disables `position:sticky` descendants, and can defeat scroll anchoring. The `main{overflow-x:clip}` rule already contains the real overflow source.

**Fix:** remove `overflow-x:hidden` from `html,body`; keep `overflow-x:clip` on `main`. Verify no horizontal scrollbar returns at 320 px.

---

### P2-12 — `will-change` left on elements that never animate

- `HeroSection.astro:98` — `will-change:transform` on `.hero-video`, whose only transition is `opacity`. Wrong property; promotes a layer for nothing.
- `Ticker.astro:29` — `will-change:transform` on `.ticker-track`. Legitimate (infinite marquee), but it pins a compositor layer for the whole session even when the ticker is off-screen.

**Fix:** change the hero to `will-change:opacity` (or drop it — `opacity` transitions are already composited). For the ticker, pause the animation when off-screen via the existing IntersectionObserver, or accept it.

---

## 2. Dead code

Everything below is verified unreferenced (grep across `src/`).

### Dead JavaScript — `src/components/HomeScripts.astro`

| Lines | Code | Verdict |
|---|---|---|
| 2-3 | `document.getElementById('nav')?.classList.add('scrolled')` | Runs **unconditionally on load**. There is no scroll listener anywhere. So `.nav` in its un-scrolled state never renders, and `transition:background .35s, backdrop-filter .35s, border-color .35s` (`SiteHeader.astro:30`) can never fire. **Delete the JS, put `class="nav scrolled"` in the markup, delete the transition.** |
| 40-42 | `querySelectorAll('[data-parallax]').forEach(el => el.style.transform = 'scale(1.06)')` | Sets a static value that could be a CSS rule. Costs a scripted style write + full restyle after paint, and is the *only* reason the `data-parallax` attribute exists. **Move to `.card.image .parallax-img{transform:scale(1.06)}`, delete the JS and the attribute** (`ProgramsSection.astro:30`). |

After both removals, `HomeScripts.astro` is 48 → ~26 lines and holds only the video-reveal and IntersectionObserver logic, which are both load-bearing.

### Dead CSS

| Location | Rule | Why dead |
|---|---|---|
| `BaseLayout.astro:91-100` | `@font-face` Open Sans **500**, latin + cyrillic | Every `font-weight:500` in the codebase (12 occurrences) sits inside a `JetBrains Mono` context. No element resolves to Open Sans 500. |
| `BaseLayout.astro:111-120` | `@font-face` Open Sans **700**, latin + cyrillic | No rule sets `font-weight:700` on an Open Sans element. The only `<b>` elements are explicitly overridden (`.accred b`→500, `.meta b`→600, `.brand-name b`→`inherit`). No `<strong>` exists. |
| `SiteHeader.astro:30` | `.nav{transition:background…backdrop-filter…}` | Unreachable — see the `scrolled` note above. |
| `ProgramsSection.astro:93-95` | the `var(--img)` background layer | See P0-1. |
| `ProgramsSection.astro:107-110` | `.card.image::before` gradient | Byte-identical duplicate of the gradient already in the `background-image` shorthand on line 93. One of the two must go. |
| `GallerySection.astro:141` | `filter:saturate(1.02)` | 2% — below perceptual threshold; pure cost. |
| `HeroSection.astro:166` | `.hero-action` (shared base class) | Only ever applied together with `.hero-action-primary` on one element. Not dead, but the two-class split buys nothing — merge them. |

Those four `@font-face` blocks correspond to **4 files / 59 KB** shipped in `dist/`. Note honestly: browsers do not download unused faces, so **removing them saves no runtime bytes** — the win is a smaller `dist/`, less CSS to parse, and no misleading "we support 700" signal.

### Dead data — `src/data/home.ts`

| Export / key | Status |
|---|---|
| `site.brand` (`'OXYGEN FITNESS'`) | **0 references.** `Brand.astro` hard-codes the string. |
| `site.addressLine` | **0 references.** `GallerySection.astro:71` hard-codes «г. Могилёв, ул. Чигринова 2А». |
| `hours` export | Used by `HeroSection.astro`. But `SiteFooter.astro:25` hard-codes the *same* opening hours as literal text — a duplicated source of truth that will drift. |

**Fix:** delete `site.brand` and `site.addressLine`, or (better) make `Brand`, `GallerySection`, and `SiteFooter` consume them so there is one source of truth.

### Dead markup / attributes

| Location | Item |
|---|---|
| `GallerySection.astro:65` | `data-screen-label="Зоны клуба"` — never read by CSS or JS |
| `HeroSection.astro:40` | `id="hours"` on the `<table>` — never targeted |
| `nginx/nginx.conf:52-56` | `location /images/ { … }` — no `/images/` path exists in `dist/`; every asset lives under `/_astro/` |

---

## 3. Build-time cost

### B-1 — 21 MB of oversized source images cause a 23 s cold build

`src/assets/images/` holds originals up to **2,036,284 B** (`matrix-station.avif`). The largest consumed size anywhere in the site is 1600 px (`ProgramsSection` `cardWidths`); the gallery caps at **800 px**. Sharp is decoding multi-megapixel AVIFs — the most expensive decode format there is — to produce 400-800 px thumbnails.

Cold build: **23.2 s wall / 51.9 s CPU**. In Docker this is partly hidden by the `--mount=type=cache,target=/app/node_modules/.astro` in the `Dockerfile`, but that cache is invalidated by any image change and is not present in a clean CI runner.

**Fix:** downscale the committed sources to the maximum consumed dimension (2000 px long edge is a safe headroom) and re-commit. Expected: 21 MB → ~4 MB repo, and cold build well under 10 s.

### B-2 — `splitIntoBalancedColumns` is O(2ⁿ · n)

`src/components/GallerySection.astro:26-60`

```js
for (let mask = 0; mask < 1 << tiles.length; mask += 1) { … tiles.forEach(…) }
```

With 19 tiles that is 2¹⁹ × 19 ≈ **10 million** iterations at build time to decide a two-column split for one breakpoint. It is tolerable today, but it **doubles with every image added**: 25 images → 2²⁵ × 25 ≈ 840 million iterations, and `1 << 31` overflows into negative at 31 images, silently producing garbage.

**Fix:** keep the balanced partition (P2-10 shows it is worth ~400 px of layout quality), but replace the exhaustive search with a greedy longest-processing-time bin-pack — visually indistinguishable at this scale, O(n log n), and no overflow cliff. The result then feeds the column-major emit order in P2-10, so the function survives but stops being a landmine.

---

## 4. Delivery layer — `nginx/nginx.conf`

| # | Issue | Fix |
|---|---|---|
| N-1 | **No precompression.** `gzip on; gzip_comp_level 6;` recompresses the same static HTML/CSS on every single request. | Emit `.gz` (and `.br`) at build time; enable `gzip_static on;`. `ngx_http_gzip_static_module` is compiled into the official nginx images. Zero per-request CPU, and you can afford `-9` / brotli-11 offline. |
| N-2 | `gzip_types` (line 29-39) omits `application/manifest+json`. | Add it, plus `application/wasm` if ever relevant. Do **not** add `woff2`/`avif` — already compressed. |
| N-3 | `listen 8080;` with no `http2`. | If TLS terminates upstream, confirm the proxy speaks HTTP/2 to clients. 43 image requests over HTTP/1.1 means 6-connection head-of-line blocking. |
| N-4 | No `Link: rel=preload` headers. | Once P0-2/P1-5 land, `add_header Link "</_astro/hero…avif>; rel=preload; as=image; fetchpriority=high" always;` on `location = /` starts the LCP fetch before the HTML body is even parsed. |
| N-5 | Dead `location /images/` block (line 52-56). | Delete. |
| N-6 | No `open_file_cache`. | `open_file_cache max=1000 inactive=20s; open_file_cache_valid 30s;` — cheap win for a static site with ~70 files. |
| N-7 | `tcp_nodelay` not set (defaults on, but pair it explicitly with `tcp_nopush`). | Add `tcp_nodelay on;` beside line 14. |
| N-8 | HTML `max-age=300` (line 71) with no revalidation directive. | `max-age=300, stale-while-revalidate=86400` — instant repeat loads, background freshness. |

---

## 5. Execution plan  
*(All items marked `[x]` were implemented and verified; see §6.)*

### Phase 1 — pure deletions, no visual change (~1 h, zero risk)

- [x] Delete `--img` background + `getImage` from `ProgramsSection.astro`; keep `::before` as the single gradient. **(−212 KB)**
- [x] Delete the 4 dead Open Sans `@font-face` blocks (`BaseLayout.astro:91-100, 111-120`). **(−59 KB in `dist/`)**
- [x] Delete `saturate(1.02)` (`GallerySection.astro:141`).
- [x] Replace the `scrolled` JS with a static class; delete `.nav`'s dead transition.
- [x] Move `data-parallax`'s `scale(1.06)` into CSS; delete the JS block and the attribute.
- [x] Delete `site.brand`, `site.addressLine`, `data-screen-label`, `id="hours"`, `location /images/`.
- [x] Fix `will-change:transform` → `opacity` on `.hero-video`.
- [x] **Verify:** `astro build`, then diff `dist/index.html` and confirm the 5 `--img` URLs are gone and byte counts moved as predicted.

### Phase 2 — correctness + delivery (~2 h, low risk)

- [x] Introduce `--font-display` with a real fallback stack; apply to all 11 bare `Archivo Black` rules; `font-weight:900` → `400`.
- [x] `build.inlineStylesheets: 'always'` in `astro.config.mjs`.
- [x] Preload the three above-the-fold font faces.
- [x] nginx: `gzip_static on` + build-time `.gz`/`.br`; add `application/manifest+json`; `open_file_cache`; `stale-while-revalidate`; delete dead location.
- [x] **Verified:** Cyrillic heading now measures 414 px (Open Sans) not 350 px (serif); Latin measures 391.00 px — byte-identical to Archivo Black, so the display face is unchanged; computed weight is 400, so synthetic bold is gone. Font preload URLs confirmed to match the URLs the CSS requests (no double download).
- [ ] **Not done:** serving `Content-Encoding: gzip` from the `.gz` files was not exercised — that needs the nginx image, and testing used `astro preview`.

### Phase 3 — media, the real payload (~3 h, medium risk — needs visual QA)

- [x] Hero poster → responsive `<img fetchpriority="high">` with 768/1280/1920 variants + preload. **(−100 KB mobile, earlier LCP)**
- [x] Gate the video on viewport + `prefers-reduced-motion`; add AV1/WebM source; re-encode at 1280×720 with the colour grade baked in; delete the CSS `filter`. **(−596 KB mobile)**
- [x] Downscale committed source images to 2000 px long edge. **(21 MB → ~4 MB, cold build 23 s → <10 s)**
- [x] **Verified:** cold build 23.2 s → 15.0 s; before/after network measured in Chrome against the original commit built from a git worktree; hero and all 5 cards visually checked at 1440 px and 500 px.
- [ ] **Not done:** Lighthouse run (network transfer was measured directly instead; no lab LCP/CLS scores were collected).

### Phase 4 — DOM & paint polish (~2 h)

- [ ] ~~Collapse the gallery to one list emitted in column-major order~~ **DEFERRED by request** — the two-block markup stays; only the balance logic was replaced.
- [x] Replace the exhaustive partition with greedy LPT + steepest-descent refinement: delta **0.03** column-widths vs 0.01 for the old exhaustive search (~9 px at a 640 px viewport — visually identical), converges in 2 passes, and holds that quality at 120 tiles with no `1 << n` cliff.
- [x] rAF-throttle + `passive` + `(hover:hover)`-gate the `pointermove` handler; hoist the `getBoundingClientRect()`.
- [x] Soften or replace the fixed-header `backdrop-filter`.
- [x] Remove `overflow-x:hidden` from `html,body`. Retested at 500 px (`scrollWidth` 485 ≤ `innerWidth` 500, no overflow). **Not retested at 320 px.**
- [ ] **Not done:** no CPU-throttled scroll trace was captured, so the paint/jank improvements (backdrop-filter, GPU filters, rAF throttling) are reasoned rather than measured.

---

## 6. Results (measured, after implementation)

Everything in §5 was implemented except the P2-10 markup collapse, which was
deliberately skipped (the gallery still renders two blocks); its balance-logic
half — replacing the O(2ⁿ) search — was done.

Measured with Chrome, cache disabled, against the original commit built and
served side by side from a git worktree. Totals include the HTML document.

### Mobile (500 px viewport)

| | Before | After | Δ |
|---|---|---|---|
| Video | 596,357 | **0** | −596,357 |
| Images | 344,204 (6 req) | 194,286 (4 req) | −149,918 |
| Fonts | 145,632 (10) | 134,456 (9) | −11,176 |
| CSS | 6,660 (separate req) | 0 (inlined) | −6,660 |
| Document | 7,584 | 14,369 | +6,785 |
| **Total** | **1,109,351 B** | **352,025 B** | **−68.3%** |

### Desktop (1440 px viewport)

| | Before | After | Δ |
|---|---|---|---|
| Video | 596,357 | 240,962 (AV1) | −355,395 |
| Images | 747,744 (11 req) | 521,495 (6 req) | −226,249 |
| Fonts | 145,632 (10) | 134,456 (9) | −11,176 |
| CSS | 6,660 | 0 (inlined) | −6,660 |
| Document | 7,584 | 14,369 | +6,785 |
| **Total** | **1,512,891 B** | **920,196 B** | **−39.2%** |

### Build & repo

| | Before | After |
|---|---|---|
| Cold build | 23.2 s | **15.0 s** |
| Source images | 20.7 MB | **6.4 MB** |
| woff2 emitted | 13 | 9 |
| `dist/` | 2.6 MB | 3.2 MB (now ships **two** video codecs) |

### Corrections to the projections in the earlier revision of this document

Three numbers in the pre-implementation draft were wrong and are corrected here:

1. **Projected mobile "~800 KB → ~90 KB (−89%)".** Actual: 1,083 KB → 344 KB
   (−68%). The baseline was larger than stated, and the post-fix figure was far
   too optimistic — it ignored fonts (134 KB) and the hero poster (123 KB).
2. **Projected desktop "−50%".** Actual −39%: desktop still fetches the video
   and all five card photos, so it benefits much less than mobile.
3. **`dist/` was projected to shrink to ~1.6 MB.** It *grew* to 3.2 MB, because
   shipping AV1 *and* H.264 means two copies of the video. Transfer per visitor
   is what fell; bytes at rest went up. That is the right trade, but the earlier
   claim was simply wrong.

The one prediction that held exactly: the five duplicate card backgrounds. The
baseline network log shows each card photo fetched twice (e.g. `functional-red`
at 108,985 B *and* 58,456 B); the five redundant fetches summed to **219,021 B**
against the 217,521 B predicted from static analysis.

### Biggest remaining opportunity

**Fonts are now the largest fixed cost on mobile: 134 KB across 9 files**, and
this work barely moved them (deleting the 4 dead faces saved no runtime bytes,
exactly as §2 predicted). Subsetting the Cyrillic and Latin faces to the glyphs
this one page actually uses is the obvious next step and should cut that figure
substantially. Not attempted here.

## 7. What is already right

Worth recording so it does not get "optimised" away: zero framework JavaScript (all 4 remaining script lines are inline and necessary); AVIF everywhere with proper `srcset`/`sizes`; `loading="lazy"` on every below-fold image; `font-display:swap` on all faces; `contain:layout paint style` on gallery figures (`GallerySection.astro:135`); a genuine `prefers-reduced-motion` block; correct immutable caching for `/_astro/`; a multi-stage Docker build on an unprivileged nginx base.
