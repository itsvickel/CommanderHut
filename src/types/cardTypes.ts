// Define the structure of a card object
export interface Card {
  id: string;
  name: string;
  type_line: string;
  set: string;
  rarity: string;
  mana_cost: string;
  colors: string[];
  cmc: number; // Converted Mana Cost
  image_uris: {
    normal: string;
    large: string;
  };
  oracle_text: string;
}

// Define the structure of a linkItem
export interface linkItem {
  image_uris: [{
    name: string;
    to: string;
  }];
}
