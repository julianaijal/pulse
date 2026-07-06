'use client';

import { useState, useEffect, useCallback } from 'react';
import { IDeparture } from '../interfaces/interfaces';
import { generateDepartures } from '../_utils/mock';
import { readCache, writeCache } from '../_utils/dataCache';
import appConfig from '@/config/app.config';

export type DataSource = 'loading' | 'live' | 'cached' | 'demo';

/**
 * Live departure board for a station: fetch on mount, poll every 60s,
 * refetch when the tab becomes visible. On failure, fall back to the
 * last live response cached in localStorage (max 1h old), then to demo
 * data. `source` reports which of those is showing, `cachedAt` is the
 * timestamp of cached data, and `retry` forces a fresh fetch.
 */
export function useDepartures(code: string | null | undefined): {
  departures: IDeparture[] | null;
  source: DataSource;
  cachedAt: number | null;
  retry: () => void;
} {
  const [departures, setDepartures] = useState<IDeparture[] | null>(null);
  const [source, setSource] = useState<DataSource>('loading');
  const [cachedAt, setCachedAt] = useState<number | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!code) return;
    queueMicrotask(() => { setDepartures(null); setSource('loading'); setCachedAt(null); });
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
            writeCache(`departures:${code}`, data);
            setDepartures(data);
            setSource('live');
            setCachedAt(null);
            return;
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
      }
      if (active && !hasLiveData) {
        const cached = readCache<IDeparture[]>(`departures:${code}`, appConfig.departuresCacheTtlMs);
        if (cached) {
          setDepartures(cached.data);
          setSource('cached');
          setCachedAt(cached.cachedAt);
        } else {
          setDepartures(generateDepartures(code, new Date()));
          setSource('demo');
          setCachedAt(null);
        }
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

  return { departures, source, cachedAt, retry };
}
