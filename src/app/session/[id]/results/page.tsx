"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Session } from "@/lib/types";
import type { WordAggregate } from "@/lib/aggregate";
import { aggregateByWord } from "@/lib/aggregate";
import type { Response } from "@/lib/types";

type DetailCell = { wordLabel: string; type: "ladder" | "referent" } | null;

/** Grayscale color for divergence 0..1 (0=light, 1=dark) */
function divergenceToRgb(d: number): string {
  const v = Math.round(255 * (1 - d));
  return `rgb(${v},${v},${v})`;
}

export default function ResultsPage() {
  const params = useParams();
  const sessionId = String(params.id);
  const [session, setSession] = useState<Session | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [facilitationMode, setFacilitationMode] = useState(false);
  const [detailCell, setDetailCell] = useState<DetailCell>(null);
  const heatmapRef = useRef<HTMLCanvasElement>(null);

  const load = useCallback(() => {
    Promise.all([
      fetch(`/api/sessions/${sessionId}`).then((r) => r.json()),
      fetch(`/api/responses?sessionId=${encodeURIComponent(sessionId)}`).then((r) => r.json()),
    ]).then(([sessionRes, responsesRes]) => {
      if (sessionRes.session) setSession(sessionRes.session);
      if (responsesRes.responses) setResponses(responsesRes.responses);
    });
  }, [sessionId]);

  useEffect(() => {
    load();
  }, [load]);

  const aggregates: WordAggregate[] = session
    ? aggregateByWord(responses, session.words)
    : [];
  const wordLabels = aggregates.map((a) => a.wordLabel);

  // Draw heatmap on canvas when data or size changes
  useEffect(() => {
    if (aggregates.length === 0 || !heatmapRef.current) return;
    const canvas = heatmapRef.current;
    const dpr = window.devicePixelRatio ?? 1;
    const cellW = 80;
    const cellH = 44;
    const headerH = 28;
    const rowLabelW = 100;
    const colLabelH = 24;
    const cols = 2;
    const rows = aggregates.length;
    const w = rowLabelW + cols * cellW;
    const h = colLabelH + headerH + rows * cellH;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);

    ctx.fillStyle = "#fafaf9";
    ctx.fillRect(0, 0, w, h);

    ctx.font = "12px system-ui, sans-serif";
    ctx.fillStyle = "#57534e";
    ctx.fillText("Ladder (A)", rowLabelW + cellW * 0.5 - 24, colLabelH - 6);
    ctx.fillText("Referent (B)", rowLabelW + cellW * 1.5 - 28, colLabelH - 6);

    for (let r = 0; r < rows; r++) {
      const y = colLabelH + headerH + r * cellH;
      ctx.fillStyle = "#44403c";
      ctx.fillText(wordLabels[r], 4, y + cellH / 2 + 4);
      for (let c = 0; c < cols; c++) {
        const x = rowLabelW + c * cellW;
        const div = c === 0 ? aggregates[r].ladderDivergence : aggregates[r].referentDivergence;
        ctx.fillStyle = divergenceToRgb(div);
        ctx.fillRect(x + 2, y + 2, cellW - 4, cellH - 4);
        ctx.strokeStyle = "#d6d3d1";
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 2, y + 2, cellW - 4, cellH - 4);
        ctx.fillStyle = div > 0.5 ? "#fafaf9" : "#44403c";
        ctx.fillText(div.toFixed(2), x + cellW / 2 - 10, y + cellH / 2 + 4);
      }
    }
  }, [aggregates, wordLabels]);

  function downloadHeatmapPng() {
    if (!heatmapRef.current) return;
    const a = document.createElement("a");
    a.download = `heatmap-${sessionId.slice(0, 8)}.png`;
    a.href = heatmapRef.current.toDataURL("image/png");
    a.click();
  }

  function openDetail(wordLabel: string, type: "ladder" | "referent") {
    setDetailCell({ wordLabel, type });
  }

  if (!session) {
    return (
      <main className="mx-auto max-w-lg px-6 py-16">
        <p className="text-stone-600">Loading…</p>
      </main>
    );
  }

  const detailAgg = detailCell
    ? aggregates.find((a) => a.wordLabel === detailCell.wordLabel)
    : null;
  const detailWord = detailCell
    ? session.words.find((w) => w.label === detailCell.wordLabel)
    : null;

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-stone-800">Results</h1>
        <a
          href={`/session/${sessionId}`}
          className="text-stone-500 underline hover:text-stone-700"
        >
          ← Session
        </a>
      </div>

      <div className="mt-6 flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-stone-600">
          <input
            type="checkbox"
            checked={facilitationMode}
            onChange={(e) => setFacilitationMode(e.target.checked)}
            className="rounded border-stone-300"
          />
          Facilitation mode (hide names, show only aggregates)
        </label>
      </div>

      <p className="mt-4 text-sm text-stone-500">
        Click a cell to see distribution. 0 = full agreement, 1 = max divergence.
      </p>

      <div className="mt-6 overflow-x-auto">
        <canvas
          ref={heatmapRef}
          className="cursor-pointer border border-stone-200 bg-stone-50"
          onClick={(e) => {
            const canvas = heatmapRef.current;
            if (!canvas || aggregates.length === 0) return;
            const rect = canvas.getBoundingClientRect();
            const cellW = 80;
            const cellH = 44;
            const rowLabelW = 100;
            const colLabelH = 24;
            const headerH = 28;
            const x = e.clientX - rect.left - rowLabelW;
            const y = e.clientY - rect.top - colLabelH - headerH;
            const col = Math.floor(x / cellW);
            const row = Math.floor(y / cellH);
            if (row >= 0 && row < aggregates.length && col >= 0 && col < 2 && x >= 0 && y >= 0) {
              openDetail(wordLabels[row], col === 0 ? "ladder" : "referent");
            }
          }}
        />
      </div>

      <button
        type="button"
        onClick={downloadHeatmapPng}
        className="mt-4 rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
      >
        Download heatmap as PNG
      </button>

      {/* Participant list (hidden in facilitation mode) */}
      {!facilitationMode && responses.length > 0 && (
        <div className="mt-8 border-t border-stone-200 pt-6">
          <h2 className="text-sm font-medium text-stone-600">Participants</h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {Array.from(
              new Set(responses.map((r) => r.participantName))
            ).map((name) => (
              <li key={name} className="text-sm text-stone-700">
                {name}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Detail modal */}
      {detailCell && detailAgg && detailWord && (
        <DetailModal
          wordLabel={detailCell.wordLabel}
          type={detailCell.type}
          aggregate={detailAgg}
          word={detailWord}
          onClose={() => setDetailCell(null)}
        />
      )}
    </main>
  );
}

function DetailModal({
  wordLabel,
  type,
  aggregate,
  word,
  onClose,
}: {
  wordLabel: string;
  type: "ladder" | "referent";
  aggregate: WordAggregate;
  word: { anchors: readonly string[]; referents: { id: string; label: string; imageUrl: string }[] };
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-lg bg-white p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-stone-800">
          “{wordLabel}” — {type === "ladder" ? "Ladder (A)" : "Referent (B)"}
        </h3>
        {type === "ladder" && (
          <div className="mt-4 space-y-2">
            {word.anchors.map((label, i) => {
              const count = aggregate.ladderCounts[i] ?? 0;
              const total = aggregate.ladderCounts.reduce((a, b) => a + b, 0);
              const pct = total > 0 ? (100 * count) / total : 0;
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-32 text-sm text-stone-600">{label}</span>
                  <div className="h-6 flex-1 overflow-hidden rounded bg-stone-100">
                    <div
                      className="h-full bg-stone-600"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-stone-700">{count}</span>
                </div>
              );
            })}
          </div>
        )}
        {type === "referent" && (
          <div className="mt-4 grid grid-cols-3 gap-3">
            {word.referents.map((ref) => {
              const count =
                aggregate.referentCounts.find((r) => r.referentId === ref.id)?.count ?? 0;
              return (
                <div
                  key={ref.id}
                  className="overflow-hidden rounded-lg border border-stone-200"
                >
                  <img
                    src={ref.imageUrl}
                    alt={ref.label}
                    className="h-20 w-full object-cover"
                  />
                  <p className="bg-stone-50 py-1 text-center text-sm font-medium text-stone-700">
                    {count} {count === 1 ? "vote" : "votes"}
                  </p>
                </div>
              );
            })}
          </div>
        )}
        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-lg bg-stone-800 py-2 text-white hover:bg-stone-700"
        >
          Close
        </button>
      </div>
    </div>
  );
}
