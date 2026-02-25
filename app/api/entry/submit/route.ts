import { NextRequest, NextResponse } from "next/server";
import { addEntry } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const code = typeof body.code === "string" ? body.code : "";
    const wordIndex = Number(body.wordIndex);
    const termsRaw = typeof body.termsRaw === "string" ? body.termsRaw : "";

    if (!code || Number.isNaN(wordIndex)) {
      return NextResponse.json(
        { error: "Missing code or word index." },
        { status: 400 }
      );
    }

    if (!termsRaw.trim()) {
      return NextResponse.json(
        { error: "Please enter at least one term." },
        { status: 400 }
      );
    }

    const entry = addEntry({ code, wordIndex, termsRaw });

    return NextResponse.json({ ok: true, entry });
  } catch (error: unknown) {
    console.error(error);
    if (error instanceof Error && error.message === "Session not found") {
      return NextResponse.json(
        { error: "Session not found." },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Failed to submit entry." },
      { status: 500 }
    );
  }
}

