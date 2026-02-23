"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-lg px-6 py-16">
      <h1 className="text-2xl font-semibold text-stone-800">
        Shared Reference Calibration
      </h1>
      <p className="mt-2 text-stone-600">
        Calibrate how your group uses common meeting words: place each word on a ladder and pick a referent image, then see where you diverge.
      </p>
      <div className="mt-10 flex flex-col gap-4">
        <Link
          href="/create"
          className="rounded-lg bg-stone-800 px-4 py-3 text-center font-medium text-white hover:bg-stone-700"
        >
          Create session
        </Link>
        <Link
          href="/join"
          className="rounded-lg border border-stone-300 bg-white px-4 py-3 text-center font-medium text-stone-700 hover:bg-stone-50"
        >
          Join session
        </Link>
      </div>
    </main>
  );
}
