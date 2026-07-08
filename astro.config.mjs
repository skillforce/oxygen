import { defineConfig } from 'astro/config';

const publicSiteUrl = process.env.PUBLIC_SITE_URL ?? 'https://oxygen.vpname.cc';
const site = publicSiteUrl.startsWith('http') ? publicSiteUrl : `https://${publicSiteUrl}`;

export default defineConfig({
  site,
});
