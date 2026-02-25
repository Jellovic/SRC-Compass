"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateSessionPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [wordsRaw, setWordsRaw] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdCode, setCreatedCode] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setCreatedCode(null);

    try {
      const res = await fetch("/api/session/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, wordsRaw }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create session.");
        return;
      }

      setCreatedCode(data.code);
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-6 py-16">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="mb-2 inline-flex w-fit items-center text-xs text-zinc-500 hover:text-zinc-800"
        >
          ← Back
        </button>

        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Create a new session
          </h1>
          <p className="max-w-xl text-sm text-zinc-600">
            Name your session and paste your list of words. Each word will be
            shown to participants one by one.
          </p>
        </header>

        <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-800">
                Session name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Team reflection on 'space'"
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-800">
                Words (one per line)
              </label>
              <textarea
                value={wordsRaw}
                onChange={(e) => setWordsRaw(e.target.value)}
                rows={8}
                placeholder={"space\nstructure\nnorms\nboundaries"}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
              />
              <p className="text-xs text-zinc-500">
                Participants will see each word and write synonyms / connotations
                for it.
              </p>
            </div>

            {error && (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
            >
              {loading ? "Creating..." : "Create session"}
            </button>
          </form>
        </section>

        {createdCode && (
          <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-6 text-sm text-emerald-900">
            <h2 className="mb-2 text-base font-semibold">
              Session created successfully
            </h2>
            <p className="mb-3">
              Share this code with your team so they can join:
            </p>
            <div className="mb-4 inline-flex items-center rounded-md border border-emerald-300 bg-white px-3 py-2 text-lg font-mono tracking-[0.3em]">
              {createdCode}
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => router.push(`/leader/${createdCode}`)}
                className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800"
              >
                Open leader dashboard
              </button>
              <button
                type="button"
                onClick={() => router.push(`/join/${createdCode}`)}
                className="inline-flex items-center justify-center rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 hover:border-zinc-500"
              >
                Join as participant
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

