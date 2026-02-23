/**
 * Divergence = normalized entropy (0 = everyone agreed, 1 = max spread).
 * entropy = -sum(p_i * log2(p_i)); normalized by log2(k) so result is in [0, 1].
 */

export function normalizedEntropy(counts: number[], k: number): number {
  const n = counts.reduce((a, b) => a + b, 0);
  if (n === 0) return 0;
  let entropy = 0;
  for (const c of counts) {
    if (c === 0) continue;
    const p = c / n;
    entropy -= p * Math.log2(p);
  }
  const maxEntropy = Math.log2(k);
  return maxEntropy > 0 ? entropy / maxEntropy : 0;
}

/** Ladder divergence: k = 5 anchors. */
export function ladderDivergence(countsPerAnchor: number[]): number {
  return normalizedEntropy(countsPerAnchor, 5);
}

/** Referent divergence: k = 6 images. */
export function referentDivergence(countsPerReferent: number[]): number {
  return normalizedEntropy(countsPerReferent, 6);
}
