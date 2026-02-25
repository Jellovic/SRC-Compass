import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = typeof body.name === "string" ? body.name : "";
    const wordsRaw = typeof body.wordsRaw === "string" ? body.wordsRaw : "";

    if (!wordsRaw.trim()) {
      return NextResponse.json(
        { error: "Please provide at least one word." },
        { status: 400 }
      );
    }

    const session = createSession(name, wordsRaw);

    return NextResponse.json({
      code: session.code,
      session,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create session." },
      { status: 500 }
    );
  }
}

