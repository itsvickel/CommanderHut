import reducer, {
  createSession,
  setActiveSession,
  appendMessage,
  setDeck,
  updateSessionTitle,
  selectSessions,
  selectActiveSessionId,
  selectActiveSession,
  loadFromStorage,
  DecksmithState,
} from '../decksmithSlice';
import { Message, ParsedDeck } from '../../types/chat';

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

  describe('loadFromStorage', () => {
    it('returns default state when localStorage is empty', () => {
      expect(loadFromStorage()).toEqual({ sessions: [], activeSessionId: null });
    });

    it('returns parsed state when localStorage has valid data', () => {
      const saved: DecksmithState = {
        sessions: [{ id: 'a', title: 'Test', messages: [], deck: null, createdAt: '2026-01-01' }],
        activeSessionId: 'a',
      };
      localStorage.setItem('decksmith', JSON.stringify(saved));
      expect(loadFromStorage()).toEqual(saved);
    });

    it('returns default state when localStorage has malformed JSON', () => {
      localStorage.setItem('decksmith', 'not-json');
      expect(loadFromStorage()).toEqual({ sessions: [], activeSessionId: null });
    });
  });
});
