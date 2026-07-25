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

  const result = await response.json();
  if (!response.ok) {
    const message = response.status === 410
      ? 'This generation has expired — please regenerate the deck'
      : result.error ?? 'Failed to save deck';
    throw new Error(message);
  }
  return result as SavedDeckResponse;
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

/**
 * Asks the AI to refine an existing generation ("more removal", "swap X").
 * Returns a validated add/cut diff — the backend guarantees every add is a
 * real, on-identity, bracket-legal card and never cuts the commander.
 */
export const refineDeck = async (
  generationId: string,
  instruction: string,
  onProgress?: (event: ProgressEvent) => void
): Promise<DeckDiff> => {
  const result = await postSseStream<RefineResult>(
    API_ENDPOINT.AI_REFINE,
    { generation_id: generationId, instruction },
    onProgress
  );

  if (!Array.isArray(result.adds) || !Array.isArray(result.cuts)) {
    throw new Error('Unexpected response shape');
  }
  return { adds: result.adds, cuts: result.cuts, summary: result.summary ?? '' };
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
