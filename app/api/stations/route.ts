import { NextRequest, NextResponse } from "next/server";
import { getStationCodes } from "../../_utils/api";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  if (q.length < 2) return NextResponse.json([]);
  const stations = await getStationCodes(q);
  return NextResponse.json(stations);
}
