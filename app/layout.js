import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata = {
  title: "DealDrop — Smart Price Tracker",
  description:
    "Track product prices across e-commerce sites and get instant alerts on price drops",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ margin: 0, padding: 0, background: "#0a0a0f", minHeight: "100vh" }}>
        {children}
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  );
}