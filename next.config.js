/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react', '@mantine/core', '@mantine/hooks'],
  },
};

module.exports = nextConfig;
