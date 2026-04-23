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
  generationId: string;
  commander: string;
  commanderImageUri: string;
  cards: CardEntry[];
  strategy: string;
}
