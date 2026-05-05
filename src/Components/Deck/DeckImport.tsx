import * as XLSX from 'xlsx';
import React, { useState } from 'react';

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
    <div className="flex flex-col p-8">
      <div>
        <h1 className="text-[1.5rem]">
          Upload your deck list
          <span className="italic font-bold cursor-help" title="Accepted formats: JSON, XLSX, CSV, TXT">i</span>
        </h1>
      </div>

      {previewCards.length > 0 ? (
        <div className="mt-8 font-mono flex flex-col gap-2">
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={`mt-4 p-8 border-2 border-dashed rounded-[10px] text-center text-[#666] ${dragActive ? 'border-[#00bfff]' : 'border-[#ccc]'}`}
        >
          <label>
            Drag and drop your file or <span className="text-[#007bff] cursor-pointer">browse</span> your computer
            <input type="file" accept=".json,.xlsx,.csv,.txt" onChange={handleInputChange} hidden />
          </label>
        </div>
      )}
    </div>
  );
};

export default DeckImport;
