/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "m.media-amazon.com",
      },
      {
        protocol: "https",
        hostname: "**.media-amazon.com",
      },
      {
        protocol: "https",
        hostname: "**.flixcart.com",
      },
      {
        protocol: "https",
        hostname: "**.flipkart.com",
      },
    ],
  },
};

export default nextConfig;
