interface DeckCard {
  name: string;
  collector_number: string;
}

interface DeckExportProps {
  onExport: (cards: DeckCard[]) => void;
}

const DeckExport: React.FC<DeckExportProps> = ({ onExport }) => {

  // To PDF, cvs, text, mtgarena,

  const handleExport = (exportType: File) => {

    return File;
  }

  return (
    <div className="flex flex-col p-8">

    </div>
  );
};

export default DeckExport;
