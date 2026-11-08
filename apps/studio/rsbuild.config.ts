import { defineConfig } from '@rsbuild/core';
import { pluginBabel } from '@rsbuild/plugin-babel';
import { pluginSolid } from '@rsbuild/plugin-solid';

/** Where Pixcue is served; social previews need absolute URLs. */
const SITE = 'https://pixcue.furkankarli.com';
const TITLE = 'Pixcue: motion graphics for video creators';
const DESCRIPTION =
  'Free, open-source motion graphics for video creators. Lower thirds, subscribe buttons and chapter titles for YouTube, Shorts, TikTok and Reels, made in your browser.';

export default defineConfig({
  plugins: [
    // Solid's JSX transform runs through Babel; limit it to JSX files so the
    // rest of the code keeps the fast SWC path.
    pluginBabel({ include: /\.(?:jsx|tsx)$/ }),
    pluginSolid(),
  ],
  html: {
    template: './index.html',
    title: 'Pixcue',
    favicon: './public/favicon.svg',
    meta: {
      description: DESCRIPTION,
      'theme-color': '#000000',
      // Social previews (Open Graph and X/Twitter).
      'og:type': { property: 'og:type', content: 'website' },
      'og:site_name': { property: 'og:site_name', content: 'Pixcue' },
      'og:title': { property: 'og:title', content: TITLE },
      'og:description': { property: 'og:description', content: DESCRIPTION },
      'og:url': { property: 'og:url', content: `${SITE}/` },
      'og:image': { property: 'og:image', content: `${SITE}/og.png` },
      'og:image:width': { property: 'og:image:width', content: '1200' },
      'og:image:height': { property: 'og:image:height', content: '630' },
      'og:image:alt': {
        property: 'og:image:alt',
        content: 'PIXCUE in red LED pixels: motion graphics for video creators',
      },
      'twitter:card': 'summary_large_image',
      'twitter:title': TITLE,
      'twitter:description': DESCRIPTION,
      'twitter:image': `${SITE}/og.png`,
    },
    tags: [
      { tag: 'link', attrs: { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' } },
      { tag: 'link', attrs: { rel: 'manifest', href: '/manifest.webmanifest' } },
      { tag: 'link', attrs: { rel: 'canonical', href: `${SITE}/` } },
    ],
  },
  output: {
    // Hosted on Cloudflare Workers static assets; see wrangler.jsonc.
    distPath: { root: 'dist' },
  },
});
