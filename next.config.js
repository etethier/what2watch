/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  swcMinify: true,
  
  // Simple webpack config to avoid vendor chunk issues
  webpack: (config) => {
    // Force framer-motion to be included as a normal dependency,
    // not in a vendor chunk
    if (config.optimization && config.optimization.splitChunks) {
      config.optimization.splitChunks.cacheGroups = {
        ...config.optimization.splitChunks.cacheGroups,
        // Disable the vendors cache group
        vendors: false,
        // Create a custom cache group for framer-motion
        framerMotion: {
          test: /[\\/]node_modules[\\/](framer-motion)[\\/]/,
          name: 'framer-motion',
          priority: 10,
          reuseExistingChunk: true,
        },
      };
    }
    
    return config;
  },
};

module.exports = nextConfig; 