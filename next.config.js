/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");
require("dotenv").config({ quiet: true });

// ✅ Bundle Analyzer - Only load when ANALYZE env variable is set
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});


// ✅ Using @ducanh2912/next-pwa for Next.js 16 compatibility
// ✅ Optimized PWA configuration for better caching and performance
const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",                 // مجلد ملفات الخدمة
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  disable: process.env.NODE_ENV === "development", // عدم التفعيل أثناء التطوير
  // ✅ Advanced PWA features
  skipWaiting: true, // Activate new service worker immediately
  register: true, // Register service worker
  // ✅ Custom service worker (optional - for advanced features)
  // sw: "sw-custom.js", // Uncomment if using custom SW
  workboxOptions: {
    disableDevLogs: true,
    // ✅ Advanced cache strategies for optimal performance
    runtimeCaching: [
      // ✅ Google Fonts - Cache first with long TTL
      {
        urlPattern: /^https:\/\/fonts\.(?:gstatic|googleapis)\.com\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "google-fonts",
          expiration: {
            maxEntries: 10,
            maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      // ✅ Images - Cache first with stale-while-revalidate
      {
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif|ico)$/i,
        handler: "CacheFirst",
        options: {
          cacheName: "images",
          expiration: {
            maxEntries: 200, // Increased from 100
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      // ✅ Static Assets - Aggressive caching
      {
        urlPattern: /\/_next\/static\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "next-static",
          expiration: {
            maxEntries: 100, // Increased from 64
            maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      // ✅ API Calls - Network first with fallback for better UX
      {
        urlPattern: /\/api\/.*/i,
        handler: "NetworkFirst",
        options: {
          cacheName: "api-cache",
          expiration: {
            maxEntries: 100, // Increased from 50
            maxAgeSeconds: 5 * 60, // 5 minutes
          },
          networkTimeoutSeconds: 3, // Timeout for faster fallback to cache
          cacheableResponse: {
            statuses: [0, 200],
          },
          // ✅ Background sync for failed requests
          backgroundSync: {
            name: "api-queue",
            options: {
              maxRetentionTime: 24 * 60, // 24 hours
            },
          },
        },
      },
      // ✅ HTML Pages - Stale-while-revalidate for faster navigation
      {
        urlPattern: ({ request }) => request.destination === "document",
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "html-cache",
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 60 * 60, // 1 hour
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      // ✅ CSS and JS - Cache first with versioning
      {
        urlPattern: /\.(?:js|css)$/i,
        handler: "CacheFirst",
        options: {
          cacheName: "assets-cache",
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      // ✅ External API calls - Network first with fallback
      {
        urlPattern: ({ url }) => url.origin !== self.location.origin && url.pathname.startsWith("/api"),
        handler: "NetworkFirst",
        options: {
          cacheName: "external-api-cache",
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 10 * 60, // 10 minutes
          },
          networkTimeoutSeconds: 5,
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
    ],
    // ✅ Skip waiting and claim clients immediately
    skipWaiting: true,
    clientsClaim: true,
    // ✅ Cleanup old caches
    cleanupOutdatedCaches: true,
    // ✅ Maximum file size to precache (10MB)
    maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // ✅ Next.js built-in image optimization re-enabled for mobile performance
    // WebP/AVIF conversion + responsive srcset + automatic resizing
    // Previously disabled due to 404 errors — fixed by proper remotePatterns config
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    // Allow local/private upstreams in development (e.g. localhost/XAMPP API images).
    // Keep optimization enabled in production.
    unoptimized: process.env.NODE_ENV === 'development',
    dangerouslyAllowLocalIP: process.env.NODE_ENV === 'development',
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 2592000,
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  trailingSlash: false,
  reactStrictMode: true, // ✅ Enable React Strict Mode for better performance and bug detection
  // ✅ Compression - Next.js automatically compresses with gzip/brotli
  compress: true, // Enable compression (default: true)
  // ✅ Advanced compression settings
  experimental: {
    // Enable advanced optimizations
    optimizeCss: true, // Optimize CSS output
    // ✅ Inline CSS to eliminate render-blocking stylesheet requests (~220ms Lighthouse savings)
    // Trade-off: CSS is not cached separately from HTML (returning visitors re-download with page)
    inlineCss: true,
  },
  // ✅ Performance optimization
  poweredByHeader: false, // Remove X-Powered-By header for security
  generateEtags: true, // Enable ETags for better caching
  // ✅ Output configuration for better performance
  output: 'standalone', // Optimize for production deployment (smaller output)
  // ✅ Turbopack configuration for Next.js 16 (used in development)
  // Turbopack provides 10x faster builds and better caching
  turbopack: {
    // ✅ Resolve aliases (similar to webpack resolve.alias)
    // Note: Use relative paths from project root, not path.resolve()
    resolveAlias: {
      // Custom alias for apexcharts - maps to apexcharts-clevision package
      apexcharts: path.resolve(
        __dirname,
        "./node_modules/apexcharts-clevision"
      ),
    },
    // Note: Code splitting, tree-shaking, and optimizations are automatic in Turbopack
    // No need to configure splitChunks - Turbopack handles this intelligently
    // Turbopack automatically optimizes bundle size and performance
  },
  async redirects() {
    return [];
  },
  // ✅ Security Headers - Improve security and performance
  // Note: Cache for app.arablaza.com (API images/fonts) must be set on that server
  // (e.g. Nginx: add_header Cache-Control "public, max-age=31536000" for /storage/).
  async headers() {
    // ✅ Dev: no cache at all. Prod only: long cache for static assets
    const isDev = process.env.NODE_ENV === 'development';

    // ✅ Hashed static assets (_next/static) — immutable in prod only
    const immutableCache = isDev
      ? [{ key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, max-age=0' }]
      : [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }];

    // ✅ Public assets (images, CSS in /css/) - long cache but not immutable (no hash in URL)
    const longCache = isDev
      ? [{ key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, max-age=0' }]
      : [{ key: 'Cache-Control', value: 'public, max-age=31536000, stale-while-revalidate=86400' }];

    // ✅ Order matters: more specific sources MUST come first so they are not overridden by /:path*
    const securityHeaders = [
      { key: 'X-DNS-Prefetch-Control', value: 'on' },
      ...(isDev ? [] : [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }]),
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-XSS-Protection', value: '1; mode=block' },
      { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    ];

    return [
      // ✅ 1. _next/static (chunks, JS, CSS) — immutable so repeat visits don't revalidate
      {
        source: '/_next/static/:path*',
        headers: immutableCache,
      },
      // ✅ 2. _next/image and static media (fonts)
      {
        source: '/_next/image/:path*',
        headers: longCache,
      },
      {
        source: '/_next/static/media/:path*',
        headers: immutableCache,
      },
      // ✅ 3. Public assets
      {
        source: '/assets/:path*',
        headers: longCache,
      },
      {
        source: '/css/:path*',
        headers: longCache,
      },
      // ✅ Root-level static assets when served by Next.js (manifest, favicon)
      {
        source: '/manifest.json',
        headers: longCache,
      },
      {
        source: '/favicon.ico',
        headers: longCache,
      },
      // ✅ 4. Catch-all: HTML pages and everything else (security + short HTML cache)
      {
        source: '/:path*',
        headers: [
          ...securityHeaders,
          ...(isDev
            ? [{ key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' }]
            : [{ key: 'Cache-Control', value: 'public, max-age=0, s-maxage=60, stale-while-revalidate=300' }]
          ),
        ],
      },
    ];
  },
  // ✅ Advanced webpack optimization - Used for production builds only
  // Note: Turbopack is used in development, webpack is used for production builds
  // (Turbopack production builds are still experimental in Next.js 16)
  webpack: (config, { dev, isServer }) => {
    // Resolve aliases (for production builds)
    config.resolve.alias = {
      ...config.resolve.alias,
      apexcharts: path.resolve(
        __dirname,
        "./node_modules/apexcharts-clevision"
      ),
    };

    // ✅ Production optimizations (only applied in production builds)
    if (!dev && !isServer) {
      // Strip console.log/warn/error in production to reduce main-thread work
      const TerserPlugin = require('terser-webpack-plugin');
      config.optimization.minimizer = (config.optimization.minimizer || []).map(
        (plugin) => {
          if (plugin.constructor.name === 'TerserPlugin') {
            return new TerserPlugin({
              terserOptions: {
                compress: {
                  drop_console: ['log', 'warn', 'info', 'debug'],
                },
              },
            });
          }
          return plugin;
        }
      );

      config.optimization = {
        ...config.optimization,
        usedExports: true,
        sideEffects: false,
        minimize: true,
        // ✅ Advanced code splitting
        splitChunks: {
          chunks: 'all',
          maxAsyncRequests: 30,
          maxInitialRequests: 30,
          minSize: 20000,
          maxSize: 244000,
          cacheGroups: {
            default: false,
            vendors: false,
            // ✅ Vendor chunk for large libraries
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /node_modules/,
              priority: 20,
              minChunks: 1,
              reuseExistingChunk: true,
            },
            // ✅ Common chunk for shared code
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
            },
            // ✅ Ant Design chunk (large library)
            antd: {
              name: 'antd',
              test: /[\\/]node_modules[\\/]antd[\\/]/,
              chunks: 'all',
              priority: 30,
              reuseExistingChunk: true,
            },
            // ✅ MUI chunk (large library)
            mui: {
              name: 'mui',
              test: /[\\/]node_modules[\\/]@mui[\\/]/,
              chunks: 'all',
              priority: 30,
              reuseExistingChunk: true,
            },
            // ✅ Swiper chunk (large library, used in carousels)
            swiper: {
              name: 'swiper',
              test: /[\\/]node_modules[\\/]swiper[\\/]/,
              chunks: 'all',
              priority: 25,
              reuseExistingChunk: true,
            },
            // ✅ React Leaflet chunk (large library, used in maps)
            reactLeaflet: {
              name: 'react-leaflet',
              test: /[\\/]node_modules[\\/]react-leaflet[\\/]/,
              chunks: 'all',
              priority: 25,
              reuseExistingChunk: true,
            },
            // ✅ Redux chunk (state management)
            redux: {
              name: 'redux',
              test: /[\\/]node_modules[\\/](@reduxjs|react-redux|redux-persist)[\\/]/,
              chunks: 'all',
              priority: 20,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }

    return config;
  },
};

// ✅ دمج PWA مع باقي إعدادات المشروع
// ✅ Apply bundle analyzer if ANALYZE env is set
module.exports = withBundleAnalyzer(withPWA(nextConfig));
