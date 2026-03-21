/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
      allowedOrigins: ["dea-drop.vercel.app"],
    },
  },
};

export default nextConfig;