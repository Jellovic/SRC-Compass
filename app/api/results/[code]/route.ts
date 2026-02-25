import { NextRequest, NextResponse } from "next/server";
import { getAggregatedResultsByCode } from "@/lib/store";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await context.params;
    const results = getAggregatedResultsByCode(code.toUpperCase());
    return NextResponse.json(results);
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Session not found") {
      return NextResponse.json(
        { error: "Session not found." },
        { status: 404 }
      );
    }
    console.error(error);
    return NextResponse.json(
      { error: "Failed to load results." },
      { status: 500 }
    );
  }
}

