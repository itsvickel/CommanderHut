import API_ENDPOINT from '../Constants/api';
import { ParsedDeck, DeckDiff } from '../types/chat';
import { DeckAnalysis } from '../types/analysis';
import { postSseStream, ProgressEvent } from './sseClient';

export type { ProgressEvent };

export interface SavedDeckResponse {
  deck: { _id: string; deck_name: string };
}

/**
 * Persists a generated preview as a real deck via POST /api/ai/deck/save.
 * The backend keeps generation previews for ~1 hour; a 410 means the
 * preview expired and the deck must be regenerated.
 */
export const saveAIDeck = async (
  generationId: string,
  deckName: string
): Promise<SavedDeckResponse> => {
  const response = await fetch(API_ENDPOINT.AI_SAVE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ generation_id: generationId, deck_name: deckName }),
  });

  if (!response.ok) {
    if (response.status === 410) {
      throw new GenerationExpiredError('This generation has expired — please regenerate the deck');
    }
    let message = 'Failed to save deck';
    try {
      const payload = await response.json();
      if (payload?.error) message = payload.error;
    } catch { /* non-JSON body (e.g. a proxy error page) */ }
    throw new Error(message);
  }
  return (await response.json()) as SavedDeckResponse;
};

interface GenerateResult {
  generation_id?: string;
  commander: { name: string; image_uris?: Record<string, string>; reason?: string };
  cards: ParsedDeck['cards'];
  strategy?: string;
  themes?: string[];
}

export const fetchMTGIdea = async (
  prompt: string,
  onProgress?: (event: ProgressEvent) => void
): Promise<ParsedDeck> => {
  const d = await postSseStream<GenerateResult>(
    API_ENDPOINT.AI_GENERATE,
    { prompt, format: 'Commander' },
    onProgress
  );

  if (!d.commander || !Array.isArray(d.cards)) {
    throw new Error('Unexpected response shape');
  }

  return {
    generationId: d.generation_id ?? '',
    commander: d.commander.name,
    commanderImageUri: d.commander.image_uris?.normal ?? d.commander.image_uris?.small ?? '',
    commanderReason: d.commander.reason ?? '',
    cards: d.cards,
    strategy: d.strategy ?? '',
    themes: d.themes ?? [],
  };
};

interface RefineResult extends DeckDiff {
  generation_id?: string | null;
  deck_id?: string | null;
}

/** A refinement targets either a live generation or a saved deck. */
export type RefineTarget =
  | { generationId: string }
  | { deckId: string };

function refineBody(target: RefineTarget, instruction: string) {
  return 'generationId' in target
    ? { generation_id: target.generationId, instruction }
    : { deck_id: target.deckId, instruction };
}

/** Thrown when the backend preview for a generation is gone (HTTP 410). */
export class GenerationExpiredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GenerationExpiredError';
  }
}

/**
 * Asks the AI to refine an existing deck ("more removal", "swap X").
 * Returns a validated add/cut diff — the backend guarantees every add is a
 * real, on-identity, bracket-legal card and never cuts the commander. The
 * diff is staged server-side and only applied by `acceptRefinement`.
 */
export const refineDeck = async (
  target: RefineTarget,
  instruction: string,
  onProgress?: (event: ProgressEvent) => void
): Promise<DeckDiff> => {
  let result: RefineResult;
  try {
    result = await postSseStream<RefineResult>(
      API_ENDPOINT.AI_REFINE,
      refineBody(target, instruction),
      onProgress
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (/expired/i.test(message)) throw new GenerationExpiredError(message);
    throw err;
  }

  if (!Array.isArray(result.adds) || !Array.isArray(result.cuts)) {
    throw new Error('Unexpected response shape');
  }
  return { adds: result.adds, cuts: result.cuts, summary: result.summary ?? '' };
};

/**
 * Applies the diff staged by the last refine. Until this is called the
 * server-side deck is unchanged, so discarding a diff really discards it.
 */
export const acceptRefinement = async (generationId: string): Promise<void> => {
  const response = await fetch(API_ENDPOINT.AI_REFINE_ACCEPT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ generation_id: generationId }),
  });

  if (!response.ok) {
    let message = 'Failed to apply changes';
    try {
      const payload = await response.json();
      if (payload?.error) message = payload.error;
    } catch { /* keep the default message */ }
    if (response.status === 410) throw new GenerationExpiredError(message);
    throw new Error(message);
  }
};

/**
 * Analyses a saved deck: deterministic stats computed server-side plus an
 * LLM critique grounded in those numbers, with real upgrade suggestions.
 */
export const analyzeDeck = async (
  deckId: string,
  onProgress?: (event: ProgressEvent) => void
): Promise<DeckAnalysis> => {
  const result = await postSseStream<DeckAnalysis>(
    API_ENDPOINT.AI_ANALYZE,
    { deck_id: deckId },
    onProgress
  );

  if (!result?.stats) {
    throw new Error('Unexpected response shape');
  }
  return {
    stats: result.stats,
    observations: result.observations ?? [],
    verdict: result.verdict ?? '',
    strengths: result.strengths ?? [],
    weaknesses: result.weaknesses ?? [],
    suggestions: result.suggestions ?? [],
  };
};
