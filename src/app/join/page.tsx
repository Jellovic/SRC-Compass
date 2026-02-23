"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function JoinSessionPage() {
  const router = useRouter();
  const [participantName, setParticipantName] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!participantName.trim() || !code.trim()) {
      setError("Enter your name and the session code.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/sessions/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Session not found");
      const sessionId = data.session.id;
      const participantId = crypto.randomUUID();
      router.push(
        `/session/${sessionId}/calibrate?participantId=${encodeURIComponent(participantId)}&participantName=${encodeURIComponent(participantName.trim())}`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-lg px-6 py-16">
      <h1 className="text-2xl font-semibold text-stone-800">Join session</h1>
      <p className="mt-2 text-stone-600">
        Enter your name and the 6-character code from the facilitator.
      </p>
      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="participantName" className="block text-sm font-medium text-stone-700">
            Your name
          </label>
          <input
            id="participantName"
            type="text"
            value={participantName}
            onChange={(e) => setParticipantName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900"
            placeholder="e.g. Alex"
          />
        </div>
        <div>
          <label htmlFor="code" className="block text-sm font-medium text-stone-700">
            Session code
          </label>
          <input
            id="code"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={6}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 font-mono text-stone-900 uppercase"
            placeholder="ABC123"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-stone-800 px-4 py-3 font-medium text-white hover:bg-stone-700 disabled:opacity-60"
        >
          {loading ? "Joining…" : "Join"}
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
