'use client';

import { useState, useEffect, useCallback } from 'react';
import { IStop } from '../interfaces/interfaces';

/**
 * Stops for a train journey. `failed` is true when the train id is
 * missing/invalid or the API returned no usable data. `retry` forces
 * a fresh fetch.
 */
export function useJourney(trainId: string | null): {
  stops: IStop[] | null;
  failed: boolean;
  retry: () => void;
} {
  const [stops, setStops] = useState<IStop[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!trainId) {
      queueMicrotask(() => { setStops(null); setFailed(true); });
      return;
    }
    queueMicrotask(() => { setStops(null); setFailed(false); });

    let active = true;
    const ctrl = new AbortController();
    fetch(`/api/journey/${trainId}`, { signal: ctrl.signal })
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (!active) return;
        if (Array.isArray(data) && data.length > 0) setStops(data);
        else setFailed(true);
      })
      .catch(err => {
        if (err instanceof Error && err.name === 'AbortError') return;
        if (active) setFailed(true);
      });

    return () => { active = false; ctrl.abort(); };
  }, [trainId, attempt]);

  const retry = useCallback(() => setAttempt(a => a + 1), []);

  return { stops, failed, retry };
}
