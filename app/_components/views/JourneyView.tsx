'use client';

import React, { useState } from 'react';
import { IDeparture, IStop } from '../../interfaces/interfaces';
import { useJourney } from '../../_hooks/useJourney';
import { formatTime, quietestCar } from '../../_utils/format';
import { IconBack } from '../icons/Icons';
import Loader from '../_partials/Loader';

interface JourneyViewProps {
  train: IDeparture | null;
  fromCode?: string;
  onBack: () => void;
  onNavigate: (tab: 'rhythm' | 'search') => void;
}

export default function JourneyView({ train, fromCode, onBack, onNavigate }: JourneyViewProps) {
  const [copied, setCopied] = useState(false);

  const rawTrainId = train?.trainId;
  const trainId = rawTrainId != null && /^\d+$/.test(String(rawTrainId)) ? String(rawTrainId) : null;

  const { stops, failed: stopsFailed, retry: retryStops } = useJourney(trainId);

  if (!train) {
    return (
      <div className="view fade-up">
        <div style={{ padding: '18px 18px 6px' }}>
          <button onClick={onBack} aria-label="Back" className="hit-target" style={{
            position: 'relative', width: 34, height: 34, borderRadius: 17, background: 'var(--card)',
            border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <IconBack aria-hidden="true" style={{ width: 16, height: 16, color: 'var(--ink)' }} />
          </button>
        </div>
        <div style={{ padding: '16px 18px' }}>
          <h1 style={{ fontSize: 19, fontWeight: 800 }}>No active journey</h1>
          <p style={{ marginTop: 10, fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5, maxWidth: 360 }}>
            Pick a train in{' '}
            <button onClick={() => onNavigate('rhythm')} style={{ color: 'var(--primary)', fontWeight: 700, padding: 0, fontSize: 13 }}>Home</button>
            {' '}or{' '}
            <button onClick={() => onNavigate('search')} style={{ color: 'var(--primary)', fontWeight: 700, padding: 0, fontSize: 13 }}>Stations</button>
            {' '}to track it here.
          </p>
        </div>
      </div>
    );
  }

  const shareEta = async () => {
    const arrival = stops && stops.length > 0 ? stops[stops.length - 1] : null;
    const etaStr = arrival
      ? formatTime(arrival.actualTime)
      : null;
    const text = arrival && etaStr
      ? `I'm on the ${train.trainCategory} to ${train.direction}, arriving at ${arrival.name} around ${etaStr}.`
      : `I'm on the ${train.trainCategory} to ${train.direction}.`;
    try {
      if (navigator.share) {
        await navigator.share({ text });
      } else {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // user dismissed the share sheet
    }
  };

  const hereIdx = stops && fromCode ? stops.findIndex(s => s.code === fromCode) : -1;
  const crowding = train.crowding;
  const hasCrowding = !!crowding && crowding.length > 0;
  const quietCar = hasCrowding ? quietestCar(crowding) : -1;
  const crowdPct = hasCrowding ? Math.round(crowding[quietCar] * 100) : null;
  // Real NS forecast for the boarding stop (falls back to the origin)
  const forecast = stops?.[hereIdx >= 0 ? hereIdx : 0]?.crowdForecast;

  return (
    <div className="view fade-up">
      {/* Header */}
      <div style={{ padding: '18px 18px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={onBack} aria-label="Back" className="hit-target" style={{
          position: 'relative', width: 34, height: 34, borderRadius: 17, background: 'var(--card)',
          border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <IconBack aria-hidden="true" style={{ width: 16, height: 16, color: 'var(--ink)' }} />
        </button>

        <span style={{ padding: '4px 10px', borderRadius: 999, background: 'var(--primary-tint)', color: 'var(--primary)', fontSize: 11, fontWeight: 700 }}>
          {train.trainCategory} {train.trainId ?? ''}
        </span>
        <span className="dot live" style={{ marginLeft: -4 }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ok-text)' }}>live</span>

        <h1 style={{ flex: 1, fontSize: 19, fontWeight: 800, letterSpacing: '-0.02em' }}>
          to {train.direction}
        </h1>

        {/* Track box — hidden when track is unknown (e.g. journeys opened from the map) */}
        {train.actualTrack && train.actualTrack !== '—' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              border: train.trackChanged ? '1.5px solid var(--warn-accent)' : '1.5px solid var(--line)',
              background: train.trackChanged ? 'var(--warn-tint)' : 'transparent',
              color: train.trackChanged ? 'var(--warn-text)' : 'var(--ink)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, fontWeight: 800,
            }}>
              {train.actualTrack}
            </div>
            <span style={{ fontSize: 10, fontWeight: train.trackChanged ? 800 : 700, letterSpacing: '0.1em', color: train.trackChanged ? 'var(--warn-text)' : 'var(--ink-3)', marginTop: 2 }}>
              {train.trackChanged ? 'NEW TRACK' : 'TRACK'}
            </span>
            {train.trackChanged && (
              <span className="sr-only">Track changed to {train.actualTrack}</span>
            )}
          </div>
        )}
      </div>

      {/* Where to stand / crowding */}
      {(hasCrowding || forecast) && (
        <div style={{ padding: '0 18px 12px' }}>
          <div className="card" style={{ padding: 16, borderRadius: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: hasCrowding ? 12 : 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="eyebrow">{hasCrowding ? 'WHERE TO STAND' : 'CROWDING'}</span>
                {forecast && (
                  <span style={{
                    padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 800,
                    background: forecast === 'LOW' ? 'var(--ok-tint)' : forecast === 'MEDIUM' ? 'var(--warn-tint)' : 'var(--bad-tint)',
                    color: forecast === 'LOW' ? 'var(--ok-text)' : forecast === 'MEDIUM' ? 'var(--warn-text)' : 'var(--bad)',
                  }}>
                    {forecast === 'LOW' ? 'Quiet train' : forecast === 'MEDIUM' ? 'Fairly busy' : 'Very busy'}
                  </span>
                )}
              </div>
              {hasCrowding && (
                <span style={{ fontSize: 12, fontWeight: 700, color: crowdPct! < 40 ? 'var(--ok-text)' : crowdPct! < 75 ? 'var(--warn-text)' : 'var(--bad)' }}>
                  Car {quietCar + 1} · {crowdPct}% full
                </span>
              )}
            </div>

            {hasCrowding && (<>
            {/* Train diagram */}
            <div style={{ display: 'flex', gap: 3 }}>
              {crowding!.map((c, i) => {
                const isRec = i === quietCar;
                const isEnd = i === 0 || i === crowding!.length - 1;
                return (
                  <div key={i} style={{
                    flex: 1, height: 34, position: 'relative',
                    borderRadius: isEnd ? (i === 0 ? '8px 4px 4px 8px' : '4px 8px 8px 4px') : 4,
                    background: isRec ? 'var(--ok-tint)' : '#CBD7E8',
                    border: isRec ? '2px solid var(--ok)' : '1px solid var(--line)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden',
                  }}>
                    {/* Crowd fill bar */}
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0,
                      height: `${Math.max(10, c * 100)}%`,
                      background: isRec ? 'var(--ok-light)' : c >= 0.75 ? 'var(--warn-accent)' : 'var(--ink-4)',
                      borderRadius: 'inherit',
                    }} />
                    <span style={{ position: 'relative', fontSize: 11, fontWeight: 800, color: 'var(--ink)' }}>{i + 1}</span>
                  </div>
                );
              })}
            </div>

            {/* Platform zones */}
            <div style={{ display: 'flex', marginTop: 10, gap: 0 }}>
              {['A', 'B', 'C', 'D'].map((zone, zi) => {
                const isRec = quietCar >= (crowding!.length / 4) * zi && quietCar < (crowding!.length / 4) * (zi + 1);
                return (
                  <div key={zone} style={{
                    flex: 1, textAlign: 'center', paddingTop: 6,
                    borderTop: `2px solid ${isRec ? 'var(--ok)' : 'var(--line)'}`,
                  }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: isRec ? 'var(--ok-text)' : 'var(--ink-3)' }}>
                      Zone {zone}{isRec ? ' · here' : ''}
                    </span>
                  </div>
                );
              })}
            </div>
            </>)}
          </div>
        </div>
      )}

      {/* Stops */}
      <div style={{ padding: '0 18px' }}>
        <div className="card" style={{ padding: 16, borderRadius: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span className="eyebrow">STOPS</span>
            {train.delayMinutes > 0 && (
              <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--warn-text)' }}>running +{train.delayMinutes} min</span>
            )}
          </div>

          {stops ? (
            <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {stops.map((s, i) => (
                <li key={`${s.code}-${i}`}>
                  <StopRow stop={s} here={i === hereIdx} last={i === stops.length - 1} isPast={i <= hereIdx} />
                </li>
              ))}
            </ol>
          ) : stopsFailed ? (
            <div role="status" style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: 'var(--ink-3)' }}>
              <span>Stops unavailable</span>
              {trainId && (
                <button onClick={retryStops} style={{
                  padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                  background: 'transparent', border: '1px solid var(--line)', color: 'var(--ink)',
                }}>
                  Retry
                </button>
              )}
            </div>
          ) : (
            <Loader />
          )}
        </div>
      </div>

      {/* Footer actions */}
      <div style={{ padding: '16px 18px', display: 'flex', gap: 10 }}>
        <button onClick={shareEta} style={{
          flex: 1, padding: 14, borderRadius: 13, fontSize: 14, fontWeight: 700,
          background: 'var(--primary)', color: '#FFFFFF', textAlign: 'center',
        }}>
          {copied ? 'Copied to clipboard' : 'Share ETA'}
        </button>
        <span aria-live="polite" className="sr-only">{copied ? 'ETA copied to clipboard' : ''}</span>
      </div>

      <div style={{ height: 80 }} />
    </div>
  );
}

