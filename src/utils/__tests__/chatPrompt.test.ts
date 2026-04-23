import { buildPromptFromMessages } from '../chatPrompt';
import { Message } from '../../types/chat';

describe('buildPromptFromMessages', () => {
  it('includes system prompt when messages is empty', () => {
    const result = buildPromptFromMessages([]);
    expect(result).toContain('You are a Magic: The Gathering Commander deck-building assistant.');
    expect(result).not.toContain('User:');
    expect(result).not.toContain('Assistant:');
  });

  it('prefixes a user message with "User:"', () => {
    const messages: Message[] = [
      { role: 'user', content: 'Build me a deck', timestamp: 1 },
    ];
    const result = buildPromptFromMessages(messages);
    expect(result).toContain('User: Build me a deck');
  });

  it('prefixes an assistant message with "Assistant:"', () => {
    const messages: Message[] = [
      { role: 'assistant', content: 'Here is your deck', timestamp: 1 },
    ];
    const result = buildPromptFromMessages(messages);
    expect(result).toContain('Assistant: Here is your deck');
  });

  it('interleaves User: and Assistant: lines for multi-turn conversations', () => {
    const messages: Message[] = [
      { role: 'user', content: 'Build a deck', timestamp: 1 },
      { role: 'assistant', content: 'Here is your deck', timestamp: 2 },
      { role: 'user', content: 'Make it budget', timestamp: 3 },
    ];
    const result = buildPromptFromMessages(messages);
    const lines = result.split('\n');
    expect(lines).toContain('User: Build a deck');
    expect(lines).toContain('Assistant: Here is your deck');
    expect(lines).toContain('User: Make it budget');
  });
});
