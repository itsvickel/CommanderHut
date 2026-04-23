// src/Components/Chat/MessageBubble.tsx
import styled from 'styled-components';
import { Message } from '../../types/chat';

interface Props {
  message: Message;
}

const MessageBubble = ({ message }: Props) => (
  <Bubble $isUser={message.role === 'user'}>
    {message.content}
  </Bubble>
);

export default MessageBubble;

const Bubble = styled.div<{ $isUser: boolean }>`
  align-self: ${({ $isUser }) => ($isUser ? 'flex-end' : 'flex-start')};
  background: ${({ $isUser }) => ($isUser ? '#2563eb' : '#ffffff')};
  color: ${({ $isUser }) => ($isUser ? '#ffffff' : '#111827')};
  border: ${({ $isUser }) => ($isUser ? 'none' : '1px solid #e5e7eb')};
  border-radius: ${({ $isUser }) =>
    $isUser ? '12px 12px 2px 12px' : '12px 12px 12px 2px'};
  padding: 0.6rem 0.9rem;
  max-width: 75%;
  font-size: 0.9rem;
  line-height: 1.5;
  white-space: pre-wrap;
`;
