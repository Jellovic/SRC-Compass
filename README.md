# Shared Reference Calibration

A small web app for research/studio projects: it helps a group calibrate the meaning of common meeting words by (A) placing each word on an anchored ladder scale and (B) choosing a referent image that best matches what they mean. Results are shown as a heatmap of group divergence.

## Stack

- **Next.js** (App Router) + **React** + **TypeScript** + **Tailwind CSS**
- In-memory session and response storage (no database; optional localStorage hook is in the codebase)
- No auth; session codes are sufficient for joining

## Run locally

One command:

```bash
npm install && npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## User flow

1. **Create session** — Enter a session name and get a 6-character code. Share the code with participants.
2. **Join session** — Enter your name and the session code.
3. **Calibrate** — For each of the 6 words:
   - **Step A (Ladder):** Choose one of 5 anchored labels (e.g. “Not at all” … “Extremely”).
   - **Step B (Referent):** Choose 1 image from a grid of 6 options.
4. **Results** — Heatmap of divergence per word (ladder vs referent). Click a cell to see the distribution (bar chart for ladder, image grid with counts for referents). Use “Facilitation mode” to hide participant names. Download the heatmap as PNG.

## Divergence (math)

Divergence is **normalized entropy** so that:

- **0** = everyone chose the same option (full agreement).
- **1** = answers spread evenly across all options (maximum disagreement).

Formula:

- **Entropy:** \( H = -\sum_i p_i \log_2(p_i) \), where \( p_i \) is the proportion of responses in option \( i \).
- **Normalized:** \( D = H / \log_2(k) \), where \( k \) is the number of options (5 for ladder, 6 for referents). So \( D \in [0, 1] \).

Heatmap cell intensity is proportional to \( D \) (e.g. grayscale: darker = more divergence).

## Changing words, anchors, and referents

- **Word set:** Edit `src/lib/seedData.ts`. The default preset is `PRESET_WORDS`: 6 words (e.g. “urgent”, “aligned”, “prototype”, “risk”, “quality”, “done”).
- **Anchors:** Each word has an `anchors` array of exactly 5 strings (ladder labels, bottom to top).
- **Referents:** Each word has a `referents` array of 6 items: `{ id, label, imageUrl }`. The app uses inline SVG placeholders by default; you can replace `imageUrl` with paths to your own images (e.g. in `public/`).

## Project structure

```
src/
  app/
    page.tsx              # Home: Create / Join
    create/page.tsx        # Create session
    join/page.tsx          # Join with name + code
    session/[id]/
      page.tsx             # Host view (code, links)
      calibrate/page.tsx    # Step A + B per word
      results/page.tsx     # Heatmap + detail + download
    api/
      sessions/create/     # POST create session
      sessions/join/       # POST join by code
      sessions/[id]/       # GET session by id
      responses/           # POST add, GET list by sessionId
  lib/
    types.ts               # Session, Word, Response
    seedData.ts            # PRESET_WORDS (edit here)
    divergence.ts          # Normalized entropy
    aggregate.ts           # Responses → per-word aggregates
    sessionStore.ts        # In-memory store
```

## License

Use as you like for research/studio work.
