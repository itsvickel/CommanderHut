# AI Chat Deck Generation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single-shot `/decksmith` page with a ChatGPT-style multi-turn chat interface that builds and refines Commander decks via AI, with a persistent deck panel on the right.

**Architecture:** All state lives in a new `Decksmith.tsx` page; two pure-function utilities (`chatPrompt.ts`, `parseDeckFromAIText.ts`) handle prompt construction and card extraction; six new components (3 chat, 2 deck panel, 1 types file) handle rendering. No backend changes — reuses existing `fetchMTGIdea` and `postDeckList` services.

**Tech Stack:** React 19, TypeScript, styled-components, Redux Toolkit (auth read-only), existing `aiService.ts` + `deckService.ts`

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Create | `src/types/chat.ts` | `Message` + `ParsedDeck` interfaces |
| Create | `src/utils/chatPrompt.ts` | Concatenate message history into AI prompt string |
| Create | `src/utils/__tests__/chatPrompt.test.ts` | Unit tests for chatPrompt |
| Create | `src/utils/parseDeckFromAIText.ts` | Extract bold card names from AI response |
| Create | `src/utils/__tests__/parseDeckFromAIText.test.ts` | Unit tests for parser |
| Create | `src/Components/Chat/MessageBubble.tsx` | Single chat bubble (user or assistant) |
| Create | `src/Components/Chat/MessageList.tsx` | Scrollable transcript with auto-scroll |
| Create | `src/Components/Chat/ChatInput.tsx` | Textarea + Send button |
| Create | `src/Components/Decksmith/DeckPanelEmpty.tsx` | Placeholder shown before first deck |
| Create | `src/Components/Decksmith/DeckPanel.tsx` | Right-panel deck list + Save button |
| Create | `src/pages/Decksmith.tsx` | Page shell — all state lives here |
| Modify | `src/App.tsx` | Swap `<AIGenerate />` → `<Decksmith />` on `/decksmith` route |
| Delete | `src/pages/AIGenerate.tsx` | Replaced by Decksmith |
| Delete | `src/pages/__tests__/AIGenerate.test.tsx` | Tests for deleted page |

---

## Task 1: Define shared types

**Files:**
- Create: `src/types/chat.ts`

- [ ] **Step 1: Create the types file**

```ts
// src/types/chat.ts
export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ParsedDeck {
  commander: string;
  cards: string[];   // the 99 non-commander cards
  rawText: string;   // original AI response, kept for debugging
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/chat.ts
git commit -m "feat: add Message and ParsedDeck types for AI chat feature"
```

---

## Task 2: chatPrompt utility (TDD)

**Files:**
- Create: `src/utils/chatPrompt.ts`
- Create: `src/utils/__tests__/chatPrompt.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/utils/__tests__/chatPrompt.test.ts
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
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx jest src/utils/__tests__/chatPrompt.test.ts --no-coverage
```

Expected: FAIL — `Cannot find module '../chatPrompt'`

- [ ] **Step 3: Implement chatPrompt.ts**

```ts
// src/utils/chatPrompt.ts
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
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx jest src/utils/__tests__/chatPrompt.test.ts --no-coverage
```

Expected: PASS — 4 tests pass

- [ ] **Step 5: Commit**

```bash
git add src/utils/chatPrompt.ts src/utils/__tests__/chatPrompt.test.ts
git commit -m "feat: add buildPromptFromMessages utility with tests"
```

---

## Task 3: parseDeckFromAIText utility (TDD)

