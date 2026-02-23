# Context for AI: Shared Reference Calibration

**Use this at the start of a new session.** Paste or reference it so the assistant has full project context and can edit surgically without exploring the repo blindly.

---

## What this project is

- **Name:** Shared Reference Calibration (repo may be named SRC-Compass).
- **Purpose:** Research/studio prototype for **group decision-making**: a group calibrates the meaning of common meeting words by (A) placing each word on an anchored ladder scale and (B) choosing a referent image that best matches what they mean. Results are shown as a **heatmap of divergence** (normalized entropy per word, ladder vs referent).
- **Stack:** Next.js 14 (App Router), React, TypeScript, Tailwind CSS. In-memory store (no DB); store is attached to `globalThis` so it survives Next.js dev recompiles.
- **Run:** `npm run dev` (may bind to 3000 or 3001 if 3000 is in use). Node may require `export PATH="/c/Program Files/nodejs:$PATH"` on this machine.

---

## Architecture (high level)

- **Frontend:** All under `src/app/` — pages and API routes.
- **Data:** `src/lib/` — types, seed data, divergence math, aggregation, session store. Store is in-memory + `globalThis` for dev.
- **No auth.** Sessions are identified by a 6-character code; participants join with name + code.

---

## Directory and file map (where to edit what)

```
src/
├── app/
│   ├── layout.tsx              # Root layout, metadata, globals.css import
│   ├── page.tsx                # Home: "Create session" / "Join session" links
│   ├── globals.css             # Tailwind + any global styles
│   ├── create/page.tsx         # Create session form → POST /api/sessions/create → redirect to /session/[id]?code=...
│   ├── join/page.tsx           # Join form (name + code) → POST /api/sessions/join → redirect to /session/[id]/calibrate?participantId=&participantName=
│   ├── session/
│   │   └── [id]/
│   │       ├── page.tsx        # Session host: shows code, "I'll calibrate too" (full-page <a>), "View results", "← Home"
│   │       ├── calibrate/
│   │       │   └── page.tsx    # Per-word flow: Step A (ladder), Step B (referent); POST /api/responses; loadSession via GET /api/sessions/[id]; error/retry UI
│   │       └── results/
│   │           └── page.tsx    # Heatmap (canvas), divergence per word, detail modal (ladder bar chart / referent grid), facilitation mode, "Download heatmap as PNG"
│   └── api/
│       ├── sessions/
│       │   ├── create/route.ts # POST: createSession(name, wordSet) → { session, code }
│       │   ├── join/route.ts   # POST: getSessionByCode(code) → { session }
│       │   └── [id]/route.ts   # GET: getSession(id) → { session }
│       └── responses/route.ts  # POST: addResponse; GET ?sessionId= → { responses }
├── lib/
│   ├── types.ts                # Session, Word, Response, Referent interfaces
│   ├── seedData.ts             # PRESET_WORDS (6 words: urgent, aligned, prototype, risk, quality, done); 5 anchors + 6 referents each; placeholder SVG imageUrls
│   ├── divergence.ts           # normalizedEntropy(counts, k), ladderDivergence (k=5), referentDivergence (k=6); 0..1
│   ├── aggregate.ts            # getLatestResponsesPerParticipant, aggregateByWord(responses, words) → WordAggregate[] (ladderCounts, referentCounts, ladderDivergence, referentDivergence)
│   └── sessionStore.ts        # In-memory store attached to globalThis (__src_sessions, __src_codeToSessionId, __src_responses); createSession, getSession, getSessionByCode, addResponse, getResponses
```

---

## Data model (reference)

- **Session:** `{ id, name, createdAt, words: Word[] }`
- **Word:** `{ id, label, anchors: [string x 5], referents: Referent[] }` (referents length 6)
- **Referent:** `{ id, label, imageUrl }` (imageUrl = data URL SVG placeholder or path)
- **Response:** `{ sessionId, participantId, participantName, wordId, anchorIndex (0..4), referentId, timestamp }`

One response per participant per word (latest wins); aggregation uses `aggregateByWord(responses, session.words)`.

---

## Key functions and where they live

| What | Where |
|------|--------|
| Create session, generate code | `src/lib/sessionStore.ts`: `createSession(name, wordSet)` |
| Look up session by code or id | `sessionStore`: `getSessionByCode(code)`, `getSession(id)` |
| Save / list responses | `sessionStore`: `addResponse(r)`, `getResponses(sessionId)` |
| Divergence (0..1) | `src/lib/divergence.ts`: `ladderDivergence(counts[5])`, `referentDivergence(counts[6])` |
| Responses → per-word stats | `src/lib/aggregate.ts`: `aggregateByWord(responses, words)` → WordAggregate (ladderCounts, referentCounts, ladderDivergence, referentDivergence) |
| Change words/anchors/referents | `src/lib/seedData.ts`: edit `PRESET_WORDS` |
| Heatmap rendering + download PNG | `src/app/session/[id]/results/page.tsx`: canvas ref, draw loop, `downloadHeatmapPng()` |

---

## UX and flow (for behavior changes)

1. **Home** → Create session or Join session.
2. **Create** → Name + word set (default) → redirect to `/session/[id]?code=CODE`.
3. **Session host** → Shows CODE; "I'll calibrate too" = full-page link to `/session/[id]/calibrate?participantId=host&participantName=Host`; "View results" → `/session/[id]/results`.
4. **Join** → Name + code → join API returns session → redirect to calibrate with new participantId/participantName.
5. **Calibrate** → For each word: Step A pick one of 5 ladder anchors, Step B pick one of 6 referents; POST to `/api/responses`; then next word or "Finish & see results". Session loaded via GET `/api/sessions/[id]`; invalid/missing sessionId or 404 shows error + "Back to session" / Retry.
6. **Results** → Heatmap (words × ladder divergence | referent divergence), click cell → detail modal (ladder: bar chart; referent: image grid with counts). Facilitation mode hides participant names. "Download heatmap as PNG" exports canvas.

---

## Technical gotchas (already fixed; don’t undo)

- **Session store:** Must use `globalThis` in `sessionStore.ts` so the same Maps are reused after Next.js recompiles API routes in dev; otherwise GET session returns 404 right after create.
- **Calibrate "I'll calibrate too":** Session host uses a full-page `<a href="...">` (not `<Link>`) so the calibrate page loads with correct URL and params from first paint.
- **Calibrate loading:** Only call GET session when `sessionId` is valid (length > 10, not `"undefined"`); show "Loading session…" until then; 404 → "Session not found. It may have expired...".
- **Port:** Dev server may run on 3001 if 3000 is in use; all requests must go to the same origin (same port) so create and get hit the same process.

---

## How to use this with the AI

At the start of your next session, say something like:

> "I'm continuing work on Shared Reference Calibration. Read CONTEXT_FOR_AI.md in the project root for full context (what it does, architecture, file map, data model, key functions, and gotchas). Then [your actual request]."

Or paste the relevant sections of CONTEXT_FOR_AI.md plus your request. The assistant can then edit the right files directly without guessing.
