"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateSessionPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [wordsInput, setWordsInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Enter a session name.");
      return;
    }
    const labels = wordsInput
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (labels.length === 0) {
      setError("Enter at least one word (comma- or newline-separated).");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/sessions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), words: wordsInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create session");
      router.push(`/session/${data.session.id}?code=${encodeURIComponent(data.code)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-lg px-6 py-16">
      <h1 className="text-2xl font-semibold text-stone-800">Create session</h1>
      <p className="mt-2 text-stone-600">
        Name the session and list the words your group will calibrate. Share the session code with participants.
      </p>
      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-stone-700">
            Session name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900"
            placeholder="e.g. Sprint Planning Calibration"
          />
        </div>
        <div>
          <label htmlFor="words" className="block text-sm font-medium text-stone-700">
            Words to calibrate
          </label>
          <textarea
            id="words"
            value={wordsInput}
            onChange={(e) => setWordsInput(e.target.value)}
            rows={4}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900"
            placeholder={"e.g. urgent, aligned, prototype\nor one word per line"}
          />
          <p className="mt-1 text-xs text-stone-500">One per line or comma-separated</p>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-stone-800 px-4 py-3 font-medium text-white hover:bg-stone-700 disabled:opacity-60"
        >
          {loading ? "Creating…" : "Create session"}
        </button>
      </form>
      <p className="mt-6">
        <a href="/" className="text-stone-500 underline hover:text-stone-700">
          ← Back
        </a>
      </p>
    </main>
  );
}
