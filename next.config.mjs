/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  compress: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error'] } : false
  },
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      '@tanstack/react-query',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-slot'
    ],
    serverActions: {
      bodySizeLimit: '5mb'
    }
  }
};

export default nextConfig;
