// next.config.js - Add widget-specific configuration
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Existing config...
  
  // Add these configurations for the widget
  experimental: {
    // Disable static optimization for widget route to prevent hydration issues
    isrMemoryCacheSize: 0,
  },
  eslint: {
      // Warning: This allows production builds to successfully complete even if
      // your project has ESLint errors.
      ignoreDuringBuilds: true,
  },
  typescript: {
      ignoreBuildErrors: true,
  },
  // Headers configuration for CORS and embedding
  async headers() {
    return [
      {
        // Apply to all widget routes
        source: '/widget/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL', // Allow iframe embedding
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors *; frame-src *;", // Allow embedding from any domain
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=60, stale-while-revalidate=300',
          },
        ],
      },
      {
        // Apply to API routes for widget
        source: '/api/chatbot-config',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-Requested-With',
          },
          {
            key: 'Access-Control-Max-Age',
            value: '86400',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=300',
          },
        ],
      },
      {
        // Apply to chat API routes
        source: '/api/chat/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-Requested-With',
          },
          {
            key: 'Access-Control-Max-Age',
            value: '86400',
          },
        ],
      },
    ]
  },
  
  // Webpack configuration for better widget bundling
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Optimize for widget routes
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    
    return config
  },
  
  // Ensure proper static generation behavior
  trailingSlash: false,
  
  // Image optimization (if you're using images in the widget)
  images: {
    domains: ['webbot-ai.netlify.app'], // Add your widget domain
    unoptimized: true, // For iframe compatibility
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Allow all image URLs for development
      }
    ],
  },
  
  // Disable x-powered-by header for security
  poweredByHeader: false,
  
  // Enable compression for better performance
  compress: true,
  
  // React strict mode (can cause hydration issues in development)
  reactStrictMode: false, // Disable for widget to prevent double-rendering issues
  
  // SWC minification for better performance
  swcMinify: true,
  
  // Additional configuration for widget compatibility
  async rewrites() {
    return [
      // Add any URL rewrites if needed for widget routes
    ]
  },
  
  // Error handling for widget routes
  async redirects() {
    return [
      // Add redirects if needed
    ]
  }
}

// Change from:
// module.exports = nextConfig
// To:
export default nextConfig