**Files:**
- Create: `src/utils/parseDeckFromAIText.ts`
- Create: `src/utils/__tests__/parseDeckFromAIText.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/utils/__tests__/parseDeckFromAIText.test.ts
import { parseDeckFromAIText } from '../parseDeckFromAIText';

describe('parseDeckFromAIText', () => {
  it('returns null when text has no bold tokens', () => {
    expect(parseDeckFromAIText('No cards here at all')).toBeNull();
  });

  it('returns null when text has exactly one bold token', () => {
    expect(parseDeckFromAIText('Just **One Card** in here')).toBeNull();
  });

  it('sets the first bold token as commander', () => {
    const text = '**Rhys the Redeemed** leads **Avenger of Zendikar** and **Path to Exile**';
    const result = parseDeckFromAIText(text);
    expect(result).not.toBeNull();
    expect(result!.commander).toBe('Rhys the Redeemed');
  });

  it('puts remaining bold tokens in cards array', () => {
    const text = '**Rhys the Redeemed** leads **Avenger of Zendikar** and **Path to Exile**';
    const result = parseDeckFromAIText(text);
    expect(result!.cards).toEqual(['Avenger of Zendikar', 'Path to Exile']);
  });

  it('handles bold tokens containing spaces and punctuation', () => {
    const text = '**Atraxa, Praetors Voice** and **Sol Ring** here';
    const result = parseDeckFromAIText(text);
    expect(result!.commander).toBe('Atraxa, Praetors Voice');
    expect(result!.cards).toEqual(['Sol Ring']);
  });

  it('stores the original full text in rawText', () => {
    const text = '**Commander A** and **Card B** — extra prose here';
    const result = parseDeckFromAIText(text);
    expect(result!.rawText).toBe(text);
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx jest src/utils/__tests__/parseDeckFromAIText.test.ts --no-coverage
```

Expected: FAIL — `Cannot find module '../parseDeckFromAIText'`

- [ ] **Step 3: Implement parseDeckFromAIText.ts**

```ts
// src/utils/parseDeckFromAIText.ts
import { ParsedDeck } from '../types/chat';

const BOLD_CARD = /\*\*(.+?)\*\*/g;

export function parseDeckFromAIText(text: string): ParsedDeck | null {
  const matches = [...text.matchAll(BOLD_CARD)].map(m => m[1]);
  if (matches.length < 2) return null;
  return { commander: matches[0], cards: matches.slice(1), rawText: text };
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx jest src/utils/__tests__/parseDeckFromAIText.test.ts --no-coverage
```

Expected: PASS — 6 tests pass

- [ ] **Step 5: Run both util test suites together**

```bash
npx jest src/utils/__tests__/ --no-coverage
```

Expected: PASS — 10 tests pass across 2 suites

- [ ] **Step 6: Commit**

```bash
git add src/utils/parseDeckFromAIText.ts src/utils/__tests__/parseDeckFromAIText.test.ts
git commit -m "feat: add parseDeckFromAIText utility with tests"
```

---

## Task 4: Chat components

**Files:**
- Create: `src/Components/Chat/MessageBubble.tsx`
- Create: `src/Components/Chat/MessageList.tsx`
- Create: `src/Components/Chat/ChatInput.tsx`

- [ ] **Step 1: Create MessageBubble**

```tsx
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
```

- [ ] **Step 2: Create MessageList**

```tsx
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
```

- [ ] **Step 3: Create ChatInput**

```tsx
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
```

- [ ] **Step 4: Commit**

```bash
git add src/Components/Chat/
git commit -m "feat: add MessageBubble, MessageList, and ChatInput components"
```

---

## Task 5: Deck panel components

**Files:**
- Create: `src/Components/Decksmith/DeckPanelEmpty.tsx`
- Create: `src/Components/Decksmith/DeckPanel.tsx`

- [ ] **Step 1: Create DeckPanelEmpty**

```tsx
// src/Components/Decksmith/DeckPanelEmpty.tsx
import styled from 'styled-components';

const DeckPanelEmpty = () => (
  <Wrapper>
    <Icon>🃏</Icon>
    <Heading>Your deck will appear here</Heading>
    <Hint>Try: "Build me a Selesnya tokens Commander deck with Rhys the Redeemed"</Hint>
  </Wrapper>
);

export default DeckPanelEmpty;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 0.75rem;
  text-align: center;
  padding: 2rem 1.5rem;
  background: white;
`;

const Icon = styled.div`font-size: 2.5rem;`;

