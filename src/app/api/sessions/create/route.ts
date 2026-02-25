import { NextResponse } from "next/server";
import { createSession } from "@/lib/sessionStore";
import { wordsFromLabels } from "@/lib/seedData";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const raw =
      typeof body.words === "string"
        ? body.words
        : Array.isArray(body.words)
          ? body.words.join("\n")
          : "";
    const labels = raw
      .split(/[\n,]/)
      .map((s: string) => s.trim())
      .filter(Boolean);
    if (!name) {
      return NextResponse.json({ error: "Session name required" }, { status: 400 });
    }
    if (labels.length === 0) {
      return NextResponse.json({ error: "Enter at least one word" }, { status: 400 });
    }
    const words = wordsFromLabels(labels);
    const { session, code } = createSession(name, words);
    return NextResponse.json({ session, code });
  } catch (e) {
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }
}
