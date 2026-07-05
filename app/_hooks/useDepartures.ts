'use client';

import { useState, useEffect } from 'react';
import { IDeparture } from '../interfaces/interfaces';
import { generateDepartures } from '../_utils/mock';

/**
 * Live departure board for a station: fetch on mount, poll every 60s,
 * refetch when the tab becomes visible, and fall back to demo data
 * when the NS API is unavailable.
 */
export function useDepartures(code: string | null | undefined): IDeparture[] | null {
  const [departures, setDepartures] = useState<IDeparture[] | null>(null);

  useEffect(() => {
    if (!code) return;
    queueMicrotask(() => setDepartures(null));
    let active = true;
    let abortCtrl: AbortController | null = null;
    let hasData = false;

    const fetchData = async () => {
      if (!active || document.visibilityState !== 'visible') return;
      abortCtrl?.abort();
      const ctrl = new AbortController();
      abortCtrl = ctrl;
      try {
        const res = await fetch(`/api/departures/${code}`, { signal: ctrl.signal });
        if (res.ok) {
          const data = await res.json();
          if (active && Array.isArray(data) && data.length > 0) {
            hasData = true;
            setDepartures(data);
            return;
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
      }
      if (active && !hasData) setDepartures(generateDepartures(code, new Date()));
    };

    fetchData();
    const timer = setInterval(fetchData, 60_000);
    const onVisibility = () => { if (document.visibilityState === 'visible') fetchData(); };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      active = false;
      abortCtrl?.abort();
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [code]);

  return departures;
}
