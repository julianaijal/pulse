import type { Metadata, Viewport } from 'next';
import './globals.css';
import AnalyticsWrapper from './_lib/Analytics';
import WebVitals from './_lib/WebVitals';

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
  maximumScale: 1,
  themeColor: '#f5f1e8',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <head>
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
        <a
          href="#main-content"
          className="sr-only"
          style={{ position: 'absolute', zIndex: 999 }}
          onFocus={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.clip = 'auto';
            el.style.clipPath = 'none';
            el.style.width = 'auto';
            el.style.height = 'auto';
            el.style.overflow = 'visible';
          }}
          onBlur={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.clip = '';
            el.style.clipPath = '';
            el.style.width = '';
            el.style.height = '';
            el.style.overflow = '';
          }}
        >
          Skip to main content
        </a>
        <div id="app-root">
          {children}
        </div>
        <AnalyticsWrapper />
        <WebVitals />
      </body>
    </html>
  );
}