const Heading = styled.p`
  font-weight: 600;
  color: #374151;
  font-size: 1rem;
  margin: 0;
`;

const Hint = styled.p`
  font-size: 0.82rem;
  color: #6b7280;
  margin: 0;
`;
```

- [ ] **Step 2: Create DeckPanel**

```tsx
// src/Components/Decksmith/DeckPanel.tsx
import { useState } from 'react';
import styled from 'styled-components';
import { useSelector } from 'react-redux';
import { ParsedDeck } from '../../types/chat';
import { postDeckList } from '../../services/deckService';
import { RootState } from '../../store';
import DeckPanelEmpty from './DeckPanelEmpty';

interface Props {
  deck: ParsedDeck | null;
}

type SaveStatus = 'idle' | 'saving' | 'success' | 'error';

const DeckPanel = ({ deck }: Props) => {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  if (!deck) return <DeckPanelEmpty />;

  const handleSave = async () => {
    if (!isAuthenticated || saveStatus === 'saving') return;
    setSaveStatus('saving');
    try {
      await postDeckList({
        commander: deck.commander,
        cards: deck.cards,
        name: `${deck.commander} deck`,
        format: 'Commander',
      });
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
    }
  };

  return (
    <Panel>
      <Header>
        <DeckTitle>{deck.commander}</DeckTitle>
        <Meta>Commander · {deck.cards.length + 1} cards</Meta>
      </Header>

      <CardList>
        <CardRow><strong>{deck.commander}</strong> — Commander</CardRow>
        {deck.cards.map((name, i) => (
          <CardRow key={i}>{name}</CardRow>
        ))}
      </CardList>

      <Footer>
        {!isAuthenticated ? (
          <AuthNote>Sign in to save your deck</AuthNote>
        ) : (
          <SaveButton onClick={handleSave} disabled={saveStatus === 'saving'}>
            {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'success' ? 'Saved!' : 'Save Deck'}
          </SaveButton>
        )}
        {saveStatus === 'error' && <ErrorNote>Save failed — try again</ErrorNote>}
      </Footer>
    </Panel>
  );
};

export default DeckPanel;

const Panel = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
  border-left: 1px solid #e5e7eb;
`;

const Header = styled.div`
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
`;

const DeckTitle = styled.h3`
  margin: 0 0 0.25rem;
  font-size: 1rem;
  font-weight: 700;
  color: #111827;
`;

const Meta = styled.p`
  margin: 0;
  font-size: 0.8rem;
  color: #6b7280;
`;

const CardList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
`;

const CardRow = styled.div`
  font-size: 0.82rem;
  color: #374151;
  padding: 0.2rem 0;
  border-bottom: 1px solid #f9fafb;
`;

const Footer = styled.div`
  padding: 0.75rem 1rem;
  border-top: 1px solid #e5e7eb;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
`;

const SaveButton = styled.button`
  width: 100%;
  padding: 0.6rem;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  &:disabled { background: #93c5fd; cursor: not-allowed; }
`;

const AuthNote = styled.p`
  font-size: 0.8rem;
  color: #6b7280;
  text-align: center;
  margin: 0;
`;

const ErrorNote = styled.p`
  font-size: 0.8rem;
  color: #dc2626;
  text-align: center;
  margin: 0;
`;
```

- [ ] **Step 3: Commit**

```bash
git add src/Components/Decksmith/
git commit -m "feat: add DeckPanel and DeckPanelEmpty components"
```

---

## Task 6: Decksmith page

**Files:**
- Create: `src/pages/Decksmith.tsx`

- [ ] **Step 1: Create Decksmith.tsx**

```tsx
// src/pages/Decksmith.tsx
import { useState } from 'react';
import styled from 'styled-components';
import { Message, ParsedDeck } from '../types/chat';
import { buildPromptFromMessages } from '../utils/chatPrompt';
import { parseDeckFromAIText } from '../utils/parseDeckFromAIText';
import { fetchMTGIdea } from '../services/aiService';
import MessageList from '../Components/Chat/MessageList';
import ChatInput from '../Components/Chat/ChatInput';
import DeckPanel from '../Components/Decksmith/DeckPanel';

