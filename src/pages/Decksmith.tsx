// src/pages/Decksmith.tsx
import { useState } from 'react';
import styled from 'styled-components';
import { Message, ParsedDeck } from '../types/chat';
import { buildPromptFromMessages } from '../utils/chatPrompt';
import { parseDeckFromAIText } from '../utils/parseDeckFromAIText';
import { fetchMTGIdea } from '../services/aiService';
import MessageList from '../Components/Chat/MessageList';
import ChatInput from '../Components/Chat/ChatInput';
import DeckPanel from '../Components/Decksmith/DeckPanel';

const Decksmith = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentDeck, setCurrentDeck] = useState<ParsedDeck | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSend = async (text: string) => {
    const userMsg: Message = { role: 'user', content: text, timestamp: Date.now() };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setLoading(true);

    try {
      const prompt = buildPromptFromMessages(nextMessages);
      const aiText = await fetchMTGIdea(prompt);
      const deck = parseDeckFromAIText(aiText);

      const aiMsg: Message = {
        role: 'assistant',
        content: deck ? aiText : 'No deck found — try rephrasing your request.',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, aiMsg]);
      if (deck) setCurrentDeck(deck);
    } catch {
      const errorMsg: Message = {
        role: 'assistant',
        content: 'Something went wrong. Please try again.',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <ChatColumn>
        <MessageList messages={messages} loading={loading} />
        <ChatInput onSend={handleSend} disabled={loading} />
      </ChatColumn>
      <DeckColumn>
        <DeckPanel deck={currentDeck} />
      </DeckColumn>
    </Layout>
  );
};

export default Decksmith;

const Layout = styled.div`
  display: flex;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #f9fafb;
`;

const ChatColumn = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
`;

const DeckColumn = styled.div`
  width: 360px;
  flex-shrink: 0;
  overflow: hidden;
`;
