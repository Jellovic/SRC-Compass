"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Session, Word } from "@/lib/types";

type Step = "ladder" | "referent";

export default function CalibratePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const rawId = params?.id;
  const sessionId = rawId ? String(rawId) : "";
  const participantId = searchParams.get("participantId") ?? "";
  const participantName = searchParams.get("participantName") ?? "Participant";

  const isValidSessionId = sessionId && sessionId.length > 10 && sessionId !== "undefined";

  const [session, setSession] = useState<Session | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const sessionRef = useRef<Session | null>(null);
  const [wordIndex, setWordIndex] = useState(0);
  const [step, setStep] = useState<Step>("ladder");
  const [anchorIndex, setAnchorIndex] = useState<number | null>(null);
  const [referentId, setReferentId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const loadSession = useCallback(() => {
    if (!isValidSessionId) return;
    setLoadError(null);
    fetch(`/api/sessions/${sessionId}`)
      .then((r) => {
        if (!r.ok) {
          if (r.status === 404)
            setLoadError("Session not found. It may have expired (e.g. server was restarted). Go back and create or join a session again.");
          else
            setLoadError("Couldn't load session. Is the dev server running? Run: npm run dev");
          return;
        }
        return r.json();
      })
      .then((d) => {
        if (!d) return;
        if (d.session) {
          setSession(d.session);
          setLoadError(null);
        } else setLoadError("Session not found.");
      })
      .catch(() => {
        setLoadError("Couldn't connect to the server. Is it running on this port? Run: npm run dev");
      });
  }, [sessionId, isValidSessionId]);

  useEffect(() => {
    if (!isValidSessionId) return;
    loadSession();
    const t = setTimeout(() => {
      if (!sessionRef.current)
        setLoadError((prev) =>
          prev === null ? "Taking too long. Is the dev server running? Run: npm run dev" : prev
        );
    }, 8000);
    return () => clearTimeout(t);
  }, [sessionId, isValidSessionId, loadSession]);

  const word = session?.words[wordIndex] ?? null;
  const isLastWord = session && wordIndex >= session.words.length - 1;
  const canAdvanceLadder = anchorIndex !== null;
  const canAdvanceReferent = referentId !== null;

  async function saveAndNext() {
    if (!session || !word) return;
    setSaving(true);
    try {
      if (step === "ladder" && anchorIndex !== null) {
        await fetch("/api/responses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            participantId,
            participantName,
            wordId: word.id,
            anchorIndex,
            referentId: referentId ?? "",
            timestamp: Date.now(),
          }),
        });
        setStep("referent");
        return;
      }
      if (step === "referent" && referentId) {
        await fetch("/api/responses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            participantId,
            participantName,
            wordId: word.id,
            anchorIndex: anchorIndex ?? 0,
            referentId,
            timestamp: Date.now(),
          }),
        });
        if (isLastWord) {
          router.push(`/session/${sessionId}/results`);
          return;
        }
        setWordIndex((i) => i + 1);
        setStep("ladder");
        setAnchorIndex(null);
        setReferentId(null);
      }
    } finally {
      setSaving(false);
    }
  }

  if (!session) {
    return (
      <main className="mx-auto max-w-lg px-6 py-16">
        {!isValidSessionId ? (
          <p className="text-stone-600">Loading session…</p>
        ) : loadError ? (
          <>
            <p className="text-stone-700">{loadError}</p>
            <p className="mt-4">
              <a href="/" className="text-stone-600 underline hover:text-stone-800">← Home</a>
              {" · "}
              <a href={`/session/${sessionId}`} className="text-stone-600 underline hover:text-stone-800">← Back to session</a>
              {isValidSessionId && (
                <>
                  {" · "}
                  <button
                    type="button"
                    onClick={() => { setLoadError(null); loadSession(); }}
                    className="text-stone-600 underline hover:text-stone-800"
                  >
                    Retry
                  </button>
                </>
              )}
            </p>
          </>
        ) : (
          <p className="text-stone-600">Loading session…</p>
        )}
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg px-6 py-10">
      <p className="text-sm text-stone-500">
        Word {wordIndex + 1} of {session.words.length} · {participantName}
      </p>
      <h2 className="mt-2 text-xl font-semibold text-stone-800">
        “{word?.label}”
      </h2>

      {step === "ladder" && word && (
        <LadderStep
          word={word}
          selectedIndex={anchorIndex}
          onSelect={setAnchorIndex}
        />
      )}
      {step === "referent" && word && (
        <ReferentStep
          word={word}
          selectedId={referentId}
          onSelect={setReferentId}
        />
      )}

      <div className="mt-10 flex gap-4">
        {step === "ladder" && (
          <button
            onClick={saveAndNext}
            disabled={!canAdvanceLadder || saving}
            className="flex-1 rounded-lg bg-stone-800 py-3 font-medium text-white hover:bg-stone-700 disabled:opacity-50"
          >
            Next: choose referent
          </button>
        )}
        {step === "referent" && (
          <button
            onClick={saveAndNext}
            disabled={!canAdvanceReferent || saving}
            className="flex-1 rounded-lg bg-stone-800 py-3 font-medium text-white hover:bg-stone-700 disabled:opacity-50"
          >
            {isLastWord ? "Finish & see results" : "Next word"}
          </button>
        )}
      </div>

      <p className="mt-8">
        <a
          href={`/session/${sessionId}/results`}
          className="text-stone-500 underline hover:text-stone-700"
        >
          Skip to results →
        </a>
      </p>
    </main>
  );
}

function LadderStep({
  word,
  selectedIndex,
  onSelect,
}: {
  word: Word;
  selectedIndex: number | null;
  onSelect: (i: number) => void;
}) {
  return (
    <div className="mt-8">
      <p className="text-sm font-medium text-stone-600">
        Step A — Where does “{word.label}” sit on this ladder?
      </p>
      <div className="mt-4 flex flex-col gap-1 rounded-lg border border-stone-200 bg-white p-2">
        {word.anchors.map((label, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(i)}
            className={`rounded-md px-4 py-3 text-left text-sm transition ${
              selectedIndex === i
                ? "bg-stone-700 text-white"
                : "bg-stone-100 text-stone-800 hover:bg-stone-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ReferentStep({
  word,
  selectedId,
  onSelect,
}: {
  word: Word;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="mt-8">
      <p className="text-sm font-medium text-stone-600">
        Step B — Which image best matches what you mean by “{word.label}”?
      </p>
      <div className="mt-4 grid grid-cols-3 gap-3">
        {word.referents.map((ref) => (
          <button
            key={ref.id}
            type="button"
            onClick={() => onSelect(ref.id)}
            className={`overflow-hidden rounded-lg border-2 transition ${
              selectedId === ref.id
                ? "border-stone-700 ring-2 ring-stone-400"
                : "border-stone-200 hover:border-stone-400"
            }`}
          >
            <img
              src={ref.imageUrl}
              alt={ref.label}
              className="h-24 w-full object-cover"
            />
            <p className="bg-stone-50 py-1 text-xs text-stone-600">{ref.label}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
