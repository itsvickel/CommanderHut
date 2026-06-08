import { useState } from 'react';
import { Message, ParsedDeck } from '../types/chat';
import { buildPromptFromMessages } from '../utils/chatPrompt';
import { fetchMTGIdea, ProgressEvent } from '../services/aiService';
import MessageList from '../Components/Chat/MessageList';
import ChatInput from '../Components/Chat/ChatInput';
import DeckPanel from '../Components/Decksmith/DeckPanel';
import GenerationProgress from '../Components/UI_Components/GenerationProgress';

const GENERATION_STAGES = [
  { id: 'generating', label: 'Generating deck concept' },
  { id: 'validating_commander', label: 'Validating commander' },
  { id: 'commander', label: 'Commander confirmed' },
  { id: 'validating_cards', label: 'Validating cards' },
  { id: 'filling', label: 'Filling remaining slots' },
  { id: 'finalising', label: 'Finalising deck' },
];

const Decksmith = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentDeck, setCurrentDeck] = useState<ParsedDeck | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeStage, setActiveStage] = useState<string | null>(null);
  const [activeMessage, setActiveMessage] = useState<string>('');
  const [completedStages, setCompletedStages] = useState<string[]>([]);
  const [progressError, setProgressError] = useState<{ stage: string; message: string } | null>(null);

  const handleProgress = (event: ProgressEvent) => {
    setActiveStage(event.stage);
    setActiveMessage(event.message);
    setCompletedStages(() => {
      const idx = GENERATION_STAGES.findIndex(s => s.id === event.stage);
      if (idx <= 0) return [];
      return GENERATION_STAGES.slice(0, idx).map(s => s.id);
    });
  };

  const handleSend = async (text: string) => {
    const userMsg: Message = { role: 'user', content: text, timestamp: Date.now() };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setLoading(true);
    setCurrentDeck(null);
    setCompletedStages([]);
    setActiveStage(null);
    setActiveMessage('');
    setProgressError(null);

    try {
      const prompt = buildPromptFromMessages(nextMessages);
      const deck = await fetchMTGIdea(prompt, handleProgress);

      setCompletedStages(GENERATION_STAGES.map(s => s.id));
      setActiveStage(null);

      const aiMsg: Message = {
        role: 'assistant',
        content: deck.strategy
          ? `Here's your **${deck.commander}** deck!\n\n${deck.strategy}`
          : `Here's your **${deck.commander}** deck!`,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, aiMsg]);
      setCurrentDeck(deck);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong.';
      setProgressError({ stage: activeStage ?? 'generating', message: errorMessage });
      const errorMsg: Message = {
        role: 'assistant',
        content: `Something went wrong: ${errorMessage}`,
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
      <div className="overflow-hidden flex-shrink-0 flex flex-col" style={{ width: '360px' }}>
        {loading ? (
          <GenerationProgress
            stages={GENERATION_STAGES}
            activeStage={activeStage}
            activeMessage={activeMessage}
            completedStages={completedStages}
            error={progressError}
          />
        ) : (
          <DeckPanel deck={currentDeck} />
        )}
      </div>
    </div>
  );
};

export default Decksmith;
