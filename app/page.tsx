'use client';

import React, { useState, useEffect } from 'react';
import { IDeparture, ITweaks } from './interfaces/interfaces';
import { ACCENT_MAP } from './_components/TweaksPanel';
import TabBar from './_components/TabBar';
import TweaksPanel from './_components/TweaksPanel';
import RhythmView from './_components/views/RhythmView';
import PulseView from './_components/views/PulseView';
import JourneyView from './_components/views/JourneyView';
import StationView, { StationSearch } from './_components/views/StationView';
import { IconTweaks } from './_components/icons/Icons';

type Tab = 'rhythm' | 'pulse' | 'journey' | 'station' | 'search';

interface StationObj {
  code: string;
  name: string;
  lat?: number;
  lng?: number;
}

const TWEAK_DEFAULTS: ITweaks = {
  theme: 'light',
  verbosity: 'rich',
  crowdingStyle: 'bars',
  accent: 'orange',
};

function loadTweaks(): ITweaks {
  if (typeof window === 'undefined') return TWEAK_DEFAULTS;
  return {
    theme: (localStorage.getItem('pulse.theme') as ITweaks['theme']) ?? TWEAK_DEFAULTS.theme,
    verbosity: (localStorage.getItem('pulse.verbosity') as ITweaks['verbosity']) ?? TWEAK_DEFAULTS.verbosity,
    crowdingStyle: (localStorage.getItem('pulse.crowdingStyle') as ITweaks['crowdingStyle']) ?? TWEAK_DEFAULTS.crowdingStyle,
    accent: (localStorage.getItem('pulse.accent') as ITweaks['accent']) ?? TWEAK_DEFAULTS.accent,
  };
}

export default function Home() {
  const [tweaks, setTweaks] = useState<ITweaks>(TWEAK_DEFAULTS);
  const [tab, setTab] = useState<Tab>('rhythm');
  const [journey, setJourney] = useState<IDeparture | null>(null);
  const [station, setStation] = useState<StationObj | null>(null);
  const [showTweaks, setShowTweaks] = useState(false);

  // Hydrate from localStorage after mount
  useEffect(() => {
    setTweaks(loadTweaks());
    const saved = localStorage.getItem('pulse.tab') as Tab | null;
    if (saved && ['rhythm', 'pulse', 'journey', 'station', 'search'].includes(saved)) {
      setTab(saved);
    }
  }, []);

  // Persist tab
  useEffect(() => {
    localStorage.setItem('pulse.tab', tab);
  }, [tab]);

  // Apply theme and accent to document
  useEffect(() => {
    document.documentElement.dataset.theme = tweaks.theme;
    document.documentElement.style.setProperty('--accent', ACCENT_MAP[tweaks.accent] ?? ACCENT_MAP.orange);
  }, [tweaks.theme, tweaks.accent]);

  const updateTweak = (key: keyof ITweaks, value: string) => {
    setTweaks(t => ({ ...t, [key]: value }));
    localStorage.setItem(`pulse.${key}`, value);
  };

  const openJourney = (train: IDeparture) => {
    setJourney(train);
    setTab('journey');
  };

  const openStation = (s: StationObj) => {
    setStation(s);
    setTab('station');
  };

  let content: React.ReactNode;
  if (tab === 'rhythm') {
    content = <RhythmView tweaks={tweaks} onOpenJourney={openJourney} onOpenStation={openStation} />;
  } else if (tab === 'pulse') {
    content = <PulseView tweaks={tweaks} onOpenJourney={openJourney} onOpenStation={openStation} />;
  } else if (tab === 'journey') {
    content = <JourneyView train={journey} tweaks={tweaks} onBack={() => setTab('rhythm')} />;
  } else if (tab === 'station') {
    content = <StationView station={station} tweaks={tweaks} onBack={() => setTab('pulse')} onOpenJourney={openJourney} />;
  } else if (tab === 'search') {
    content = <StationSearch onBack={() => setTab('rhythm')} onPick={openStation} />;
  }

  // Map tab to TabBar's tab type (station → pulse for active state purposes)
  const activeTab = (tab === 'station' ? 'pulse' : tab) as 'rhythm' | 'pulse' | 'journey' | 'search';

  return (
    <>
      {content}

      <TabBar
        tab={activeTab}
        hasJourney={journey !== null}
        onTabChange={(t) => {
          if (t === 'search') { setStation(null); setTab('search'); }
          else setTab(t);
        }}
      />

      {/* Tweaks toggle */}
      <button
        onClick={() => setShowTweaks(v => !v)}
        style={{
          position: 'fixed',
          bottom: `calc(80px + env(safe-area-inset-bottom))`,
          right: 12,
          width: 36, height: 36,
          background: 'var(--bg-2)', border: '1px solid var(--line)',
          borderRadius: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--ink-2)', zIndex: 60,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}
        aria-label="Open tweaks"
      >
        <IconTweaks style={{ width: 16, height: 16 }} />
      </button>

      {showTweaks && (
        <TweaksPanel tweaks={tweaks} onChange={updateTweak} onClose={() => setShowTweaks(false)} />
      )}
    </>
  );
}
