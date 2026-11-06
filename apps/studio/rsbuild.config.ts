import { defineConfig } from '@rsbuild/core';
import { pluginBabel } from '@rsbuild/plugin-babel';
import { pluginSolid } from '@rsbuild/plugin-solid';

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
      description:
        'Free, open-source motion graphics for video creators. Lower thirds, subscribe buttons and chapter titles for YouTube, Shorts, TikTok and Reels.',
      'theme-color': '#0e0f13',
    },
  },
  output: {
    // Hosted on Cloudflare Workers static assets; see wrangler.jsonc.
    distPath: { root: 'dist' },
  },
});
