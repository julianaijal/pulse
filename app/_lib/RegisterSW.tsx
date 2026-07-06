'use client';

import { useEffect } from 'react';

/** Registers the app-shell service worker. Production-only so dev never fights stale caches. */
export default function RegisterSW() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator)) return;

    const register = () => { navigator.serviceWorker.register('/sw.js').catch(() => {}); };
    if (document.readyState === 'complete') {
      register();
      return;
    }
    window.addEventListener('load', register);
    return () => window.removeEventListener('load', register);
  }, []);

  return null;
}
