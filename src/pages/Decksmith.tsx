import { useState } from 'react';
import { Message, ParsedDeck } from '../types/chat';
import { buildPromptFromMessages } from '../utils/chatPrompt';
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
      const deck = await fetchMTGIdea(prompt);

      const aiMsg: Message = {
        role: 'assistant',
        content: deck.strategy
          ? `Here's your **${deck.commander}** deck!\n\n${deck.strategy}`
          : `Here's your **${deck.commander}** deck!`,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, aiMsg]);
      setCurrentDeck(deck);
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
    <div className="fixed top-0 left-0 right-0 bottom-0 flex overflow-hidden bg-gray-50 dark:bg-gray-900" style={{ paddingTop: '72px' }}>
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
        <MessageList messages={messages} loading={loading} />
        <ChatInput onSend={handleSend} disabled={loading} />
      </div>
      <div className="overflow-hidden flex-shrink-0" style={{ width: '360px' }}>
        <DeckPanel deck={currentDeck} />
      </div>
    </div>
  );
};

export default Decksmith;
