// src/Components/Chat/MessageList.tsx
import { useEffect, useRef } from 'react';
import { Message } from '../../types/chat';
import MessageBubble from './MessageBubble';
import GenerationProgress from '../UI_Components/GenerationProgress';

const GENERATION_STAGES = [
  { id: 'generating',           label: 'Generating deck concept' },
  { id: 'validating_commander', label: 'Validating commander' },
  { id: 'commander',            label: 'Commander confirmed' },
  { id: 'validating_cards',     label: 'Validating cards' },
  { id: 'filling',              label: 'Filling remaining slots' },
  { id: 'finalising',           label: 'Finalising deck' },
];

export interface ProgressState {
  activeStage: string | null;
  activeMessage: string;
  completedStages: string[];
  error: { stage: string; message: string } | null;
}

interface Props {
  messages: Message[];
  loading: boolean;
  progress?: ProgressState;
}

const MessageList = ({ messages, loading, progress }: Props) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  return (
    <div className="flex-1 overflow-y-auto flex flex-col gap-2 p-4 bg-white dark:bg-gray-900">
      {messages.map(msg => (
        <MessageBubble key={msg.timestamp} message={msg} />
      ))}
      {loading && progress && (
        <div className="self-start max-w-sm bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-sm px-3 py-2 border border-gray-200 dark:border-gray-700">
          <GenerationProgress
            stages={GENERATION_STAGES}
            activeStage={progress.activeStage}
            activeMessage={progress.activeMessage}
            completedStages={progress.completedStages}
            error={progress.error}
          />
        </div>
      )}
      {loading && !progress && (
        <div className="self-start bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm italic">
          Thinking…
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
};

export default MessageList;
