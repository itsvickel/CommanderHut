// src/Components/Chat/MessageList.tsx
import { useEffect, useRef } from 'react';
import { Message } from '../../types/chat';
import MessageBubble from './MessageBubble';

interface Props {
  messages: Message[];
  loading: boolean;
}

const MessageList = ({ messages, loading }: Props) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  return (
    <div className="flex-1 overflow-y-auto flex flex-col gap-2 p-4">
      {messages.map(msg => (
        <MessageBubble key={msg.timestamp} message={msg} />
      ))}
      {loading && (
        <div className="self-start bg-[#f3f4f6] text-[#6b7280] rounded-[12px_12px_12px_2px] px-[0.9rem] py-[0.6rem] text-[0.9rem] italic">
          Thinking…
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
};

export default MessageList;
