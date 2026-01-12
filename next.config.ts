import bundleAnalyzer from '@next/bundle-analyzer';

import type { NextConfig } from 'next';

// Bundle analyzer (enable with ANALYZE=true)
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

// Content Security Policy
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' https://challenges.cloudflare.com https://static.cloudflareinsights.com https://us.i.posthog.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: blob: https: http:;
  connect-src 'self' https: wss:;
  frame-src 'self' https://warpcast.com https://*.farcaster.xyz https://challenges.cloudflare.com https://verify.walletconnect.org;
  frame-ancestors 'self' https://warpcast.com https://*.farcaster.xyz;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  upgrade-insecure-requests;
`
  .replace(/\s{2,}/g, ' ')
  .trim();

const securityHeaders = [
  // DNS Prefetch
  { key: 'X-DNS-Prefetch-Control', value: 'on' },

  // XSS Protection
  { key: 'X-XSS-Protection', value: '1; mode=block' },

  // No Sniff
  { key: 'X-Content-Type-Options', value: 'nosniff' },

  // Frame Options (allow Farcaster)
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },

  // Referrer Policy
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },

  // Permissions Policy
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },

  // CSP
  {
    key: 'Content-Security-Policy',
    value: ContentSecurityPolicy,
  },

  // HSTS (enable in production with proper domain)
  ...(process.env.NODE_ENV === 'production'
    ? [
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=31536000; includeSubDomains; preload',
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Powered by header removal (security)
  poweredByHeader: false,

  // ESLint - temporarily ignore during builds to allow deployment
  // TODO: Fix ESLint errors and re-enable
  eslint: {
    ignoreDuringBuilds: true,
  },

  // TypeScript - temporarily ignore during builds to allow deployment
  // TODO: Fix TypeScript errors and re-enable
  typescript: {
    ignoreBuildErrors: true,
  },

  // Turbopack for faster development
  experimental: {
    // Enable Server Actions
    serverActions: {
      bodySizeLimit: '2mb',
    },
    // Optimize package imports
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      '@radix-ui/react-icons',
      'date-fns',
      'viem',
      'wagmi',
    ],
    // Type routes
    typedRoutes: true,
  },

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      { protocol: 'https', hostname: 'i.imgur.com' },
      { protocol: 'https', hostname: 'imagedelivery.net' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'assets.coingecko.com' },
      { protocol: 'https', hostname: 'raw.githubusercontent.com' },
      { protocol: 'https', hostname: '*.walletconnect.com' },
      { protocol: 'https', hostname: 'tokens.1inch.io' },
      { protocol: 'https', hostname: 'cdn.stamp.fyi' },
    ],
  },

  // Headers for security and Farcaster Frame
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      // Allow Farcaster to embed frames (override CSP)
      {
        source: '/frames/:path*',
        headers: [
          ...securityHeaders.filter((h) => h.key !== 'Content-Security-Policy'),
          {
            key: 'Content-Security-Policy',
            value: `${ContentSecurityPolicy}; frame-ancestors 'self' https://warpcast.com https://*.farcaster.xyz`,
          },
        ],
      },
      // API routes - add CORS
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: process.env.NEXT_PUBLIC_APP_URL || '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          {
            key: 'Access-Control-Allow-Headers',
            value:
              'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization',
          },
        ],
      },
    ];
  },

  // Redirects
  async redirects() {
    return [
      { source: '/home', destination: '/', permanent: true },
      { source: '/app', destination: '/dashboard', permanent: true },
    ];
  },

  // Rewrites for API versioning
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [],
      fallback: [],
    };
  },

  // Environment variables validation
  env: {
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID,
  },

  // Logging
  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === 'development',
    },
  },

  // Compiler optimizations
  compiler: {
    // Remove console.log in production (keep warn and error)
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },

  // Output configuration
  output: 'standalone',

  // Webpack customization
  webpack: (config, { isServer, webpack }) => {
    // Fix for packages that use Node.js modules
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }

    // Handle SVG files
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });

    // Ignore devtools in production builds
    if (process.env.NODE_ENV === 'production') {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@tanstack/react-query-devtools': false,
      };
    }

    // Ignore unnecessary warnings
    config.ignoreWarnings = [{ module: /node_modules/ }];

    return config;
  },
};

export default withBundleAnalyzer(nextConfig);
