'use client';

import React from 'react';

interface DemoDataBannerProps {
  onRetry: () => void;
}

export default function DemoDataBanner({ onRetry }: DemoDataBannerProps) {
  return (
    <div role="status" style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '8px 12px', borderRadius: 12,
      background: 'var(--warn-tint)', border: '1px solid var(--warn-border)',
    }}>
      <span style={{
        padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 800,
        letterSpacing: '0.06em', background: 'var(--warn-text)', color: 'var(--card)',
        flexShrink: 0,
      }}>
        DEMO DATA
      </span>
      <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: 'var(--warn-text)' }}>
        Live departures unavailable.
      </span>
      <button onClick={onRetry} style={{
        padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700,
        background: 'transparent', border: '1px solid var(--warn-border)',
        color: 'var(--warn-text)', flexShrink: 0,
      }}>
        Retry
      </button>
    </div>
  );
}
