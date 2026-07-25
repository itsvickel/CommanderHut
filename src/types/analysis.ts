export interface DeckStats {
  total_cards: number;
  lands: number;
  nonland_cards: number;
  average_mana_value: number;
  curve: Record<string, number>;
  type_counts: Record<string, number>;
  role_counts: Record<string, number>;
  color_pips: Record<string, number>;
  game_changers: string[];
  off_identity: string[];
  estimated_bracket: number;
  total_price_usd: number;
}

export interface UpgradeSuggestion {
  _id: string;
  name: string;
  reason: string;
  image_uris?: Record<string, string>;
  prices?: { usd?: number | null };
}

export interface DeckAnalysis {
  stats: DeckStats;
  observations: string[];
  verdict: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: UpgradeSuggestion[];
}
