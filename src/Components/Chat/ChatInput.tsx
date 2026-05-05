// src/Components/Chat/ChatInput.tsx
import { useState, KeyboardEvent } from 'react';

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
    <div className="flex gap-2 items-end px-4 py-3 border-t border-[#e5e7eb] bg-white">
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={handleKey}
        placeholder="Ask anything about your Commander deck… (Enter to send)"
        disabled={disabled}
        rows={2}
        className="flex-1 resize-none border border-[#d1d5db] rounded-lg px-3 py-2 text-[0.9rem] font-[inherit] leading-[1.4] focus:outline-none focus:border-[#2563eb] disabled:bg-[#f9fafb] disabled:cursor-not-allowed"
      />
      <button
        onClick={submit}
        disabled={disabled || !text.trim()}
        className="bg-[#2563eb] text-white border-none rounded-lg px-5 py-2 font-semibold text-[0.9rem] cursor-pointer whitespace-nowrap disabled:bg-[#93c5fd] disabled:cursor-not-allowed"
      >
        Send
      </button>
    </div>
  );
};

export default ChatInput;
