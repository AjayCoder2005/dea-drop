/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.media-amazon.com",
      },
      {
        protocol: "http",
        hostname: "**",
      },
      {
        protocol: "https",
        hostname: "**.flixcart.com",
      },
      {
        protocol: "https",
        hostname: "**.flipkart.com",
      },
      {
        protocol: "https",
        hostname: "**.walmartimages.com",
      },
      {
        protocol: "https",
        hostname: "**.ebayimg.com",
      },
      {
        protocol: "https",
        hostname: "**.alicdn.com",
      },
      {
        protocol: "https",
        hostname: "**.myntra.com",
      },
      {
        protocol: "https",
        hostname: "**.snapdeal.com",
      },
      // ✅ Meesho
      {
        protocol: "https",
        hostname: "**.meesho.com",
      },
      {
        protocol: "https",
        hostname: "**.meeshocdn.com",
      },
      // ✅ Tata Cliq
      {
        protocol: "https",
        hostname: "**.tatacliqdemo.com",
      },
      {
        protocol: "https",
        hostname: "**.tatacliq.com",
      },
      // ✅ Nykaa
      {
        protocol: "https",
        hostname: "**.nykaa.com",
      },
      {
        protocol: "https",
        hostname: "**.nykaacdn.com",
      },
      // ✅ Ajio
      {
        protocol: "https",
        hostname: "**.ajio.com",
      },
      // ✅ Croma
      {
        protocol: "https",
        hostname: "**.croma.com",
      },
      // ✅ Reliance Digital
      {
        protocol: "https",
        hostname: "**.reliancedigital.in",
      },
      // ✅ JioMart
      {
        protocol: "https",
        hostname: "**.jiomart.com",
      },
      // ✅ BigBasket
      {
        protocol: "https",
        hostname: "**.bigbasket.com",
      },
      // ✅ Blinkit
      {
        protocol: "https",
        hostname: "**.blinkit.com",
      },
    ],
  },
};

export default nextConfig;