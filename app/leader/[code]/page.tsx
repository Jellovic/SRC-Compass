"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import type {
  AggregatedResults,
  AnalysisResult,
  ClusterLayoutItem,
} from "@/lib/store";
import { WordMap } from "@/components/WordMap";

type ResultsResponse = AggregatedResults;

export default function LeaderPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const router = useRouter();
  const { code: rawCode } = use(params);
  const code = rawCode.toUpperCase();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ResultsResponse | null>(null);

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [analysis, setAnalysis] = useState<Record<number, AnalysisResult & { fallbackReason?: string }>>({});
  const [analyzingIndex, setAnalyzingIndex] = useState<number | null>(null);

  async function loadResults() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/results/${code}`);
      const contentType = res.headers.get("content-type") ?? "";
      let data: ResultsResponse | null = null;

      if (contentType.includes("application/json")) {
        try {
          data = (await res.json()) as ResultsResponse;
        } catch {
          // ignore parse errors; handled below
        }
      }

      if (!res.ok || !data) {
        setError("Failed to load results.");
        return;
      }
      setResults(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load results.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  async function handleAnalyze(wordIndex: number) {
    setAnalyzingIndex(wordIndex);
    setError(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, wordIndex }),
      });
      const contentType = res.headers.get("content-type") ?? "";
      let data: (AnalysisResult & { fallbackReason?: string }) | { error?: string } | null = null;

      if (contentType.includes("application/json")) {
        try {
          data = (await res.json()) as (AnalysisResult & { fallbackReason?: string }) | { error?: string };
        } catch {
          // ignore parse errors; handled below
        }
      }

      if (!res.ok || !data || "error" in data) {
        setError(
          (data && "error" in data && data.error) || "Analysis failed."
        );
        return;
      }

      setAnalysis((prev) => ({ ...prev, [wordIndex]: data as AnalysisResult & { fallbackReason?: string } }));
      setSelectedIndex(wordIndex);
    } catch (err) {
      console.error(err);
      setError("Analysis failed. Please try again.");
    } finally {
      setAnalyzingIndex(null);
    }
  }

  const selectedWord =
    selectedIndex != null && results
      ? results.words[selectedIndex]
      : undefined;
  const selectedAnalysis =
    selectedIndex != null ? analysis[selectedIndex] : undefined;

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-6 py-16">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="mb-1 inline-flex w-fit items-center text-xs text-zinc-500 hover:text-zinc-800"
            >
              ← Back
            </button>
            <h1 className="text-2xl font-semibold tracking-tight">
              Leader dashboard
            </h1>
            {results && (
              <p className="text-xs uppercase tracking-wide text-zinc-500">
                Session {results.session.name || "untitled"} · Code{" "}
                {results.session.code}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={loadResults}
            className="inline-flex items-center justify-center rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 hover:border-zinc-500"
          >
            Refresh results
          </button>
        </div>

        {loading && (
          <p className="text-sm text-zinc-600">Loading results…</p>
        )}

        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        {results && (
          <div className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            <section className="space-y-4 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-zinc-800">
                Words and responses
              </h2>
              <div className="space-y-3">
                {results.words.map((w) => (
                  <div
                    key={w.index}
                    className={`rounded-md border px-3 py-2 text-sm ${
                      selectedIndex === w.index
                        ? "border-zinc-900 bg-zinc-900/5"
                        : "border-zinc-200 bg-zinc-50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{w.word}</p>
                        <p className="text-xs text-zinc-500">
                          {w.terms.reduce((sum, t) => sum + t.count, 0)} total
                          {" · "}
                          {w.terms.length} unique terms
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAnalyze(w.index)}
                        disabled={analyzingIndex === w.index}
                        className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
                      >
                        {analyzingIndex === w.index ? "Analyzing…" : "Analyze"}
                      </button>
                    </div>
                    {w.terms.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1 text-[11px] text-zinc-600">
                        {w.terms.slice(0, 8).map((t) => (
                          <span
                            key={t.term}
                            className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5"
                          >
                            {t.term}
                            <span className="ml-1 text-[10px] text-zinc-400">
                              ×{t.count}
                            </span>
                          </span>
                        ))}
                        {w.terms.length > 8 && (
                          <span className="text-[10px] text-zinc-400">
                            +{w.terms.length - 8} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            <section className="flex flex-col rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
              <h2 className="mb-2 text-sm font-semibold text-zinc-800">
                Word map
              </h2>
              {!selectedWord && (
                <p className="text-sm text-zinc-500">
                  Choose a word on the left and run analysis to see clusters.
                </p>
              )}
              {selectedWord && !selectedAnalysis && (
                <p className="text-sm text-zinc-500">
                  Analysis not yet run for <strong>{selectedWord.word}</strong>.
                  Click &quot;Analyze&quot; to generate a map.
                </p>
              )}
              {selectedWord && selectedAnalysis && (
                <div className="flex flex-1 flex-col gap-3">
                  <div>
                    <p className="text-sm font-medium">{selectedWord.word}</p>
                    <p className="text-xs text-zinc-500">
                      Clusters are approximate groupings based on meaning. They
                      are anonymous and aggregated.
                    </p>
                    {"fallbackReason" in selectedAnalysis && selectedAnalysis.fallbackReason && (
                      <p className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1.5" role="status">
                        {selectedAnalysis.fallbackReason}
                      </p>
                    )}
                  </div>
                  <div className="flex-1 rounded-md border border-zinc-200 bg-zinc-50 p-2">
                    <WordMap
                      layout={
                        selectedAnalysis.layout as unknown as ClusterLayoutItem[]
                      }
                    />
                  </div>
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

