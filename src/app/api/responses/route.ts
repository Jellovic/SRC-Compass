import { NextResponse } from "next/server";
import { addResponse, getResponses } from "@/lib/sessionStore";
import type { Response } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const r: Response = await request.json();
    if (!r.sessionId || !r.participantId || !r.participantName || r.wordId == null || r.anchorIndex == null || !r.referentId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    r.timestamp = Date.now();
    addResponse(r);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Failed to save response" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  }
  const list = getResponses(sessionId);
  return NextResponse.json({ responses: list });
}
