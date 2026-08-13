'use client';

import { useState, useEffect } from 'react';
import { IStation } from '../interfaces/interfaces';
import { readCache, writeCache } from '../_utils/dataCache';
import { STATIONS } from '../_utils/mock';

const CACHE_KEY = 'pulse.allStations';
const CACHE_TTL = 24 * 60 * 60 * 1000;

export function useStations(): {
  stations: IStation[];
  loading: boolean;
} {
  const [stations, setStations] = useState<IStation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const cached = readCache<IStation[]>(CACHE_KEY, CACHE_TTL);
    if (cached) {
      setStations(cached.data);
      setLoading(false);
      return;
    }

    const ctrl = new AbortController();
    fetch('/api/stations', { signal: ctrl.signal })
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (!active) return;
        if (Array.isArray(data) && data.length > 0) {
          writeCache(CACHE_KEY, data);
          setStations(data);
        } else {
          setStations(STATIONS as IStation[]);
        }
        setLoading(false);
      })
      .catch(err => {
        if (err instanceof Error && err.name === 'AbortError') return;
        if (active) {
          setStations(STATIONS as IStation[]);
          setLoading(false);
        }
      });

    return () => { active = false; ctrl.abort(); };
  }, []);

  return { stations, loading };
}
