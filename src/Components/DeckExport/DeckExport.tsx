 

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
    <Container>
      
    </Container>
  );
};

export default DeckExport;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  padding: 2rem;
`;
 