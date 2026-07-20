import type { TechSignature } from './tech-detector.service';

/**
 * All registered technology signatures.
 *
 * Each signature defines a `name`, a `category` (one of 'framework',
 * 'cms', 'hosting', or 'analytics'), and a `test(html, headers)` function
 * that returns true when the technology is detected in the page HTML or
 * HTTP response headers.
 */
export const SIGNATURES: TechSignature[] = [
  // ── Frameworks ────────────────────────────────────────────────────────

  // React
  //   React 16+ renders `data-reactroot` on the root element.
  //   React 15 and earlier emit `data-reactid` on every element.
  //   The devtools hook (`__REACT_DEVTOOLS_GLOBAL_HOOK__`) is set by
  //   React at runtime even in production builds.
  {
    name: 'React',
    category: 'framework',
    test: (html) =>
      /data-reactroot\s*=|data-reactid\s*=|__REACT_DEVTOOLS_GLOBAL_HOOK__/.test(html),
  },

  // Next.js
  //   Next.js injects a `<script id="__NEXT_DATA__">` block with JSON
  //   page props, a `<meta name="next-head-count">` tag to track
  //   head elements, and serves static chunks from `/_next/static/`.
  {
    name: 'Next.js',
    category: 'framework',
    test: (html) =>
      /__NEXT_DATA__|next-head-count|\/_next\/static\//.test(html),
  },

  // WordPress
  //   WordPress emits a `<meta name="generator" content="WordPress …">`
  //   tag, serves assets from `wp-content/` / `wp-includes/`, and
  //   exposes a REST API at `/wp-json/`. Server headers may also
  //   include `x-powered-by: WordPress`.
  {
    name: 'WordPress',
    category: 'framework',
    test: (html, headers) => {
      const poweredBy = headers['x-powered-by']?.toLowerCase();
      return (
        /<meta\s+name=["']generator["'][^>]*content=["']WordPress/i.test(html) ||
        /\/wp-content\//.test(html) ||
        /\/wp-includes\//.test(html) ||
        /\/wp-json\//.test(html) ||
        poweredBy === 'wordpress' ||
        (poweredBy !== undefined && poweredBy.includes('wordpress'))
      );
    },
  },

  // Vue.js
  //   Vue 2+ sets a `data-v-xxxxxxxx` attribute on component root
  //   elements. Scoped styles use the same attribute on all elements
  //   within the component. The `__VUE__` global is also set by some
  //   build-time injection strategies.
  {
    name: 'Vue',
    category: 'framework',
    test: (html) =>
      /\bdata-v-[a-f0-9]{8}\b/.test(html) ||
      /__VUE__/.test(html) ||
      /\bvue(?:\.global|\.esm|\.min)\.js\b/.test(html),
  },

  // Angular
  //   Angular (2+) sets the `ng-version` attribute on the root
  //   `<app-root>` or equivalent bootstrap element. It also exposes
  //   `__ngContext__` on component elements at runtime.
  {
    name: 'Angular',
    category: 'framework',
    test: (html) =>
      /\bng-version=/.test(html) ||
      /__ngContext__/.test(html) ||
      /\bangular(?:\.core)?\.min\.js\b/.test(html),
  },

  // jQuery
  //   Detected via `<script>` tags loading a jQuery file (jquery.js,
  //   jquery.min.js, jquery-X.Y.Z.js) or the presence of common
  //   jQuery-specific CDN URL patterns.
  {
    name: 'jQuery',
    category: 'framework',
    test: (html) =>
      /\bjquery(?:[.-]?\d[\w.]*)?\.min\.js\b/.test(html) ||
      /\bjquery(?:[.-]?\d[\w.]*)?\.js\b/.test(html) ||
      /code\.jquery\.com\//.test(html) ||
      /cdnjs\.cloudflare\.com\/.*\/jquery\b/.test(html) ||
      /googleapis\.com\/.*\/jquery\b/.test(html),
  },

  // Bootstrap
  //   Detected via CSS/JS file references (`bootstrap.min.css`,
  //   `bootstrap.bundle.min.js`), CDN URLs, or Bootstrap 5-specific
  //   `data-bs-*` attribute patterns.
  {
    name: 'Bootstrap',
    category: 'framework',
    test: (html) =>
      /\bbootstrap(?:\.min)?\.css\b/.test(html) ||
      /\bbootstrap(?:\.bundle)?\.min\.js\b/.test(html) ||
      /cdn\.jsdelivr\.net\/.*\/bootstrap\b/.test(html) ||
      /stackpath\.bootstrapcdn\.com\//.test(html) ||
      /maxcdn\.bootstrapcdn\.com\//.test(html) ||
      /\bdata-bs-(?:toggle|dismiss|slide|target|ride|popper)\s*=/.test(html),
  },

  // Tailwind CSS
  //   Detected via CDN script (`cdn.tailwindcss.com`), the `@tailwind`
  //   CSS directive in inline styles, or the `tailwindcss` class
  //   naming convention (although most Tailwind classes are generic,
  //   the `@tailwind` directive is unique).
  {
    name: 'Tailwind CSS',
    category: 'framework',
    test: (html) =>
      /cdn\.tailwindcss\.com\b/.test(html) ||
      /@tailwind\s+(?:base|components|utilities|screens)/i.test(html) ||
      /tailwindcss\b/.test(html),
  },

  // Svelte
  //   Svelte injects `__SVELTE__` on the global scope and attaches
  //   `svelte-xxxxxxxx` data attributes to component-scoped elements.
  //   The generated bundle also often contains `svelte` in script paths.
  {
    name: 'Svelte',
    category: 'framework',
    test: (html) =>
      /\b__SVELTE__\b/.test(html) ||
      /\bsvelte-[a-f0-9]{6,10}\b/.test(html) ||
      /\bsvelte\/internal\b/.test(html) ||
      /\/_svelte\//.test(html),
  },

  // Gatsby
  //   Gatsby injects `___gatsby` as a global namespace and serves
  //   its webpack runtime from chunk paths containing `gatsby`.
  {
    name: 'Gatsby',
    category: 'framework',
    test: (html) =>
      /___gatsby\b/.test(html) ||
      /\/gatsby\/page-data\//.test(html) ||
      /\/gatsby-\w+\.js\b/.test(html),
  },

  // ── CMS ───────────────────────────────────────────────────────────────

  // Shopify
  //   Shopify serves assets from `/cdn/shop/`, sets `X-Shopify-*`
  //   response headers, and exposes a `Shopify` global. The checkout
  //   domain includes `myshopify.com`.
  {
    name: 'Shopify',
    category: 'cms',
    test: (html, headers) => {
      const xShopify = headers['x-shopify-stage'] || headers['x-shopify'];
      return (
        /\/cdn\/shop\//.test(html) ||
        /\/myshopify\.com\//.test(html) ||
        /shopify\.com\/s\//.test(html) ||
        /\.shopify\.com/.test(html) ||
        /<link[^>]*href=["'][^"']*\/cdn\/shop\//.test(html) ||
        xShopify !== undefined
      );
    },
  },

  // Wix
  //   Wix pages are hosted on `*.wixsite.com` or `*.editorx.io`,
  //   load assets from `static.parastorage.com` (Wix's CDN), and
  //   may include `X-Wix-*` headers.
  {
    name: 'Wix',
    category: 'cms',
    test: (html, headers) => {
      const xWix = headers['x-wix-request-id'] || headers['x-wix-app'];
      return (
        /\.wixsite\.com\//.test(html) ||
        /\.editorx\.io\//.test(html) ||
        /\bstatic\.parastorage\.com\//.test(html) ||
        /\/_api\/v2\//.test(html) ||
        xWix !== undefined
      );
    },
  },

  // Drupal
  //   Drupal emits `<meta name="Generator" content="Drupal ...">`,
  //   serves files from `/sites/default/files/`, and generates
  //   `drupal.js` or `Drupal` JavaScript namespace references.
  {
    name: 'Drupal',
    category: 'cms',
    test: (html) =>
      /<meta\s+name=["']Generator["'][^>]*content=["']Drupal/i.test(html) ||
      /\/sites\/(?:default|all)\/(?:files|themes|modules)\//.test(html) ||
      /\/drupal\.js\b/.test(html) ||
      /\bDrupal\.behaviors\b/.test(html),
  },

  // ── Hosting / Infrastructure ──────────────────────────────────────────

  // Cloudflare
  //   Cloudflare sets the `cf-ray` header on all proxied responses,
  //   may include `__cfduid` / `__cf_bm` cookies, and adds
  //   `cloudflare` to the `via` or `server` headers.
  {
    name: 'Cloudflare',
    category: 'hosting',
    test: (html, headers) => {
      const server = headers['server']?.toLowerCase();
      return (
        headers['cf-ray'] !== undefined ||
        headers['cf-cache-status'] !== undefined ||
        /__cfduid\b/.test(html) ||
        /__cf_bm\b/.test(html) ||
        /cdn-cgi\/\w+\//.test(html) ||
        server === 'cloudflare' ||
        (server !== undefined && server.includes('cloudflare'))
      );
    },
  },

  // Vercel
  //   Vercel sets `x-vercel-id`, `x-vercel-cache`, and `x-vercel-deployment-url`
  //   headers on responses served from the Vercel Edge Network.
  {
    name: 'Vercel',
    category: 'hosting',
    test: (_html, headers) =>
      headers['x-vercel-id'] !== undefined ||
      headers['x-vercel-cache'] !== undefined ||
      headers['x-vercel-deployment-url'] !== undefined,
  },

  // Netlify
  //   Netlify sets `x-nf-request-id` and `x-nf-request-uri` headers,
  //   and serves a `_redirects` or `_headers` file at the root.
  {
    name: 'Netlify',
    category: 'hosting',
    test: (html, headers) =>
      headers['x-nf-request-id'] !== undefined ||
      headers['x-nf-request-uri'] !== undefined ||
      headers['x-nf-request-route'] !== undefined ||
      /\bnetlify\.app\b/.test(html) ||
      /\bnetlify\.com\b/.test(html) ||
      /\/netlify\/identity\//.test(html) ||
      /\/\.netlify\//.test(html),
  },

  // ── Analytics ─────────────────────────────────────────────────────────

  // Google Analytics (UA + GA4 + GTM)
  //   Matches the classic `ga.js`, `analytics.js`, and modern `gtag.js`
  //   snippets, as well as Google Tag Manager (`gtm.js`) and the
  //   newer GA4 gtag `config` / `create` calls.
  {
    name: 'Google Analytics',
    category: 'analytics',
    test: (html) =>
      /google-analytics\.com\/(?:ga|analytics|gtag)\b/.test(html) ||
      /googletagmanager\.com\/gtm\.js/.test(html) ||
      /\bgtag\(/.test(html) ||
      /\bga\(['"]create['"]/.test(html),
  },

  // Facebook Pixel
  //   Facebook Pixel loads from `connect.facebook.net` and
  //   initialises via the `fbq()` JavaScript call.
  {
    name: 'Facebook Pixel',
    category: 'analytics',
    test: (html) =>
      /\bfbq\(/.test(html) ||
      /connect\.facebook\.net\/\w+\/fbevents\.js/.test(html) ||
      /facebook\.com\/tr\//.test(html),
  },

  // Hotjar
  //   Hotjar loads from `static.hotjar.com` and/or the
  //   `hotjar` tracking script initialises with `hj()`.
  {
    name: 'Hotjar',
    category: 'analytics',
    test: (html) =>
      /static\.hotjar\.com\/(?:c\/hotjar-|js\/hotjar)/.test(html) ||
      /\bhj\(\s*['"]\w+['"]\s*,\s*\{/.test(html),
  },
];
