 

interface DeckCard {
  name: string;
  collector_number: string;
}

interface DeckExportProps {
  onExport: (cards: DeckCard[]) => void;
}

const DeckExport: React.FC<DeckExportProps> = () => {
  return null;
};

export default DeckExport; 