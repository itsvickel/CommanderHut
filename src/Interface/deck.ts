// interfaces/deck.ts
import { Card } from './cards';  

  export interface Deck {
    deck_name: string;
    format: 'Commander' | 'Standard' | 'Modern'; // Or any other valid formats
    deck_list: Card[]; // Array of card objects with details
    commander?: string; // Optional: For Commander decks, the commander card name
    created_at: string; // Timestamp of when the deck was created
    updated_at: string; // Timestamp of when the deck was last modified
    owner_id: string; // User ID who owns this deck
    tags?: string[]; // Optional: Tags or keywords for categorizing the deck
    is_public: boolean; // Whether the deck is public or private
  }
  