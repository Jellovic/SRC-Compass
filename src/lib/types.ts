/**
 * Data model for Shared Reference Calibration.
 * Edit Word presets, anchors, and referents in seedData.ts.
 */

export interface Referent {
  id: string;
  label: string;
  /** Use data URL SVG placeholders or paths to /referents/ images */
  imageUrl: string;
}

export interface Word {
  id: string;
  label: string;
  /** Exactly 5 anchor labels for the ladder (bottom to top) */
  anchors: [string, string, string, string, string];
  /** Exactly 6 referent options */
  referents: Referent[];
}

export interface Session {
  id: string;
  name: string;
  createdAt: number;
  words: Word[];
}

export interface Response {
  sessionId: string;
  participantId: string;
  participantName: string;
  wordId: string;
  anchorIndex: number;
  referentId: string;
  timestamp: number;
}
