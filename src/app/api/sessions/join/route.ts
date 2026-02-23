import { NextResponse } from "next/server";
import { getSessionByCode } from "@/lib/sessionStore";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const code = String(body.code ?? "").trim().toUpperCase();
    if (!code) {
      return NextResponse.json({ error: "Session code required" }, { status: 400 });
    }
    const session = getSessionByCode(code);
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    return NextResponse.json({ session });
  } catch (e) {
    return NextResponse.json({ error: "Failed to join session" }, { status: 500 });
  }
}
