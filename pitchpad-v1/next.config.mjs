/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:3000',
        'pitchpadapp.vercel.app',
        '*.vercel.app',
      ],
    },
  },
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
}

export default nextConfig