function StopRow({ stop, here, last, isPast }: { stop: IStop; here: boolean; last: boolean; isPast: boolean }) {
  const delayed = new Date(stop.actualTime).getTime() !== new Date(stop.plannedTime).getTime();
  const delayMs = new Date(stop.actualTime).getTime() - new Date(stop.plannedTime).getTime();
  const delayMin = Math.round(delayMs / 60000);

  return (
    <div style={{ display: 'flex', gap: 14, position: 'relative', minHeight: 48 }}>
      {/* Timeline */}
      <div style={{ position: 'relative', width: 20, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {!last && (
          <div style={{
            position: 'absolute', left: '50%', top: 16, bottom: 0, width: 2, marginLeft: -1,
            background: isPast || here ? 'var(--primary)' : 'var(--line)',
          }} />
        )}
        <div style={{
          position: 'relative', marginTop: 6,
          width: here ? 14 : 10, height: here ? 14 : 10, borderRadius: '50%',
          background: here || isPast ? 'var(--primary)' : 'var(--card)',
          border: here ? 'none' : `2px solid ${isPast ? 'var(--primary)' : 'var(--line)'}`,
          boxShadow: here ? '0 0 0 4px var(--primary-tint)' : 'none',
        }} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, paddingBottom: last ? 0 : 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontSize: 14, fontWeight: here ? 800 : 700, color: 'var(--ink)' }}>{stop.name}</span>
          <span className="num" style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink)' }}>{formatTime(stop.actualTime)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
          <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>
            {stop.status === 'ORIGIN' ? 'Departure' : stop.status === 'DESTINATION' ? 'Arrival' : `Track ${stop.track}`}
            {stop.track && stop.status !== 'DESTINATION' ? ` · track ${stop.track}` : ''}
          </span>
          {delayed && delayMin > 0 && (
            <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--warn-text)' }}>+{delayMin} min</span>
          )}
        </div>
      </div>
    </div>
  );
}
