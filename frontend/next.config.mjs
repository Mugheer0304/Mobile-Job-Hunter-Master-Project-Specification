/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  async redirects() {
    return [
      { source: '/', destination: '/jobs', permanent: false },
    ];
  },
};

export default nextConfig;
