// interfaces/deck.ts 

  export interface Deck {
    deck_name: string;
    format:  'Commander' | 'Standard' | 'Modern' | 'Pioneer' | 'Legacy' | 'Vintage' | string; // Or any other valid formats
    deck_list: { card: string; quantity: number }[]; // Array of card objects with details
    commander?: string; // Optional: For Commander decks, the commander card name
    commander_image?: string; // Optional: Commander card image URI
    created_at: string; // Timestamp of when the deck was created
    updated_at: string; // Timestamp of when the deck was last modified
    owner_id?: string; // User ID who owns this deck (legacy)
    owner?: string; // User ID who owns this deck
    tags?: string[]; // Optional: Tags or keywords for categorizing the deck
    is_public: boolean; // Whether the deck is public or private
  }
  