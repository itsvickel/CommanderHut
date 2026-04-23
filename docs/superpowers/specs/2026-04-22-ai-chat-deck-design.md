# AI Chat Deck Generation — Design Spec

**Date:** 2026-04-22
**Branch:** `ai-chat-deck`
**Status:** Approved, pending implementation

---

## Overview

Replace the existing single-shot `/ai-generate` page with `/decksmith` — a ChatGPT-style multi-turn chat interface for building Commander decks. The user types natural-language requests, the AI responds with a full 100-card deck, and refined prompts update the deck in place. No backend changes required; the feature reuses existing services.

---

## 1. Route & Layout

- **Route:** `/decksmith` replaces `/ai-generate` (old route removed)
- **Nav link:** "Decksmith" replaces "AI Generate" in `Navbar.tsx`
- **Layout:** Two-column desktop split (no mobile breakpoint in v1)
  - **Left column** (`flex: 1`): chat transcript + input bar at bottom
  - **Right column** (`width: 360px`, fixed): persistent deck panel

The deck panel always shows the *current* deck state — it updates in place on each AI response rather than accumulating history.

---

## 2. New Files

```
src/pages/Decksmith.tsx                    # Page shell — all state lives here
src/Components/Chat/MessageList.tsx        # Scrollable transcript
src/Components/Chat/MessageBubble.tsx      # Single bubble (user or assistant)
src/Components/Chat/ChatInput.tsx          # Textarea + Send button
src/Components/Decksmith/DeckPanel.tsx     # Right-panel deck display + Save button
src/Components/Decksmith/DeckPanelEmpty.tsx # Placeholder when no deck yet
src/utils/chatPrompt.ts                    # buildPromptFromMessages()
src/utils/parseDeckFromAIText.ts           # parseDeckFromAIText()
src/types/chat.ts                          # Message + ParsedDeck interfaces
```

### Deleted files

```
src/pages/AIGenerate.tsx
src/pages/__tests__/AIGenerate.test.tsx
```

---

## 3. Data Types (`src/types/chat.ts`)

```ts
export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ParsedDeck {
  commander: string;
  cards: string[];   // 99 cards (without the commander)
  rawText: string;   // original AI response prose
}
```

---

## 4. State (`Decksmith.tsx`)

```ts
const [messages, setMessages]       = useState<Message[]>([]);
const [currentDeck, setCurrentDeck] = useState<ParsedDeck | null>(null);
const [loading, setLoading]         = useState(false);
const [saveError, setSaveError]     = useState<string | null>(null);
```

State is **ephemeral** — wipe on reload, no sessionStorage or localStorage.

- `loading` disables the chat input while an AI response is in flight.
- `saveError` is used only by `DeckPanel` for save failures; it is separate from chat errors.
- Chat-level errors (network failure, parse failure) are appended to `messages` as an assistant-role bubble so they appear inline in the transcript.

---

## 5. Send / Receive Sequence

1. User submits text → optimistic user bubble appended; input disabled
2. `loading = true`
3. `buildPromptFromMessages([...messages, newUserMessage])` constructs the full prompt string
4. `fetchMTGIdea(prompt)` called (existing service, no changes)
5. Response received:
   - `parseDeckFromAIText(text)` extracts bold card names
   - If `null` returned → error bubble ("No deck found — try rephrasing"); `currentDeck` unchanged
   - Otherwise → assistant bubble appended, `currentDeck` updated
6. `loading = false`

On network error → error bubble ("Something went wrong. Try again."); `currentDeck` unchanged.

---

## 6. AI Prompt Template (`src/utils/chatPrompt.ts`)

`buildPromptFromMessages(messages: Message[]): string`

Prepends a fixed system instruction, then serializes the conversation:

```
You are a Magic: The Gathering Commander deck-building assistant.
Always respond with a 100-card singleton Commander deck.
Format every card name in **bold** like this: **Card Name**
Include exactly one commander, listed first.

User: Build me a Selesnya tokens Commander deck.
Assistant: Here's a 100-card Rhys the Redeemed list: **Rhys the Redeemed** …
User: Make it more budget.
```

The full string is passed directly to the existing `fetchMTGIdea(prompt)` — no API changes.

---

## 7. Deck Parser (`src/utils/parseDeckFromAIText.ts`)

```ts
const BOLD_CARD = /\*\*(.+?)\*\*/g;

export function parseDeckFromAIText(text: string): ParsedDeck | null {
  const matches = [...text.matchAll(BOLD_CARD)].map(m => m[1]);
  if (matches.length < 2) return null;
  return { commander: matches[0], cards: matches.slice(1), rawText: text };
}
```

- Returns `null` if fewer than 2 bold tokens found (no deck = no commander)
- No deduplication in v1 — trust the AI
- No Scryfall validation at parse time; bad names fail silently at save time

---

## 8. Error States

| Scenario | Behaviour |
|---|---|
| Network error | Error bubble: "Something went wrong. Try again." |
| No bold cards in response | Error bubble: "No deck found — try rephrasing." |
| Fewer than 2 bold cards | Same as above |
| Save fails | Inline error in DeckPanel: "Save failed — try again" |

`currentDeck` is never cleared on error — last valid deck remains visible.

---

## 9. Save Flow

"Save Deck" button in `DeckPanel`:

1. **Unauthenticated** → inline note: "Sign in to save your deck" (no modal, no redirect)
2. **Authenticated** → call `postDeckList({ commander, cards, name: \`${commander} deck\` })`
3. Button shows spinner during call
4. On success → "Saved!" label for 2 s, then resets
5. On failure → `saveError` set; inline error message shown in panel

No navigation after save — user stays in chat to continue refining.

---

## 10. Testing

Only the two pure-function utilities are tested in v1:

### `chatPrompt.ts`
- Empty `messages` array → output contains only the system prompt
- Single user message → correct `User:` prefix in output
- Multi-turn messages → correct interleaving of `User:` / `Assistant:` lines

### `parseDeckFromAIText.ts`
- Text with multiple bold tokens → first is commander, rest are cards
- Text with zero bold tokens → returns `null`
- Text with exactly one bold token → returns `null`
- Bold token with spaces → extracted correctly

`Decksmith.tsx` and child component integration tests are deferred to a follow-up.

---

## 11. Out of Scope (v1)

- Mobile / responsive layout
- Deck history / version comparison
- Scryfall card validation at parse time
- Typing indicator / streaming AI responses
- Exporting deck (MTGO, Moxfield, etc.)
- Per-card image previews in the deck panel
