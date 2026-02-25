import { NextRequest, NextResponse } from "next/server";
import {
  getAggregatedResultsByCode,
  getCachedAnalysis,
  setCachedAnalysis,
  type AnalysisResult,
  type TermCluster,
  type ClusterLayoutItem,
} from "@/lib/store";

function buildGridLayout(clusters: TermCluster[]): ClusterLayoutItem[] {
  const n = clusters.length;
  if (n === 0) return [];

  const cols = Math.ceil(Math.sqrt(n));
  const rows = Math.ceil(n / cols);

  const items: ClusterLayoutItem[] = [];

  clusters.forEach((cluster, clusterIndex) => {
    const row = Math.floor(clusterIndex / cols);
    const col = clusterIndex % cols;

    const cellWidth = 1 / cols;
    const cellHeight = 1 / rows;

    const cellX0 = col * cellWidth;
    const cellY0 = row * cellHeight;

    const cx = cellX0 + cellWidth / 2;
    const cy = cellY0 + cellHeight / 2;

    const radius = Math.min(cellWidth, cellHeight) * 0.3;

    const terms = cluster.terms;
    const count = terms.length || 1;

    terms.forEach((term, i) => {
      const angle = (2 * Math.PI * i) / count;
      const r = radius * (0.4 + 0.6 * ((i % 3) / 3));
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);

      items.push({
        term,
        x: Math.min(0.95, Math.max(0.05, x)),
        y: Math.min(0.95, Math.max(0.05, y)),
        clusterLabel: cluster.label,
        clusterIndex,
      });
    });
  });

  return items;
}

async function callClusteringLLM(word: string, terms: string[]) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const prompt = {
    role: "user" as const,
    content: [
      {
        type: "text" as const,
        text:
          "You are helping a facilitator understand how people relate to a word.\n" +
          "Group the following terms into 3–8 clusters by meaning. Clusters should reflect semantic similarity (e.g. 'construction/engineering', 'spatial philosophy', 'social norms').\n" +
          "Return ONLY valid JSON in this shape, with no extra commentary:\n" +
          '{\"clusters\":[{\"label\":\"short human label\",\"terms\":[\"term1\",\"term2\"]}]}\n\n' +
          `Base word: ${word}\n` +
          `Terms: ${terms.join(", ")}`,
      },
    ],
  };

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You cluster short word lists into semantic groups. Always respond with strict JSON that matches the requested TypeScript type.",
        },
        prompt,
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("OpenAI error", text);
    try {
      const errBody = JSON.parse(text) as { error?: { code?: string } };
      const code = errBody?.error?.code;
      if (code === "invalid_api_key") throw new Error("OPENAI_INVALID_API_KEY");
      if (code === "insufficient_quota") throw new Error("OPENAI_INSUFFICIENT_QUOTA");
    } catch (e) {
      if (e instanceof Error && /^OPENAI_/.test(e.message)) throw e;
    }
    throw new Error("Failed to call OpenAI");
  }

  const json = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = json.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("No content from OpenAI");
  }

  let parsed: { clusters: TermCluster[] };
  try {
    parsed = JSON.parse(content);
  } catch (err) {
    console.error("Failed to parse OpenAI JSON", err, content);
    throw new Error("Failed to parse analysis JSON");
  }

  if (!Array.isArray(parsed.clusters) || parsed.clusters.length === 0) {
    throw new Error("Invalid clusters from OpenAI");
  }

  return parsed.clusters;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const code = typeof body.code === "string" ? body.code.toUpperCase() : "";
    const wordIndex = Number(body.wordIndex);

    if (!code || Number.isNaN(wordIndex)) {
      return NextResponse.json(
        { error: "Missing code or word index." },
        { status: 400 }
      );
    }

    const aggregated = getAggregatedResultsByCode(code);
    const session = aggregated.session;
    const wordResult = aggregated.words[wordIndex];
    if (!wordResult) {
      return NextResponse.json(
        { error: "Word index out of range." },
        { status: 400 }
      );
    }

    const allTerms = wordResult.terms.map((t) => t.term);
    if (allTerms.length === 0) {
      return NextResponse.json(
        { error: "No terms submitted yet for this word." },
        { status: 400 }
      );
    }

    const cached = getCachedAnalysis(session.id, wordIndex);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Fallback: one cluster with all terms when API is unavailable (no key, invalid key, or quota).
    const fallbackResult = (reason: string) => {
      const clusters: TermCluster[] = [
        { label: "All terms", terms: allTerms },
      ];
      const layout = buildGridLayout(clusters);
      const result: AnalysisResult = { clusters, layout };
      setCachedAnalysis(session.id, wordIndex, result);
      return NextResponse.json({ ...result, fallbackReason: reason });
    };

    let clusters: TermCluster[];
    try {
      // LLM-based clustering (Option B). Swap in embeddings + k-means here if desired.
      clusters = await callClusteringLLM(wordResult.word, allTerms);
    } catch (apiError: unknown) {
      const msg = apiError instanceof Error ? apiError.message : "";
      if (msg === "OPENAI_INSUFFICIENT_QUOTA") {
        return fallbackResult(
          "OpenAI quota exceeded. Add billing at https://platform.openai.com/account/billing to get semantic clusters. Showing all terms in one group."
        );
      }
      if (msg === "OPENAI_INVALID_API_KEY" || msg.includes("OPENAI_API_KEY")) {
        return fallbackResult(
          "OpenAI API key missing or invalid. Set OPENAI_API_KEY in .env.local and restart to get semantic clusters. Showing all terms in one group."
        );
      }
      // Any other API failure: still show a map
      console.error(apiError);
      return fallbackResult(
        "Clustering API failed. Showing all terms in one group."
      );
    }

    const layout = buildGridLayout(clusters);
    const result: AnalysisResult = { clusters, layout };
    setCachedAnalysis(session.id, wordIndex, result);
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to analyze word." },
      { status: 500 }
    );
  }
}

