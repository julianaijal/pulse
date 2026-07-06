import type { NextConfig } from "next";

// Vercel preview deployments inject the Vercel Toolbar (preview comments)
// from vercel.live. Allow it on previews only — production CSP is unchanged.
// Directives per https://vercel.com/docs/vercel-toolbar (CSP section).
const isVercelPreview = process.env.VERCEL_ENV === "preview";

const securityHeaders = [
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  {
    // Allow:
    //   self              — page, scripts, styles, images served from this origin
    //   fonts.googleapis.com / fonts.gstatic.com — Google Fonts (used in layout.tsx)
    //   va.vercel-scripts.com — Vercel Analytics script
    //   vitals.vercel-insights.com — Vercel Web Vitals beacon
    // Note: 'unsafe-inline' for scripts is required by Next.js hydration.
    // Nonce-based CSP is the proper fix and is out of scope here.
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline' va.vercel-scripts.com${isVercelPreview ? " vercel.live" : ""}`,
      `style-src 'self' 'unsafe-inline' fonts.googleapis.com${isVercelPreview ? " vercel.live" : ""}`,
      `font-src 'self' fonts.gstatic.com${isVercelPreview ? " vercel.live assets.vercel.com" : ""}`,
      `img-src 'self' data:${isVercelPreview ? " vercel.live vercel.com blob:" : ""}`,
      `connect-src 'self' vitals.vercel-insights.com${isVercelPreview ? " vercel.live wss://ws-us3.pusher.com" : ""}`,
      ...(isVercelPreview ? ["frame-src vercel.live"] : []),
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
