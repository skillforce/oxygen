import { defineConfig } from 'astro/config';

const publicSiteUrl = process.env.PUBLIC_SITE_URL ?? 'https://oxygen.vpname.cc';
const site = publicSiteUrl.startsWith('http') ? publicSiteUrl : `https://${publicSiteUrl}`;

export default defineConfig({
  site,
  vite: {
    optimizeDeps: {
      // The viewer and its plugins are only reached through dynamic imports, so
      // Vite discovers them one page at a time and re-optimises as it goes —
      // which invalidates the previous bundle and leaves open tabs fetching a
      // stale hash (504 Outdated Optimize Dep). Naming them up front pins the
      // hash for the whole session.
      include: [
        '@photo-sphere-viewer/core',
        '@photo-sphere-viewer/equirectangular-tiles-adapter',
        '@photo-sphere-viewer/virtual-tour-plugin',
        '@photo-sphere-viewer/map-plugin',
      ],
    },
  },
  build: {
    // Single-page site: the stylesheet is a few KB gzipped and there is no
    // repeat-navigation cache benefit to preserve, so inlining it removes a
    // render-blocking round trip.
    inlineStylesheets: 'always',
  },
});
