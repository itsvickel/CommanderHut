export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ParsedDeck {
  commander: string;
  cards: string[];   // the 99 non-commander cards
  rawText: string;   // original AI response, kept for debugging
}
