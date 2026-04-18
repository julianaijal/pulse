import { NextRequest, NextResponse } from 'next/server';
import { generateDisruptions } from '../../_utils/mock';
import { rateLimit, getClientIp } from '../../_lib/rateLimit';

const BASE_URL = 'https://gateway.apiportal.ns.nl';
const API_KEY = process.env.NS_API ?? '';

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const { allowed } = rateLimit(ip);
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const res = await fetch(
      `${BASE_URL}/reisinformatie-api/api/v2/disruptions?isActive=true`,
      {
        headers: { 'Ocp-Apim-Subscription-Key': API_KEY },
        next: { revalidate: 60 },
      }
    );

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data.payload ?? []);
    }
  } catch { /* fall through to mock */ }

  return NextResponse.json(generateDisruptions());
}
