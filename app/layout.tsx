import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import AnalyticsWrapper from './_lib/Analytics';
import WebVitals from './_lib/WebVitals';
import SkipNav from './_lib/SkipNav';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-jakarta',
});

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
    <html lang="en" className={jakarta.variable}>
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
