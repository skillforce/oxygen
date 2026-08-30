import { defineConfig } from 'astro/config';

const publicSiteUrl = process.env.PUBLIC_SITE_URL ?? 'https://oxygen.vpname.cc';
const site = publicSiteUrl.startsWith('http') ? publicSiteUrl : `https://${publicSiteUrl}`;

export default defineConfig({
  site,
  build: {
    // Single-page site: the stylesheet is a few KB gzipped and there is no
    // repeat-navigation cache benefit to preserve, so inlining it removes a
    // render-blocking round trip.
    inlineStylesheets: 'always',
  },
});
