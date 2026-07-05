import type { Metadata, Viewport } from 'next';
import './globals.css';
import AnalyticsWrapper from './_lib/Analytics';
import WebVitals from './_lib/WebVitals';
import SkipNav from './_lib/SkipNav';

export const metadata: Metadata = {
  title: 'Pulse — transit',
  description: 'Your Dutch rail companion.',
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
  themeColor: '#F2F4F8',
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
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
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
