'use client';

import React from 'react';

interface CrowdingStripProps {
  crowding: number[];
  variant?: 'hero' | 'card' | 'journey';
  size?: 'sm' | 'md';
  recommendedCar?: number;
}

export default function CrowdingStrip({ crowding, variant = 'card', size = 'md', recommendedCar }: CrowdingStripProps) {
  const h = size === 'sm' ? 14 : variant === 'hero' ? 22 : 19;
  const srSummary = crowding.map((c, i) =>
    `car ${i + 1} ${c < 0.4 ? 'quiet' : c < 0.75 ? 'moderate' : 'busy'}`
  ).join(', ');

  return (
    <div>
      <span className="sr-only">Carriage occupancy: {srSummary}</span>
      <div style={{ display: 'flex', gap: 4 }}>
        {crowding.map((c, i) => {
          const isRec = recommendedCar === i;
          let bg: string;
          let border: string | undefined;

          if (variant === 'hero') {
            if (isRec) { bg = '#2FCB82'; border = '2px solid #7FE0AE'; }
            else if (c >= 0.75) { bg = '#FFB300'; }
            else { bg = `rgba(255,255,255,${0.28 + c * 0.17})`; }
          } else {
            if (isRec) { bg = '#2FCB82'; border = '2px solid #0E9F5B'; }
            else if (c >= 0.75) { bg = '#E88A00'; }
            else if (c >= 0.4) { bg = '#8FA3BE'; }
            else { bg = '#CBD7E8'; }
          }

          return (
            <div key={i} style={{
              flex: 1, height: h, borderRadius: 6,
              background: bg,
              border: border ?? 'none',
            }} />
          );
        })}
      </div>
    </div>
  );
}
