import API_ENDPOINT from '../Constants/api';
import { ParsedDeck } from '../types/chat';

export type ProgressEvent = {
  stage: string;
  message: string;
};

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

export const fetchMTGIdea = async (
  prompt: string,
  onProgress?: (event: ProgressEvent) => void
): Promise<ParsedDeck> => {
  const response = await fetch(API_ENDPOINT.AI_GENERATE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ prompt, format: 'Commander' }),
  });

  if (!response.ok || !response.body) {
    throw new Error(`HTTP ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const blocks = buffer.split('\n\n');
    buffer = blocks.pop()!;

    for (const block of blocks) {
      if (!block.trim()) continue;

      const lines = block.split('\n');
      const eventLine = lines.find(l => l.startsWith('event: '));
      const dataLine = lines.find(l => l.startsWith('data: '));
      if (!dataLine) continue;

      const eventType = eventLine ? eventLine.slice(7).trim() : 'message';
      const data = JSON.parse(dataLine.slice(6));

      if (eventType === 'progress' && onProgress) {
        onProgress(data as ProgressEvent);
      } else if (eventType === 'result') {
        reader.cancel();
        const d = data;
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
      } else if (eventType === 'error') {
        throw new Error(data.message ?? 'Generation failed');
      }
    }
  }

  throw new Error('Stream ended without a result event');
};
