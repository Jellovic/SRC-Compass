import { NextResponse } from "next/server";
import { createSession } from "@/lib/sessionStore";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const wordSet = body.wordSet === "default" ? "default" : "default";
    if (!name) {
      return NextResponse.json({ error: "Session name required" }, { status: 400 });
    }
    const { session, code } = createSession(name, wordSet);
    return NextResponse.json({ session, code });
  } catch (e) {
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }
}
