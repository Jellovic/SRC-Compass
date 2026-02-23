import type { Response } from "./types";
import type { Word } from "./types";
import { ladderDivergence, referentDivergence } from "./divergence";

/** One response per participant per word (latest only). */
export function getLatestResponsesPerParticipant(responses: Response[]): Response[] {
  const byKey = new Map<string, Response>();
  for (const r of responses) {
    const key = `${r.participantId}:${r.wordId}`;
    const existing = byKey.get(key);
    if (!existing || r.timestamp > existing.timestamp) byKey.set(key, r);
  }
  return Array.from(byKey.values());
}

export interface WordAggregate {
  wordId: string;
  wordLabel: string;
  /** Count per ladder anchor index 0..4 */
  ladderCounts: number[];
  /** Count per referent id (same order as word.referents) */
  referentCounts: { referentId: string; count: number }[];
  /** 6 counts in referent order for entropy */
  referentCountsArray: number[];
  ladderDivergence: number;
  referentDivergence: number;
}

export function aggregateByWord(
  responses: Response[],
  words: Word[]
): WordAggregate[] {
  const latest = getLatestResponsesPerParticipant(responses);
  const byWord = new Map<string, Response[]>();
  for (const r of latest) {
    if (!byWord.has(r.wordId)) byWord.set(r.wordId, []);
    byWord.get(r.wordId)!.push(r);
  }

  const result: WordAggregate[] = [];
  for (const word of words) {
    const list = byWord.get(word.id) ?? [];
    const ladderCounts = [0, 0, 0, 0, 0];
    const referentCountsMap = new Map<string, number>();
    for (const r of list) {
      if (r.anchorIndex >= 0 && r.anchorIndex <= 4) ladderCounts[r.anchorIndex]++;
      referentCountsMap.set(r.referentId, (referentCountsMap.get(r.referentId) ?? 0) + 1);
    }
    const referentCounts = word.referents.map((ref) => ({
      referentId: ref.id,
      count: referentCountsMap.get(ref.id) ?? 0,
    }));
    const referentCountsArray = word.referents.map((ref) => referentCountsMap.get(ref.id) ?? 0);
    result.push({
      wordId: word.id,
      wordLabel: word.label,
      ladderCounts,
      referentCounts,
      referentCountsArray,
      ladderDivergence: ladderDivergence(ladderCounts),
      referentDivergence: referentDivergence(referentCountsArray),
    });
  }
  return result;
}
