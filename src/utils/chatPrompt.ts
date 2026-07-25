import { Message } from '../types/chat';

// The backend owns the system prompt and output format (admin-editable
// master prompt + JSON schema). The frontend only sends the conversation.
export function buildPromptFromMessages(messages: Message[]): string {
  return messages
    .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n');
}
