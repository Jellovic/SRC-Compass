## Cognitive Proximity Word Mapper

Minimal Next.js prototype for facilitating group sense‑making around words. A facilitator creates a session with a list of words, participants join via a short code and submit synonyms/connotations, and the app aggregates responses and generates clustered word maps.

### How to run locally

- **Install dependencies**

```bash
cd app
npm install
```

- **Set your OpenAI API key**

Create a `.env.local` file in the `app` directory:

```bash
OPENAI_API_KEY=sk-...
```

Then restart the dev server whenever you change `.env.local`.

- **Start the dev server**

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

### Core flows

- **Create session**: go to `/create`, enter a session name and one word per line, and submit. You will get a short session code plus links to the leader dashboard and participant view.
- **Join session**: participants go to `/` or `/join/[code]`, enter the code, and are taken through each word in turn with a single text box for comma‑separated synonyms/connotations.
- **View results (leader)**: go to `/leader/[code]` to see aggregated counts per word. For any word you can click **Analyze** to generate a clustered 2D map and **Download PNG** to save the canvas.

### Analysis approach

The `/api/analyze` endpoint uses a simple LLM‑based clustering strategy (Option B from the spec):

- For a given session code and `wordIndex`, the server collects all unique submitted terms for that word.
- It calls the OpenAI Chat Completions API (model `gpt-4o-mini`) with a strict JSON prompt asking for `{ clusters: [{ label, terms: string[] }] }`.
- On the server, these clusters are laid out in a coarse grid of “islands”: each cluster gets a cell in a rows×columns grid, and terms are positioned in a small radial pattern inside that cell to create a 2D “map” effect.
- The API returns `{ clusters, layout }`, where `layout` is a list of `{ term, x, y, clusterLabel, clusterIndex }` items with normalized coordinates in \[0,1\].

The front‑end `WordMap` component uses `<canvas>` to render these layout points as colored nodes with text labels and provides a “Download PNG” button that exports the canvas via `toDataURL`.

Comments in `app/app/api/analyze/route.ts` and `lib/store.ts` mark where the LLM‑based clustering is plugged in, so you can later swap in an embeddings + k‑means + PCA pipeline if desired.

### Data model and storage

- **Session**: `{ id, code, name, words: string[], createdAt }`
- **Entry**: `{ sessionId, wordIndex, terms: string[] }` (terms are pre‑cleaned: split on commas, trimmed, lower‑cased, punctuation stripped, de‑duplicated).

All data is stored in simple in‑memory Maps on the server (`lib/store.ts`). This keeps the prototype very lean and is suitable for single‑process local dev. There is no database, no authentication, and no participant identity stored.

### Known limitations

- **Ephemeral storage**: sessions and entries live only in server memory. Restarting the dev server clears everything.
- **Single process**: the in‑memory store is not shared across processes or deployments; it is intended for local prototypes only.
- **OpenAI dependency**: analysis requires `OPENAI_API_KEY`. If it is missing or the API fails, analysis will fail gracefully with an error message.
- **Approximate layout**: the 2D map is a simple grid‑based layout on top of LLM clusters—not a true geometric embedding—so distances are visually suggestive rather than mathematically precise.
- **No real‑time updates**: leaders refresh results manually; there are no websockets or live updates by design.
