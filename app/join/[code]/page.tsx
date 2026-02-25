"use client";

import { useEffect, useState, FormEvent, use } from "react";
import { useRouter } from "next/navigation";

type SessionResponse = {
  session: {
    name: string;
    words: string[];
    code: string;
  };
};

export default function JoinSessionPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const router = useRouter();
  const { code: rawCode } = use(params);
  const code = rawCode.toUpperCase();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<SessionResponse["session"] | null>(
    null
  );

  const [index, setIndex] = useState(0);
  const [termsRaw, setTermsRaw] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/session/${code}`);
        const contentType = res.headers.get("content-type") ?? "";
        let data: SessionResponse | null = null;

        if (contentType.includes("application/json")) {
          try {
            data = (await res.json()) as SessionResponse;
          } catch {
            // ignore parse errors; handled below
          }
        }

        if (!res.ok || !data?.session) {
          const fallbackMessage = !res.ok
            ? "Session not found."
            : "Session response was malformed.";
          if (!cancelled) {
            setError(fallbackMessage);
          }
          return;
        }

        if (!cancelled) {
          setSession(data.session);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError("Failed to load session.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [code]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!session) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/entry/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          wordIndex: index,
          termsRaw,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to submit.");
        return;
      }

      setTermsRaw("");
      if (index + 1 >= session.words.length) {
        setDone(true);
      } else {
        setIndex((i) => i + 1);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 text-zinc-900">
        <main className="mx-auto flex min-h-screen max-w-3xl flex-col px-6 py-16">
          <p className="text-sm text-zinc-600">Loading session…</p>
        </main>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-zinc-50 text-zinc-900">
        <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-4 px-6 py-16">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="mb-2 inline-flex w-fit items-center text-xs text-zinc-500 hover:text-zinc-800"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-semibold">Session not available</h1>
          <p className="text-sm text-red-600">{error || "Unknown error."}</p>
        </main>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen bg-zinc-50 text-zinc-900">
        <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-16">
          <h1 className="text-2xl font-semibold tracking-tight">Thank you</h1>
          <p className="max-w-md text-sm text-zinc-600">
            Your responses have been recorded. You can close this tab, or stay
            while others finish.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => router.push(`/leader/${code}`)}
              className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800"
            >
              View results & map (facilitator)
            </button>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="inline-flex items-center justify-center rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 hover:border-zinc-500"
            >
              Back to start
            </button>
          </div>
        </main>
      </div>
    );
  }

  const total = session.words.length;
  const currentWord = session.words[index];

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-6 py-16">
        <header className="flex flex-col gap-1">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Session {session.name || "untitled"} · Code {session.code}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Word {index + 1} of {total}
          </h1>
        </header>

        <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="mb-3 text-sm text-zinc-600">
            For the word below, write synonyms and connotations, separated by
            commas.
          </p>
          <div className="mb-4 inline-flex items-center rounded-md bg-zinc-900 px-4 py-2 text-lg font-medium text-white">
            {currentWord}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <textarea
              value={termsRaw}
              onChange={(e) => setTermsRaw(e.target.value)}
              rows={4}
              placeholder="e.g. spacious, open, expansive, flexible..."
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
            />
            {error && (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
            >
              {index + 1 >= total ? "Submit and finish" : "Submit and next"}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}

