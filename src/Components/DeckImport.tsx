import React, { useState } from 'react';
import styled from 'styled-components';
import * as XLSX from 'xlsx';

interface DeckCard {
  name: string;
  collector_number: string;
}

const DeckImport: React.FC = () => {
  const [deckCards, setDeckCards] = useState<DeckCard[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = (file: File) => {
    const fileExtension = file.name.split('.').pop();
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        if (fileExtension === 'json') {
          const result = JSON.parse(e.target?.result as string);
          setDeckCards(result);
        } else if (fileExtension === 'xlsx' || fileExtension === 'csv') {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const json: DeckCard[] = XLSX.utils.sheet_to_json(sheet);
          setDeckCards(json);
        } else {
          alert('Unsupported file format. Please use JSON, XLSX, or CSV.');
        }
      } catch (err) {
        console.error('File parsing error', err);
        alert('There was a problem parsing your file.');
      }
    };

    if (fileExtension === 'json') {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <Container>
      <Header>
        <Title>
          Upload your deck list <Information title="Accepted formats: JSON, XLSX, CSV">i</Information>
        </Title>
      </Header>

      {
        deckCards.length > 0 ? 
        
        <CardPreview>
          {deckCards.map((card, index) => (
            <div key={index}>{card.name} (#{card.collector_number})</div>
          ))}
        </CardPreview>
        : <UploadArea
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
          <input type="file" accept=".json,.xlsx,.csv" onChange={handleInputChange} hidden />
        </label>
      </UploadArea>}

    </Container>
  );
};

export default DeckImport;

const Header = styled.div`

`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  padding: 2rem;
`;

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