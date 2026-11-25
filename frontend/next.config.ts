import type { NextConfig } from "next";

const apiOrigin = (
  process.env.NEXT_PUBLIC_API_URL || "https://vnnet-vn-java.onrender.com"
).replace(/\/$/, "");
const wsOrigin = apiOrigin.replace(/^http/, "ws");

const cspDirectives = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://apis.google.com https://api.mapbox.com",
  "style-src 'self' 'unsafe-inline' https://accounts.google.com https://api.mapbox.com https://fonts.googleapis.com",
  "img-src 'self' data: blob: https://res.cloudinary.com https://*.googleusercontent.com https://api.mapbox.com https://*.mapbox.com https://images.unsplash.com https://api.dicebear.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  `connect-src 'self' ${apiOrigin} ${wsOrigin} https://vnnet-vn-java.onrender.com wss://vnnet-vn-java.onrender.com http://localhost:8000 ws://localhost:8000 https://accounts.google.com https://oauth2.googleapis.com https://api.mapbox.com https://events.mapbox.com https://res.cloudinary.com`,
  "frame-src 'self' https://accounts.google.com",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "api.dicebear.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: cspDirectives },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), payment=(), geolocation=(self)",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
