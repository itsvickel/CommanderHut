export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface CardEntry {
  _id: string;
  name: string;
  quantity: number;
  role: string;
  image_uris: Record<string, string>;
}

export interface ParsedDeck {
  generationId?: string;
  commander: string;
  commanderImageUri?: string;
  commanderReason?: string;
  cards: CardEntry[];
  strategy?: string;
  themes?: string[];
  rawText?: string;
}

export interface DeckDiffAdd {
  _id: string;
  name: string;
  role: string;
  image_uris?: Record<string, string>;
  prices?: { usd?: number | null };
  type_line?: string;
}

export interface DeckDiffCut {
  _id: string;
  name: string;
  reason: string;
  image_uris?: Record<string, string>;
}

/** Pending refinement the user can accept or discard. */
export interface DeckDiff {
  adds: DeckDiffAdd[];
  cuts: DeckDiffCut[];
  summary: string;
}
