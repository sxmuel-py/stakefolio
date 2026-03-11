/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable slow dev features
  reactStrictMode: false,
  
  experimental: {
    optimizeCss: false,
    optimizePackageImports: ['lucide-react', 'framer-motion', '@tanstack/react-query'],
  },

  // Faster builds
  typescript: {
    ignoreBuildErrors: false,
  },

  // Reduce bundle size
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Optimize images
  images: {
    formats: ['image/webp'],
  },

  // Webpack optimizations for dev
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Faster rebuilds
      config.watchOptions = {
        poll: false,
        aggregateTimeout: 300,
      };
      
      // Reduce bundle analysis overhead
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
      };
    }
    return config;
  },
}

module.exports = nextConfig
