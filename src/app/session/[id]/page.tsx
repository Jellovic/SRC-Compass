"use client";

import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function SessionHostPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const code = searchParams.get("code") ?? "";
  const rawId = params?.id;
  const sessionId = rawId ? String(rawId) : "";
  const hasValidSessionId = sessionId.length > 10 && sessionId !== "undefined";
  const [sessionName, setSessionName] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    fetch(`/api/sessions/${sessionId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.session) setSessionName(d.session.name);
      })
      .catch(() => {});
  }, [sessionId]);

  return (
    <main className="mx-auto max-w-lg px-6 py-16">
      <h1 className="text-2xl font-semibold text-stone-800">
        {sessionName ?? "Session"}
      </h1>
      <p className="mt-2 text-stone-600">
        Share this code with participants so they can join and calibrate.
      </p>
      <div className="mt-6 rounded-lg border border-stone-200 bg-stone-100/50 p-6 text-center">
        <p className="text-sm font-medium text-stone-500">Session code</p>
        <p className="mt-2 font-mono text-3xl tracking-widest text-stone-800">
          {code || "—"}
        </p>
      </div>
      <div className="mt-10 flex flex-col gap-4">
        <a
          href={`/session/${sessionId}/calibrate?participantId=host&participantName=Host`}
          className="rounded-lg border border-stone-300 bg-white px-4 py-3 text-center font-medium text-stone-700 hover:bg-stone-50 block"
        >
          I’ll calibrate too
        </a>
        <Link
          href={`/session/${sessionId}/results`}
          className="rounded-lg bg-stone-800 px-4 py-3 text-center font-medium text-white hover:bg-stone-700"
        >
          View results
        </Link>
      </div>
      <p className="mt-8">
        <a href="/" className="text-stone-500 underline hover:text-stone-700">
          ← Home
        </a>
      </p>
    </main>
  );
}
