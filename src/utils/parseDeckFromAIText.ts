import { ParsedDeck } from '../types/chat';

const BOLD_CARD = /\*\*(.+?)\*\*/g;

export function parseDeckFromAIText(text: string): ParsedDeck | null {
  const matches = [...text.matchAll(BOLD_CARD)].map(m => m[1]);
  if (matches.length < 2) return null;
  return { commander: matches[0], cards: matches.slice(1), rawText: text };
}
