/** @type {import('next').NextConfig} */
const nextConfig = {
  // Tối ưu hóa cho Vercel
  output: 'standalone',
  reactStrictMode: true,
  swcMinify: true,
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  
  // Tắt xác minh khi build
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  
  // Cấu hình hình ảnh
  images: {
    domains: ['localhost', 'planai.io', '*.supabase.co'],
    minimumCacheTTL: 60,
    formats: ['image/avif', 'image/webp'],
  },
  
  // Cấu hình Webpack
  webpack: (config, { isServer, dev }) => {
    // Fallback cho các module Node.js
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      dns: false,
      child_process: false,
      dgram: false,
      cluster: false,
      worker_threads: false,
      http2: false,
      path: require.resolve('path-browserify'),
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      http: require.resolve('stream-http'),
      https: require.resolve('https-browserify'),
      os: require.resolve('os-browserify/browser'),
      zlib: require.resolve('browserify-zlib'),
      querystring: require.resolve('querystring-es3'),
      url: require.resolve('url/'),
      // Fallbacks for node: prefixed modules
      'node:events': require.resolve('events/'),
      'node:process': false,
      'node:util': require.resolve('util/'),
      'node:buffer': require.resolve('buffer/'),
      'node:path': require.resolve('path-browserify'),
      'node:crypto': require.resolve('crypto-browserify'),
      'node:stream': require.resolve('stream-browserify'),
      'node:http': require.resolve('stream-http'),
      'node:https': require.resolve('https-browserify'),
      'node:os': require.resolve('os-browserify/browser'),
      'node:zlib': require.resolve('browserify-zlib'),
      'node:querystring': require.resolve('querystring-es3'),
      'node:url': require.resolve('url/')
    };

    // Handle node: prefixed imports
    config.resolve.alias = {
      ...config.resolve.alias,
      'node:events': 'events',
      'node:process': false,
      'node:util': 'util',
      'node:buffer': 'buffer',
      'node:path': 'path-browserify',
      'node:crypto': 'crypto-browserify',
      'node:stream': 'stream-browserify',
      'node:http': 'stream-http',
      'node:https': 'https-browserify',
      'node:os': 'os-browserify/browser',
      'node:zlib': 'browserify-zlib',
      'node:querystring': 'querystring-es3',
      'node:url': 'url'
    };

    // Xử lý file .node
    config.module.rules.push({
      test: /\.node$/,
      use: 'node-loader',
    });

    // Tối ưu hóa kích thước bundle
    if (!isServer && !dev) {
      config.optimization.splitChunks = {
        chunks: 'all',
        maxSize: 244 * 1024, // 244KB
      };
    }

    return config;
  },
  
  // Cấu hình headers bảo mật
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net https://*.googleapis.com https://*.gstatic.com; connect-src 'self' https://*.supabase.co https://apis.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://*.googleusercontent.com https://*.gstatic.com;",
          },
        ],
      },
    ];
  },
  
  // Cấu hình redirects
  async redirects() {
    return [
      // Bỏ redirect từ "/" đến "/dashboard" để user có thể xem homepage
      // {
      //   source: '/',
      //   destination: '/dashboard',
      //   permanent: true,
      // },
    ];
  },
  
  // Cấu hình rewrites
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ];
  },
};

// Chỉ sử dụng các biến môi trường cần thiết trong môi trường production
if (process.env.NODE_ENV === 'production') {
  nextConfig.env = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    PAYOS_CLIENT_ID: process.env.PAYOS_CLIENT_ID,
    PAYOS_API_KEY: process.env.PAYOS_API_KEY,
    PAYOS_CHECKSUM_KEY: process.env.PAYOS_CHECKSUM_KEY,
    PAYOS_API_URL: process.env.PAYOS_API_URL,
    NOTION_API_KEY: process.env.NOTION_API_KEY,
    NOTION_CLIENT_ID: process.env.NOTION_CLIENT_ID,
    NOTION_CLIENT_SECRET: process.env.NOTION_CLIENT_SECRET,
    GOOGLE_SHEETS_CLIENT_ID: process.env.GOOGLE_SHEETS_CLIENT_ID,
    GOOGLE_SHEETS_CLIENT_SECRET: process.env.GOOGLE_SHEETS_CLIENT_SECRET,
    SEPAY_TOKEN: process.env.SEPAY_TOKEN,
    SEPAY_ACCOUNT_NUMBER: process.env.SEPAY_ACCOUNT_NUMBER,
  };
}

module.exports = nextConfig;
