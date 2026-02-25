import { NextRequest, NextResponse } from "next/server";
import { getSessionByCode } from "@/lib/store";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ code: string }> }
) {
  const { code } = await context.params;
  const session = getSessionByCode(code.toUpperCase());
  if (!session) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  return NextResponse.json({
    session,
  });
}

