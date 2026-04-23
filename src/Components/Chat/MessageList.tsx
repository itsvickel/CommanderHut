// src/Components/Chat/MessageList.tsx
import { useEffect, useRef } from 'react';
import styled from 'styled-components';
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
    <List>
      {messages.map(msg => (
        <MessageBubble key={msg.timestamp} message={msg} />
      ))}
      {loading && <ThinkingBubble>Thinking…</ThinkingBubble>}
      <div ref={bottomRef} />
    </List>
  );
};

export default MessageList;

const List = styled.div`
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
`;

const ThinkingBubble = styled.div`
  align-self: flex-start;
  background: #f3f4f6;
  color: #6b7280;
  border-radius: 12px 12px 12px 2px;
  padding: 0.6rem 0.9rem;
  font-size: 0.9rem;
  font-style: italic;
`;
