// src/Components/Chat/ChatInput.tsx
import { useState, KeyboardEvent } from 'react';
import styled from 'styled-components';

interface Props {
  onSend: (text: string) => void;
  disabled: boolean;
}

const ChatInput = ({ onSend, disabled }: Props) => {
  const [text, setText] = useState('');

  const submit = () => {
    if (!text.trim() || disabled) return;
    onSend(text.trim());
    setText('');
  };

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <Bar>
      <Textarea
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={handleKey}
        placeholder="Ask anything about your Commander deck… (Enter to send)"
        disabled={disabled}
        rows={2}
      />
      <SendButton onClick={submit} disabled={disabled || !text.trim()}>
        Send
      </SendButton>
    </Bar>
  );
};

export default ChatInput;

const Bar = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: flex-end;
  padding: 0.75rem 1rem;
  border-top: 1px solid #e5e7eb;
  background: white;
`;

const Textarea = styled.textarea`
  flex: 1;
  resize: none;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  font-size: 0.9rem;
  font-family: inherit;
  line-height: 1.4;
  &:focus { outline: none; border-color: #2563eb; }
  &:disabled { background: #f9fafb; cursor: not-allowed; }
`;

const SendButton = styled.button`
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.5rem 1.25rem;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  white-space: nowrap;
  &:disabled { background: #93c5fd; cursor: not-allowed; }
`;