const Decksmith = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentDeck, setCurrentDeck] = useState<ParsedDeck | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSend = async (text: string) => {
    const userMsg: Message = { role: 'user', content: text, timestamp: Date.now() };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setLoading(true);

    try {
      const prompt = buildPromptFromMessages(nextMessages);
      const aiText = await fetchMTGIdea(prompt);
      const deck = parseDeckFromAIText(aiText);

      const aiMsg: Message = {
        role: 'assistant',
        content: deck ? aiText : 'No deck found — try rephrasing your request.',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, aiMsg]);
      if (deck) setCurrentDeck(deck);
    } catch {
      const errorMsg: Message = {
        role: 'assistant',
        content: 'Something went wrong. Please try again.',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <ChatColumn>
        <MessageList messages={messages} loading={loading} />
        <ChatInput onSend={handleSend} disabled={loading} />
      </ChatColumn>
      <DeckColumn>
        <DeckPanel deck={currentDeck} />
      </DeckColumn>
    </Layout>
  );
};

export default Decksmith;

const Layout = styled.div`
  display: flex;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #f9fafb;
`;

const ChatColumn = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
`;

const DeckColumn = styled.div`
  width: 360px;
  flex-shrink: 0;
  overflow: hidden;
`;
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/Decksmith.tsx
git commit -m "feat: add Decksmith page with multi-turn chat and persistent deck panel"
```

---

## Task 7: Wire up routes and clean up AIGenerate

**Files:**
- Modify: `src/App.tsx`
- Delete: `src/pages/AIGenerate.tsx`
- Delete: `src/pages/__tests__/AIGenerate.test.tsx`

- [ ] **Step 1: Update App.tsx**

Open `src/App.tsx`. Make two changes:

1. Replace the `AIGenerate` import with `Decksmith`:
   ```tsx
   // Remove this line:
   import AIGenerate from './pages/AIGenerate';
   
   // Add this line in its place:
   import Decksmith from './pages/Decksmith';
   ```

2. Replace the route element:
   ```tsx
   // Change:
   <Route path="/decksmith" element={<AIGenerate />} />
   
   // To:
   <Route path="/decksmith" element={<Decksmith />} />
   ```

3. Update the nav item name (it currently reads `'AI Decksmith'`):
   ```tsx
   // Change:
   { name: 'AI Decksmith', to: '/decksmith' },
   
   // To:
   { name: 'Decksmith', to: '/decksmith' },
   ```

- [ ] **Step 2: Delete the old AIGenerate files**

```bash
rm src/pages/AIGenerate.tsx
rm src/pages/__tests__/AIGenerate.test.tsx
```

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git rm src/pages/AIGenerate.tsx src/pages/__tests__/AIGenerate.test.tsx
git commit -m "feat: wire Decksmith into router, remove AIGenerate page"
```

---

## Task 8: Build verification

- [ ] **Step 1: Run the full test suite**

```bash
npx jest --no-coverage
```

Expected: All tests pass. The deleted `AIGenerate.test.tsx` is gone so those tests no longer run. The two new util test suites pass (10 tests total).

If any test fails:
- Verify the import path in the test file matches the actual file path.
- Verify the function name exported matches the name imported in the test.

- [ ] **Step 2: Run TypeScript build**

```bash
npm run build
```

Expected: Build succeeds with no TypeScript errors.

Common errors to fix if they appear:
- `Property 'isAuthenticated' does not exist` — confirm `src/store/AuthSlice.tsx` exports `isAuthenticated` in `AuthState`. It does: `state.auth.isAuthenticated`.
- `Module not found` errors — check import paths are relative and correct.
- `noUnusedLocals` errors — remove any unused variables flagged by the compiler.

- [ ] **Step 3: Commit if any fixes were needed**

```bash
git add -p
git commit -m "fix: resolve build warnings from Decksmith integration"
```

If no fixes were needed, skip this step.
