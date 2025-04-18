// interfaces/card.ts

export interface ImageUris {
    small?: string;
    normal?: string;
    large?: string;
    png?: string;
    art_crop?: string;
    border_crop?: string;
  }
  
  export type Format =
    | "standard"
    | "modern"
    | "legacy"
    | "vintage"
    | "commander"
    | "brawl"
    | "duel"
    | "penny"
    | "predh"
    | "future";
  
  export type LegalityStatus = "legal" | "not_legal" | "restricted" | "banned";
  
  export type Legalities = {
    [key in Format]?: LegalityStatus;
  };
  
  export interface Card {
    name: string;
    mana_cost?: string;
    type_line?: string;
    oracle_text?: string;
    colors?: string[]; // parsed from comma-separated or array string
    set?: string; // short code like "2xm"
    set_name?: string;
    collector_number?: string;
    artist?: string;
    released_at?: string; // or Date if you prefer
    image_uris: ImageUris;
    legalities?: Legalities;
    layout?: string;
  }
  