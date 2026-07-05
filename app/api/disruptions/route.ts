import { NextRequest, NextResponse } from 'next/server';
import { generateDisruptions, project } from '../../_utils/mock';
import { IDisruption } from '../../interfaces/interfaces';
import { rateLimit, getClientIp } from '../../_lib/rateLimit';

const BASE_URL = 'https://gateway.apiportal.ns.nl';
const API_KEY = process.env.NS_API ?? '';
const MAX_ITEMS = 8;

interface NsStation {
  coordinate?: { lat: number; lng: number };
  countryCode?: string;
  stationCode?: string;
}

interface NsDisruption {
  id: string;
  type: string; // DISRUPTION | CALAMITY | MAINTENANCE
  title: string;
  expectedDuration?: { description?: string };
  publicationSections?: { section?: { stations?: NsStation[] } }[];
  timespans?: {
    situation?: { label?: string };
    additionalTravelTime?: { shortLabel?: string };
  }[];
}

function toDisruption(d: NsDisruption): IDisruption {
  const stations = d.publicationSections?.[0]?.section?.stations ?? [];
  const withCoords = stations.filter(s => s.coordinate);
  const domestic = withCoords.filter(s => s.countryCode === 'NL');
  const pool = domestic.length > 0 ? domestic : withCoords;
  const mid = pool[Math.floor(pool.length / 2)];
  const timespan = d.timespans?.[0];
  const severe = d.type === 'DISRUPTION' || d.type === 'CALAMITY';

  return {
    id: d.id,
    type: severe ? 'storm' : 'fog',
    label: d.title.replace(/\.$/, ''),
    center: mid?.coordinate ? project(mid.coordinate.lat, mid.coordinate.lng) : { x: 0.5, y: 0.5 },
    radius: 0.1,
    severity: severe ? 0.8 : 0.45,
    lines: pool.length >= 2
      ? [`${pool[0].stationCode ?? '?'} → ${pool[pool.length - 1].stationCode ?? '?'}`]
      : [],
    impact: timespan?.additionalTravelTime?.shortLabel ?? '',
    message: timespan?.situation?.label ?? d.expectedDuration?.description ?? d.title,
  };
}

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const { allowed } = rateLimit(ip);
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const res = await fetch(
      `${BASE_URL}/reisinformatie-api/api/v3/disruptions?isActive=true`,
      {
        headers: { 'Ocp-Apim-Subscription-Key': API_KEY },
        next: { revalidate: 60 },
      }
    );

    if (res.ok) {
      const data: NsDisruption[] = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return NextResponse.json(data.slice(0, MAX_ITEMS).map(toDisruption));
      }
    }
  } catch { /* fall through to mock */ }

  return NextResponse.json(generateDisruptions());
}
