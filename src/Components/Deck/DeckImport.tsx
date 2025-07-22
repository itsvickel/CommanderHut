import * as XLSX from 'xlsx';
import React, { useState } from 'react';
import styled from 'styled-components';

interface DeckCard {
  name: string;
  collector_number: string;
}

interface DeckImportProps {
  onImport: (cards: DeckCard[]) => void;
}

const DeckImport: React.FC<DeckImportProps> = ({ onImport }) => {
  const [dragActive, setDragActive] = useState(false);
  const [previewCards, setPreviewCards] = useState<DeckCard[]>([]);

  const handleFile = (file: File) => {
    const fileExtension = file.name.split('.').pop();
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;

        console.log('File content:', text); // Debug: log file content
        
        // Ensure the file content is a string
        if (!text || typeof text !== 'string') {
          throw new Error('File content is not a valid string');
        }

        if (fileExtension === 'json') {
          const result: DeckCard[] = JSON.parse(text);
          setPreviewCards(result);
          onImport(result);
        } else if (fileExtension === 'xlsx' || fileExtension === 'csv') {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const json: DeckCard[] = XLSX.utils.sheet_to_json(sheet);
          setPreviewCards(json);
          onImport(json);
        } else if (fileExtension === 'txt') {
          // Ensure the file content is a string and process it
          const lines = text.split('\n').map((line) => {
            const parts = line.trim().split(' '); // Split by space
            const cardWithCollector = parts.slice(1).join(' '); // The rest is the card name with collector number (if present)
            const collectorMatch = cardWithCollector.match(/\((\d+)\)/); // Match the collector number in parentheses

            const name = collectorMatch ? cardWithCollector.replace(collectorMatch[0], '').trim() : cardWithCollector;
            const collector_number = collectorMatch ? collectorMatch[1] : '';

            return { name, collector_number };
          });

          setPreviewCards(lines);
          onImport(lines);
        } else {
          alert('Unsupported file format. Please use JSON, XLSX, CSV, or TXT.');
        }
      } catch (err) {
        console.error('File parsing error', err);
        alert('There was a problem parsing your file.');
      }
    };

    // Ensure reading the file as text, especially for .txt files
    if (fileExtension === 'json' || fileExtension === 'txt') {
      reader.readAsText(file); // Read as text for .txt files
    } else {
      reader.readAsArrayBuffer(file); // Read as array buffer for binary files (xlsx, csv)
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      handleFile(e.target.files[0]);
    }
  };

  // Group the cards by name and count duplicates
  const countCards = (cards: DeckCard[]) => {
    const cardCountMap: { [key: string]: number } = {};
    cards.forEach((card) => {
      const key = card.name;
      cardCountMap[key] = (cardCountMap[key] || 0) + 1;
    });
    return cardCountMap;
  };

  const cardCountMap = countCards(previewCards);

  return (
    <Container>
      <Header>
        <Title>
          Upload your deck list{' '}
          <Information title="Accepted formats: JSON, XLSX, CSV, TXT">i</Information>
        </Title>
      </Header>

      {previewCards.length > 0 ? (
        <CardPreview>
 
        </CardPreview>
      ) : (
        <UploadArea
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          dragActive={dragActive}
        >
          <label>
            Drag and drop your file or <span className="browse">browse</span> your computer
            <input type="file" accept=".json,.xlsx,.csv,.txt" onChange={handleInputChange} hidden />
          </label>
        </UploadArea>
      )}
    </Container>
  );
};

export default DeckImport;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  padding: 2rem;
`;

const Header = styled.div``;

const Title = styled.h1`
  font-size: 1.5rem;
`;

const Information = styled.span`
  font-style: italic;
  font-weight: bold;
  cursor: help;
`;

const UploadArea = styled.div<{ dragActive: boolean }>`
  margin-top: 1rem;
  padding: 2rem;
  border: 2px dashed #ccc;
  border-color: ${({ dragActive }) => (dragActive ? '#00bfff' : '#ccc')};
  border-radius: 10px;
  text-align: center;
  color: #666;
  .browse {
    color: #007bff;
    cursor: pointer;
  }
`;

const CardPreview = styled.div`
  margin-top: 2rem;
  font-family: monospace;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;
