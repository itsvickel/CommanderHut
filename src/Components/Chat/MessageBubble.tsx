// src/Components/Chat/MessageBubble.tsx
import { Message } from '../../types/chat';

interface Props {
  message: Message;
}

const MessageBubble = ({ message }: Props) => {
  const isUser = message.role === 'user';
  return (
    <div
      className={[
        'max-w-[75%] px-[0.9rem] py-[0.6rem] text-[0.9rem] leading-[1.5] whitespace-pre-wrap',
        isUser
          ? 'self-end bg-[#2563eb] text-white border-none rounded-[12px_12px_2px_12px]'
          : 'self-start bg-white text-[#111827] border border-[#e5e7eb] rounded-[12px_12px_12px_2px]',
      ].join(' ')}
    >
      {message.content}
    </div>
  );
};

export default MessageBubble;
