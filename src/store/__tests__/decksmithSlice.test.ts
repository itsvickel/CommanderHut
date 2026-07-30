import reducer, {
  createSession,
  setActiveSession,
  appendMessage,
  setDeck,
  updateSessionTitle,
  setPendingDiff,
  setSavedDeckId,
  clearGenerationId,
  acceptPendingDiff,
  selectSessions,
  selectActiveSessionId,
  selectActiveSession,
  loadFromStorage,
  DecksmithState,
} from '../decksmithSlice';
import { Message, ParsedDeck, DeckDiff } from '../../types/chat';

beforeEach(() => localStorage.clear());

let uuidCounter = 0;
beforeEach(() => { uuidCounter = 0; });
Object.defineProperty(globalThis, 'crypto', {
  value: { randomUUID: () => `test-uuid-${++uuidCounter}` },
  configurable: true,
});

const EMPTY: DecksmithState = { sessions: [], activeSessionId: null };

describe('decksmithSlice', () => {
  it('returns empty state when localStorage is empty', () => {
    const state = reducer(undefined, { type: '@@INIT' });
    expect(state.sessions).toEqual([]);
    expect(state.activeSessionId).toBeNull();
  });

  describe('createSession', () => {
    it('adds a new session and sets it as active', () => {
      const state = reducer(EMPTY, createSession());
      expect(state.sessions).toHaveLength(1);
      expect(state.sessions[0].title).toBe('New session');
      expect(state.sessions[0].messages).toEqual([]);
      expect(state.sessions[0].deck).toBeNull();
      expect(state.activeSessionId).toBe(state.sessions[0].id);
    });

    it('prepends new session and sets it as active', () => {
      const s1 = reducer(EMPTY, createSession());
      const s2 = reducer(s1, createSession());
      expect(s2.sessions).toHaveLength(2);
      expect(s2.activeSessionId).toBe(s2.sessions[0].id);
    });
  });

  describe('setActiveSession', () => {
    it('switches active to an existing session', () => {
      let state = reducer(EMPTY, createSession());
      const firstId = state.sessions[0].id;
      state = reducer(state, createSession());
      state = reducer(state, setActiveSession(firstId));
      expect(state.activeSessionId).toBe(firstId);
    });

    it('ignores unknown session id', () => {
      const state = reducer(EMPTY, createSession());
      const next = reducer(state, setActiveSession('nonexistent'));
      expect(next.activeSessionId).toBe(state.activeSessionId);
    });
  });

  describe('appendMessage', () => {
    it('appends a message to the correct session', () => {
      const state = reducer(EMPTY, createSession());
      const sessionId = state.sessions[0].id;
      const msg: Message = { role: 'user', content: 'hello', timestamp: 1 };
      const next = reducer(state, appendMessage({ sessionId, message: msg }));
      expect(next.sessions[0].messages).toHaveLength(1);
      expect(next.sessions[0].messages[0]).toEqual(msg);
    });

    it('ignores unknown sessionId', () => {
      const state = reducer(EMPTY, createSession());
      const msg: Message = { role: 'user', content: 'hi', timestamp: 1 };
      const next = reducer(state, appendMessage({ sessionId: 'bad', message: msg }));
      expect(next.sessions[0].messages).toHaveLength(0);
    });
  });

  describe('setDeck', () => {
    it('stores deck on the correct session', () => {
      const state = reducer(EMPTY, createSession());
      const sessionId = state.sessions[0].id;
      const deck: ParsedDeck = { commander: 'Krenko, Mob Boss', cards: [], strategy: 'Goblins' };
      const next = reducer(state, setDeck({ sessionId, deck }));
      expect(next.sessions[0].deck).toEqual(deck);
    });
  });

  describe('updateSessionTitle', () => {
    it('updates title for the matching session', () => {
      const state = reducer(EMPTY, createSession());
      const sessionId = state.sessions[0].id;
      const next = reducer(state, updateSessionTitle({ sessionId, title: 'Krenko Goblins' }));
      expect(next.sessions[0].title).toBe('Krenko Goblins');
    });

    it('ignores unknown sessionId', () => {
      const state = reducer(EMPTY, createSession());
      const next = reducer(state, updateSessionTitle({ sessionId: 'bad', title: 'X' }));
      expect(next.sessions[0].title).toBe('New session');
    });
  });

  describe('selectors', () => {
    it('selectSessions returns sessions array', () => {
      const state = reducer(EMPTY, createSession());
      expect(selectSessions({ decksmith: state })).toHaveLength(1);
    });

    it('selectActiveSessionId returns activeSessionId', () => {
      const state = reducer(EMPTY, createSession());
      expect(selectActiveSessionId({ decksmith: state })).toBe(state.sessions[0].id);
    });

    it('selectActiveSession returns the active session object', () => {
      const state = reducer(EMPTY, createSession());
      const active = selectActiveSession({ decksmith: state });
      expect(active?.id).toBe(state.activeSessionId);
    });

    it('selectActiveSession returns null when no active session', () => {
      expect(selectActiveSession({ decksmith: EMPTY })).toBeNull();
    });
  });

  describe('refinement diffs', () => {
    const deck: ParsedDeck = {
      generationId: 'gen-1',
      commander: 'Krenko, Mob Boss',
      cards: [
        { _id: 'keep', name: 'Goblin King', quantity: 1, role: 'anthem', image_uris: {} },
        { _id: 'cut-me', name: 'Weak Goblin', quantity: 1, role: 'synergy', image_uris: {} },
      ],
    };
    const diff: DeckDiff = {
      summary: 'Better removal.',
      adds: [{ _id: 'added', name: 'Chaos Warp', role: 'removal' }],
      cuts: [{ _id: 'cut-me', name: 'Weak Goblin', reason: 'low impact' }],
    };

    const seeded = () => {
      const created = reducer(EMPTY, createSession());
      const id = created.sessions[0].id;
      return { state: reducer(created, setDeck({ sessionId: id, deck })), id };
    };

    it('stores a pending diff without touching the deck', () => {
      const { state, id } = seeded();
      const next = reducer(state, setPendingDiff({ sessionId: id, diff }));
      expect(next.sessions[0].pendingDiff).toEqual(diff);
      expect(next.sessions[0].deck!.cards).toHaveLength(2);
    });

    it('applies cuts and adds when the diff is accepted', () => {
      const { state, id } = seeded();
      const withDiff = reducer(state, setPendingDiff({ sessionId: id, diff }));
      const next = reducer(withDiff, acceptPendingDiff({ sessionId: id }));

      const names = next.sessions[0].deck!.cards.map(c => c.name);
      expect(names).toEqual(['Goblin King', 'Chaos Warp']);
      expect(next.sessions[0].pendingDiff).toBeNull();
    });

    it('clears a pending diff when discarded', () => {
      const { state, id } = seeded();
      const withDiff = reducer(state, setPendingDiff({ sessionId: id, diff }));
      const next = reducer(withDiff, setPendingDiff({ sessionId: id, diff: null }));
      expect(next.sessions[0].pendingDiff).toBeNull();
      expect(next.sessions[0].deck!.cards).toHaveLength(2);
    });

    it('ignores accept when there is no pending diff', () => {
      const { state, id } = seeded();
      const next = reducer(state, acceptPendingDiff({ sessionId: id }));
      expect(next.sessions[0].deck!.cards).toHaveLength(2);
    });

    it('clears any pending diff when a new deck is generated', () => {
      const { state, id } = seeded();
      const withDiff = reducer(state, setPendingDiff({ sessionId: id, diff }));
      const next = reducer(withDiff, setDeck({ sessionId: id, deck }));
      expect(next.sessions[0].pendingDiff).toBeNull();
    });
  });

  describe('saved-deck handoff', () => {
    const deck: ParsedDeck = {
      generationId: 'gen-1',
      commander: 'Krenko, Mob Boss',
      cards: [{ _id: 'c1', name: 'Goblin King', quantity: 1, role: 'anthem', image_uris: {} }],
    };

    const seeded = () => {
      const created = reducer(EMPTY, createSession());
      const id = created.sessions[0].id;
      return { state: reducer(created, setDeck({ sessionId: id, deck })), id };
    };

    it('records the saved deck id', () => {
      const { state, id } = seeded();
      const next = reducer(state, setSavedDeckId({ sessionId: id, deckId: 'deck-9' }));
      expect(next.sessions[0].deck!.savedDeckId).toBe('deck-9');
    });

    it('drops a dead generation id so the next message can generate afresh', () => {
      const { state, id } = seeded();
      const next = reducer(state, clearGenerationId({ sessionId: id }));
      expect(next.sessions[0].deck!.generationId).toBeUndefined();
      expect(next.sessions[0].deck!.cards).toHaveLength(1);
    });

    it('clears a stale pending diff when the generation is dropped', () => {
      const { state, id } = seeded();
      const withDiff = reducer(state, setPendingDiff({
        sessionId: id,
        diff: { summary: '', adds: [], cuts: [] },
      }));
      const next = reducer(withDiff, clearGenerationId({ sessionId: id }));
      expect(next.sessions[0].pendingDiff).toBeNull();
    });
  });

  describe('loadFromStorage', () => {
    it('returns default state when localStorage is empty', () => {
      expect(loadFromStorage()).toEqual({ sessions: [], activeSessionId: null });
    });

    it('returns parsed state when localStorage has valid data', () => {
      const saved: DecksmithState = {
        sessions: [{ id: 'a', title: 'Test', messages: [], deck: null, pendingDiff: null, createdAt: '2026-01-01' }],
        activeSessionId: 'a',
      };
      localStorage.setItem('decksmith', JSON.stringify(saved));
      expect(loadFromStorage()).toEqual(saved);
    });

    it('backfills pendingDiff on sessions saved before refinement existed', () => {
      localStorage.setItem('decksmith', JSON.stringify({
        sessions: [{ id: 'a', title: 'Test', messages: [], deck: null, createdAt: '2026-01-01' }],
        activeSessionId: 'a',
      }));
      expect(loadFromStorage().sessions[0].pendingDiff).toBeNull();
    });

    it('returns default state when localStorage has malformed JSON', () => {
      localStorage.setItem('decksmith', 'not-json');
      expect(loadFromStorage()).toEqual({ sessions: [], activeSessionId: null });
    });
  });
});
