"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function Home() {
  const router = useRouter();
  const [code, setCode] = useState("");

  function handleJoin(e: FormEvent) {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    router.push(`/join/${trimmed}`);
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-6 py-16">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            Cognitive Proximity Word Mapper
          </h1>
          <p className="max-w-xl text-sm text-zinc-600">
            Create a quick session, invite your team with a short code, and see
            how everyone&apos;s meanings cluster around key words.
          </p>
        </header>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="mb-2 text-lg font-medium">Create a new session</h2>
            <p className="mb-4 text-sm text-zinc-600">
              Define your list of words and get a short session code to share.
            </p>
            <button
              type="button"
              onClick={() => router.push("/create")}
              className="inline-flex w-full items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Create session
            </button>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="mb-2 text-lg font-medium">Join an existing session</h2>
            <p className="mb-4 text-sm text-zinc-600">
              Enter the session code from your facilitator to contribute.
            </p>
            <form onSubmit={handleJoin} className="space-y-3">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. ABC123"
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm tracking-[0.3em] uppercase outline-none focus:border-zinc-900"
              />
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
              >
                Join session
              </button>
            </form>
          </div>
        </section>

        <footer className="mt-auto pt-4 text-xs text-zinc-500">
          Sessions are anonymous. No names or emails are collected.
        </footer>
      </main>
    </div>
  );
}
