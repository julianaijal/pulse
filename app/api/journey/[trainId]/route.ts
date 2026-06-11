import { NextRequest, NextResponse } from 'next/server';
import { IStop } from '../../../interfaces/interfaces';
import { rateLimit, getClientIp } from '../../../_lib/rateLimit';

const BASE_URL = 'https://gateway.apiportal.ns.nl';
const API_KEY = process.env.NS_API ?? '';
const TRAIN_RE = /^\d{1,6}$/;

interface NsJourneyEvent {
  plannedTime?: string;
  actualTime?: string;
  plannedTrack?: string;
  actualTrack?: string;
}

interface NsJourneyStop {
  id: string;
  stop: { name: string };
  status: string;
  arrivals?: NsJourneyEvent[];
  departures?: NsJourneyEvent[];
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ trainId: string }> }
) {
  const ip = getClientIp(req);
  const { allowed } = rateLimit(ip);
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const { trainId } = await params;
  if (!TRAIN_RE.test(trainId)) {
    return NextResponse.json({ error: 'Invalid train number' }, { status: 400 });
  }

  try {
    const res = await fetch(
      `${BASE_URL}/reisinformatie-api/api/v2/journey?train=${encodeURIComponent(trainId)}`,
      {
        headers: { 'Ocp-Apim-Subscription-Key': API_KEY },
        next: { revalidate: 60 },
      }
    );

    if (!res.ok) {
      return NextResponse.json([], { status: res.status });
    }

    const data = await res.json();
    const raw: NsJourneyStop[] = data.payload?.stops ?? [];

    const stops: IStop[] = [];
    for (const s of raw) {
      if (s.status === 'PASSING') continue;
      const event = s.departures?.[0] ?? s.arrivals?.[0];
      if (!event?.plannedTime) continue;

      stops.push({
        code: s.id.split('_')[0].toUpperCase(),
        name: s.stop.name,
        plannedTime: event.plannedTime,
        actualTime: event.actualTime ?? event.plannedTime,
        track: event.actualTrack ?? event.plannedTrack ?? '',
        status:
          s.status === 'ORIGIN' || s.status === 'DESTINATION'
            ? s.status
            : 'STOP',
      });
    }

    return NextResponse.json(stops);
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}
