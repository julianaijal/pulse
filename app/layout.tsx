import type { Metadata, Viewport } from 'next';
import './globals.css';
import AnalyticsWrapper from './_lib/Analytics';
import WebVitals from './_lib/WebVitals';
import SkipNav from './_lib/SkipNav';

export const metadata: Metadata = {
  title: 'Pulse — transit',
  description: 'Your editorial transit companion for the Dutch rail network.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Pulse',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#f5f1e8',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <head>
        {/* Applies saved theme before first paint. Accent values mirror ACCENT_MAP in TweaksPanel.tsx — keep in sync. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var d=document.documentElement,t=localStorage.getItem('pulse.theme');if(t)d.dataset.theme=t;var m={orange:'oklch(0.60 0.17 45)',cobalt:'oklch(0.55 0.19 265)',sage:'oklch(0.58 0.13 155)',plum:'oklch(0.48 0.18 330)'},a=localStorage.getItem('pulse.accent');if(a&&m[a])d.style.setProperty('--accent',m[a]);}catch(e){}",
          }}
        />
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500;600&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <SkipNav />
        <div id="app-root">
          {children}
        </div>
        <AnalyticsWrapper />
        <WebVitals />
      </body>
    </html>
  );
}
