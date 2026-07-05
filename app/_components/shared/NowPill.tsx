'use client';

import React, { useState, useEffect } from 'react';
import { formatTime } from '../../_utils/format';

interface NowPillProps {
  label?: string;
}

export default function NowPill({ label }: NowPillProps) {
  const [time, setTime] = useState('');

  useEffect(() => {
    const fmt = () => formatTime(new Date());
    const rafId = requestAnimationFrame(() => setTime(fmt()));
    const id = setInterval(() => setTime(fmt()), 15000);
    return () => { cancelAnimationFrame(rafId); clearInterval(id); };
  }, []);

  return (
    <span className="now-pill">
      <span className="dot live" /> {label ?? time}
    </span>
  );
}
