/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // 👇 Esto desactiva el chequeo en Vercel
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
