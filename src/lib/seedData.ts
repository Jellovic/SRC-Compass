/**
 * Seed data: 6 meeting-relevant words with 5 anchors and 6 referents each.
 * To add words or change anchors/referents, edit the PRESET_WORDS array below.
 * Referent imageUrl: we use inline SVG placeholders (no external fetches).
 */

import type { Word } from "./types";

/** Generate a simple SVG placeholder (public-domain, no external URL). */
function placeholderSvg(label: string, hue: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
  <rect width="120" height="120" fill="hsl(${hue}, 15%, 92%)" stroke="hsl(${hue}, 20%, 75%)" stroke-width="1"/>
  <text x="60" y="62" text-anchor="middle" font-size="12" fill="hsl(${hue}, 25%, 45%)" font-family="system-ui,sans-serif">${label}</text>
</svg>`;
  return "data:image/svg+xml," + encodeURIComponent(svg);
}

/** Default preset: 6 words for meeting calibration. Duplicate and edit to add more presets. */
export const PRESET_WORDS: Word[] = [
  {
    id: "w-urgent",
    label: "urgent",
    anchors: ["Not at all", "A little", "Somewhat", "Quite", "Extremely"],
    referents: [
      { id: "r-u1", label: "A", imageUrl: placeholderSvg("A", 0) },
      { id: "r-u2", label: "B", imageUrl: placeholderSvg("B", 30) },
      { id: "r-u3", label: "C", imageUrl: placeholderSvg("C", 60) },
      { id: "r-u4", label: "D", imageUrl: placeholderSvg("D", 120) },
      { id: "r-u5", label: "E", imageUrl: placeholderSvg("E", 200) },
      { id: "r-u6", label: "F", imageUrl: placeholderSvg("F", 270) },
    ],
  },
  {
    id: "w-aligned",
    label: "aligned",
    anchors: ["Not at all", "A little", "Somewhat", "Quite", "Fully"],
    referents: [
      { id: "r-a1", label: "A", imageUrl: placeholderSvg("A", 40) },
      { id: "r-a2", label: "B", imageUrl: placeholderSvg("B", 80) },
      { id: "r-a3", label: "C", imageUrl: placeholderSvg("C", 120) },
      { id: "r-a4", label: "D", imageUrl: placeholderSvg("D", 160) },
      { id: "r-a5", label: "E", imageUrl: placeholderSvg("E", 220) },
      { id: "r-a6", label: "F", imageUrl: placeholderSvg("F", 280) },
    ],
  },
  {
    id: "w-prototype",
    label: "prototype",
    anchors: ["Rough sketch", "Low-fi", "Mid-fi", "High-fi", "Production-like"],
    referents: [
      { id: "r-p1", label: "A", imageUrl: placeholderSvg("A", 50) },
      { id: "r-p2", label: "B", imageUrl: placeholderSvg("B", 100) },
      { id: "r-p3", label: "C", imageUrl: placeholderSvg("C", 150) },
      { id: "r-p4", label: "D", imageUrl: placeholderSvg("D", 200) },
      { id: "r-p5", label: "E", imageUrl: placeholderSvg("E", 250) },
      { id: "r-p6", label: "F", imageUrl: placeholderSvg("F", 300) },
    ],
  },
  {
    id: "w-risk",
    label: "risk",
    anchors: ["None", "Low", "Medium", "High", "Critical"],
    referents: [
      { id: "r-r1", label: "A", imageUrl: placeholderSvg("A", 350) },
      { id: "r-r2", label: "B", imageUrl: placeholderSvg("B", 10) },
      { id: "r-r3", label: "C", imageUrl: placeholderSvg("C", 70) },
      { id: "r-r4", label: "D", imageUrl: placeholderSvg("D", 130) },
      { id: "r-r5", label: "E", imageUrl: placeholderSvg("E", 190) },
      { id: "r-r6", label: "F", imageUrl: placeholderSvg("F", 310) },
    ],
  },
  {
    id: "w-quality",
    label: "quality",
    anchors: ["Poor", "Below average", "Adequate", "Good", "Excellent"],
    referents: [
      { id: "r-q1", label: "A", imageUrl: placeholderSvg("A", 90) },
      { id: "r-q2", label: "B", imageUrl: placeholderSvg("B", 140) },
      { id: "r-q3", label: "C", imageUrl: placeholderSvg("C", 180) },
      { id: "r-q4", label: "D", imageUrl: placeholderSvg("D", 230) },
      { id: "r-q5", label: "E", imageUrl: placeholderSvg("E", 260) },
      { id: "r-q6", label: "F", imageUrl: placeholderSvg("F", 320) },
    ],
  },
  {
    id: "w-done",
    label: "done",
    anchors: ["Just started", "In progress", "Nearly there", "Almost done", "Complete"],
    referents: [
      { id: "r-d1", label: "A", imageUrl: placeholderSvg("A", 20) },
      { id: "r-d2", label: "B", imageUrl: placeholderSvg("B", 110) },
      { id: "r-d3", label: "C", imageUrl: placeholderSvg("C", 170) },
      { id: "r-d4", label: "D", imageUrl: placeholderSvg("D", 210) },
      { id: "r-d5", label: "E", imageUrl: placeholderSvg("E", 240) },
      { id: "r-d6", label: "F", imageUrl: placeholderSvg("F", 290) },
    ],
  },
];

/** Default anchors used when building words from creator-provided labels. */
const DEFAULT_ANCHORS: [string, string, string, string, string] = [
  "Not at all",
  "A little",
  "Somewhat",
  "Quite",
  "Extremely",
];

/**
 * Build a word bank from the session creator's list of labels.
 * Each word gets default anchors and 6 placeholder referents (A–F).
 */
export function wordsFromLabels(labels: string[]): Word[] {
  const seen = new Set<string>();
  const raw = labels
    .flatMap((s) => s.split(/[\n,]/))
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  const unique = raw.filter((s) => {
    const key = s.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return unique.map((label, i) => {
    const wordId = `w-${i}`;
    const letters = ["A", "B", "C", "D", "E", "F"];
    return {
      id: wordId,
      label,
      anchors: DEFAULT_ANCHORS,
      referents: letters.map((letter, j) => ({
        id: `r-${i}-${j}`,
        label: letter,
        imageUrl: placeholderSvg(letter, (i * 60 + j * 40) % 360),
      })),
    };
  });
}
