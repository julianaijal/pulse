import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readCache, writeCache } from './dataCache';

function fakeStorage() {
  const store = new Map<string, string>();
  return {
    store,
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => { store.set(k, v); },
    removeItem: (k: string) => { store.delete(k); },
  };
}

describe('dataCache', () => {
  let storage: ReturnType<typeof fakeStorage>;

  beforeEach(() => {
    storage = fakeStorage();
    vi.stubGlobal('localStorage', storage);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('roundtrips data with a timestamp', () => {
    vi.setSystemTime(1000);
    writeCache('departures:ASD', [{ id: 'x' }]);

    const hit = readCache<{ id: string }[]>('departures:ASD', 60_000);

    expect(hit).not.toBeNull();
    expect(hit!.data).toEqual([{ id: 'x' }]);
    expect(hit!.cachedAt).toBe(1000);
  });

  it('returns null for a missing key', () => {
    expect(readCache('departures:UT', 60_000)).toBeNull();
  });

  it('treats entries older than maxAgeMs as absent', () => {
    vi.setSystemTime(1000);
    writeCache('departures:ASD', [1, 2]);
    vi.setSystemTime(1000 + 60_001);

    expect(readCache('departures:ASD', 60_000)).toBeNull();
  });

  it('still returns entries at exactly maxAgeMs', () => {
    vi.setSystemTime(1000);
    writeCache('departures:ASD', [1]);
    vi.setSystemTime(1000 + 60_000);

    expect(readCache('departures:ASD', 60_000)).not.toBeNull();
  });

  it('treats corrupt JSON as a miss and deletes the entry', () => {
    storage.store.set('transit:departures:ASD', '{not json');

    expect(readCache('departures:ASD', 60_000)).toBeNull();
    expect(storage.store.has('transit:departures:ASD')).toBe(false);
  });

  it('treats entries with a bad shape as a miss and deletes them', () => {
    storage.store.set('transit:departures:ASD', JSON.stringify({ nope: true }));

    expect(readCache('departures:ASD', 60_000)).toBeNull();
    expect(storage.store.has('transit:departures:ASD')).toBe(false);
  });

  it('does not throw when localStorage throws (write)', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => { throw new Error('denied'); },
      setItem: () => { throw new Error('quota'); },
      removeItem: () => { throw new Error('denied'); },
    });

    expect(() => writeCache('departures:ASD', [1])).not.toThrow();
    expect(readCache('departures:ASD', 60_000)).toBeNull();
  });
});
