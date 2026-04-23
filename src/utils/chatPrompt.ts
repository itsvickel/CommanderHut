import { Message } from '../types/chat';

const SYSTEM_PROMPT = `You are a Magic: The Gathering Commander deck-building assistant.
Always respond with a 100-card singleton Commander deck.
Format every card name in **bold** like this: **Card Name**
Include exactly one commander, listed first.`;

export function buildPromptFromMessages(messages: Message[]): string {
  const conversation = messages
    .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n');
  return conversation.length > 0
    ? `${SYSTEM_PROMPT}\n\n${conversation}`
    : SYSTEM_PROMPT;
}
