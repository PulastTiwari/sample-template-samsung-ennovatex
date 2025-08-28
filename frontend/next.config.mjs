/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/suggestions/:path*',
        destination: 'http://localhost:8000/suggestions/:path*',
      },
    ]
  },
}

export default nextConfig
