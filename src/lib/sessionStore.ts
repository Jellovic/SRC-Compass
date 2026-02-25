/**
 * In-memory session and response store. Optional: persist to localStorage via API.
 * Used by API routes; also can be imported for client-side cache (session list).
 *
 * In dev, Next.js can recompile API routes and re-run this module, which would
 * otherwise create fresh empty Maps. We attach to globalThis so the same store
 * is reused across recompiles and the session is not lost.
 */

import type { Session, Response, Word } from "./types";

declare global {
  // eslint-disable-next-line no-var
  var __src_sessions: Map<string, Session> | undefined;
  // eslint-disable-next-line no-var
  var __src_codeToSessionId: Map<string, string> | undefined;
  // eslint-disable-next-line no-var
  var __src_responses: Map<string, Response[]> | undefined;
}

const sessions = (globalThis.__src_sessions ??= new Map<string, Session>());
const codeToSessionId = (globalThis.__src_codeToSessionId ??= new Map<string, string>());
const responses = (globalThis.__src_responses ??= new Map<string, Response[]>());

function shortCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export function createSession(name: string, words: Word[]): { session: Session; code: string } {
  const id = crypto.randomUUID();
  const session: Session = { id, name, createdAt: Date.now(), words: [...words] };
  sessions.set(id, session);
  const code = shortCode();
  codeToSessionId.set(code, id);
  return { session, code };
}

export function getSessionByCode(code: string): Session | null {
  const id = codeToSessionId.get(code.toUpperCase());
  if (!id) return null;
  return sessions.get(id) ?? null;
}

export function getSession(id: string): Session | null {
  return sessions.get(id) ?? null;
}

export function addResponse(r: Response): void {
  const key = r.sessionId;
  if (!responses.has(key)) responses.set(key, []);
  const list = responses.get(key)!;
  const idx = list.findIndex(
    (x) => x.participantId === r.participantId && x.wordId === r.wordId
  );
  if (idx >= 0) list[idx] = r;
  else list.push(r);
}

export function getResponses(sessionId: string): Response[] {
  return responses.get(sessionId) ?? [];
}

/** Persist sessions and responses to localStorage key (called from API). */
const STORAGE_KEY = "src-sessions";

export function persistToStorage(): void {
  const payload = {
    sessions: Array.from(sessions.entries()),
    codeToId: Array.from(codeToSessionId.entries()),
    responses: Array.from(responses.entries()),
  };
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (_) {}
  }
}

export function loadFromStorage(): void {
  if (typeof window !== "undefined") return;
  // Only used on server if we ever hydrate from localStorage; for now no-op.
}
