'use client';

import { useState, useEffect, useCallback } from 'react';
import { IDeparture } from '../interfaces/interfaces';
import { generateDepartures } from '../_utils/mock';

export type DataSource = 'loading' | 'live' | 'demo';

/**
 * Live departure board for a station: fetch on mount, poll every 60s,
 * refetch when the tab becomes visible, and fall back to demo data
 * when the NS API is unavailable. `source` reports whether the data is
 * live or demo, and `retry` forces a fresh fetch.
 */
export function useDepartures(code: string | null | undefined): {
  departures: IDeparture[] | null;
  source: DataSource;
  retry: () => void;
} {
  const [departures, setDepartures] = useState<IDeparture[] | null>(null);
  const [source, setSource] = useState<DataSource>('loading');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!code) return;
    queueMicrotask(() => { setDepartures(null); setSource('loading'); });
    let active = true;
    let abortCtrl: AbortController | null = null;
    let hasLiveData = false;

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
            hasLiveData = true;
            setDepartures(data);
            setSource('live');
            return;
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
      }
      if (active && !hasLiveData) {
        setDepartures(generateDepartures(code, new Date()));
        setSource('demo');
      }
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
  }, [code, attempt]);

  const retry = useCallback(() => setAttempt(a => a + 1), []);

  return { departures, source, retry };
}
