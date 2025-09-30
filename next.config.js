/** @type {import('next').NextConfig} */
const nextConfig = {
  // Tắt xác minh TypeScript khi build
  typescript: {
    ignoreBuildErrors: true,
  },
  // Tắt xác minh ESLint khi build
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['localhost', 'planai.io'],
  },
  // Sử dụng experimental để tắt webpack 5
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
    // Tắt webpack 5
    webpackBuildWorker: false,
  },
  // Cấu hình webpack
  webpack: (config, { isServer }) => {
    // Thêm fallbacks cho các module Node.js
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
      path: require.resolve('path-browserify'),
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      http: require.resolve('stream-http'),
      https: require.resolve('https-browserify'),
      os: require.resolve('os-browserify/browser'),
      zlib: require.resolve('browserify-zlib'),
      querystring: require.resolve('querystring-es3'),
      url: require.resolve('url/')
    };

    // Thêm rule để xử lý các file .node
    config.module.rules.push({
      test: /\.node$/,
      use: 'node-loader',
    });

    return config;
  },
  // Cấu hình output
  output: 'standalone',
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  reactStrictMode: true,
  swcMinify: true,
  // Chỉ định các gói cần transpile
  transpilePackages: ['@supabase/supabase-js'],
}

module.exports = nextConfig
