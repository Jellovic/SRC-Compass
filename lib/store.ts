export type Session = {
  id: string;
  code: string;
  name: string;
  words: string[];
  createdAt: number;
};

export type Entry = {
  sessionId: string;
  wordIndex: number;
  terms: string[];
};

export type AggregatedWordResult = {
  word: string;
  index: number;
  terms: { term: string; count: number }[];
};

export type AggregatedResults = {
  session: Session;
  words: AggregatedWordResult[];
};

export type TermCluster = {
  label: string;
  terms: string[];
};

export type ClusterLayoutItem = {
  term: string;
  x: number;
  y: number;
  clusterLabel: string;
  clusterIndex: number;
};

export type AnalysisResult = {
  clusters: TermCluster[];
  layout: ClusterLayoutItem[];
};

const sessionsByCode = new Map<string, Session>();
const sessionsById = new Map<string, Session>();
const entriesBySessionId = new Map<string, Entry[]>();
const analysisCache = new Map<string, AnalysisResult>();

function generateId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function createSession(name: string, wordsRaw: string): Session {
  const words = wordsRaw
    .split(/\r?\n/)
    .map((w) => w.trim())
    .filter((w) => w.length > 0);

  const id = generateId();
  let code = generateCode();
  while (sessionsByCode.has(code)) {
    code = generateCode();
  }

  const session: Session = {
    id,
    code,
    name: name.trim() || "Untitled session",
    words,
    createdAt: Date.now(),
  };

  sessionsByCode.set(code, session);
  sessionsById.set(id, session);
  return session;
}

export function getSessionByCode(code: string): Session | undefined {
  return sessionsByCode.get(code.toUpperCase());
}

export function normalizeTerms(termsRaw: string): string[] {
  const punctuationRegex = /^[\s"“”'‘’.,;:!?()\-]+|[\s"“”'‘’.,;:!?()\-]+$/g;

  const items = termsRaw
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .map((item) => item.replace(punctuationRegex, ""))
    .filter((item) => item.length > 0);

  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of items) {
    if (!seen.has(item)) {
      seen.add(item);
      result.push(item);
    }
  }
  return result;
}

export function addEntry(params: {
  code: string;
  wordIndex: number;
  termsRaw: string;
}): Entry {
  const session = getSessionByCode(params.code);
  if (!session) {
    throw new Error("Session not found");
  }

  const terms = normalizeTerms(params.termsRaw);
  const entry: Entry = {
    sessionId: session.id,
    wordIndex: params.wordIndex,
    terms,
  };

  const existing = entriesBySessionId.get(session.id) ?? [];
  existing.push(entry);
  entriesBySessionId.set(session.id, existing);

  // Invalidate any cached analysis for this word
  const cacheKeyPrefix = `${session.id}:${params.wordIndex}:`;
  for (const key of analysisCache.keys()) {
    if (key.startsWith(cacheKeyPrefix)) {
      analysisCache.delete(key);
    }
  }

  return entry;
}

export function getAggregatedResultsByCode(code: string): AggregatedResults {
  const session = getSessionByCode(code);
  if (!session) {
    throw new Error("Session not found");
  }

  const entries = entriesBySessionId.get(session.id) ?? [];
  const words: AggregatedWordResult[] = session.words.map((word, index) => {
    const freq = new Map<string, number>();
    for (const entry of entries) {
      if (entry.wordIndex === index) {
        for (const term of entry.terms) {
          freq.set(term, (freq.get(term) ?? 0) + 1);
        }
      }
    }

    const terms = Array.from(freq.entries())
      .map(([term, count]) => ({ term, count }))
      .sort((a, b) => b.count - a.count || a.term.localeCompare(b.term));

    return { word, index, terms };
  });

  return { session, words };
}

export function getTermsForWord(code: string, wordIndex: number): {
  session: Session;
  word: string;
  terms: string[];
} {
  const { session, words } = getAggregatedResultsByCode(code);
  const wordResult = words[wordIndex];
  if (!wordResult) {
    throw new Error("Word index out of range");
  }

  const terms = wordResult.terms.map((t) => t.term);
  return { session, word: wordResult.word, terms };
}

export function getCachedAnalysis(
  sessionId: string,
  wordIndex: number
): AnalysisResult | undefined {
  const key = `${sessionId}:${wordIndex}:v1`;
  return analysisCache.get(key);
}

export function setCachedAnalysis(
  sessionId: string,
  wordIndex: number,
  result: AnalysisResult
): void {
  const key = `${sessionId}:${wordIndex}:v1`;
  analysisCache.set(key, result);
}

