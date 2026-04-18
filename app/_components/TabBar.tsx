'use client';

import React from 'react';
import { IconRhythm, IconPulse, IconJourney, IconSearch } from './icons/Icons';

type Tab = 'rhythm' | 'pulse' | 'journey' | 'search';

interface TabBarProps {
  tab: Tab;
  hasJourney: boolean;
  onTabChange: (tab: Tab) => void;
}

const TABS: { id: Tab; label: string; Icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }[] = [
  { id: 'rhythm',  label: 'Rhythm',  Icon: IconRhythm  },
  { id: 'pulse',   label: 'Pulse',   Icon: IconPulse   },
  { id: 'journey', label: 'Journey', Icon: IconJourney },
  { id: 'search',  label: 'Search',  Icon: IconSearch  },
];

export default function TabBar({ tab, hasJourney, onTabChange }: TabBarProps) {
  return (
    <nav className="tabbar" aria-label="Main navigation">
      <div role="tablist">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            role="tab"
            id={`tab-${id}`}
            aria-selected={tab === id}
            aria-controls="main-content"
            data-active={tab === id}
            onClick={() => onTabChange(id === 'journey' ? (hasJourney ? 'journey' : 'rhythm') : id)}
          >
            <Icon aria-hidden="true" /><span>{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
