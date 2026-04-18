import { NextResponse } from 'next/server';
import { generateDisruptions } from '../../_utils/mock';

const BASE_URL = 'https://gateway.apiportal.ns.nl';
const API_KEY = process.env.NS_API ?? '';

export async function GET() {
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
      // Return raw disruptions from NS API if available
      return NextResponse.json(data.payload ?? []);
    }
  } catch { /* fall through to mock */ }

  // Fall back to mock disruptions
  return NextResponse.json(generateDisruptions());
}
