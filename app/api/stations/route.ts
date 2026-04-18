import { NextRequest, NextResponse } from "next/server";
import { getStationCodes } from "../../_utils/api";
import { rateLimit, getClientIp } from "../../_lib/rateLimit";

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const { allowed } = rateLimit(ip);
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const q = req.nextUrl.searchParams.get("q") ?? "";
  if (q.length < 2) return NextResponse.json([]);
  const stations = await getStationCodes(q);
  return NextResponse.json(stations);
}
