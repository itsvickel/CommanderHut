import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Message, ParsedDeck, DeckDiff } from '../types/chat';

export interface DecksmithSession {
  id: string;
  title: string;
  messages: Message[];
  deck: ParsedDeck | null;
  /** Refinement awaiting the user's accept/discard decision. */
  pendingDiff: DeckDiff | null;
  createdAt: string;
}

export interface DecksmithState {
  sessions: DecksmithSession[];
  activeSessionId: string | null;
}

const STORAGE_KEY = 'decksmith';
const DEFAULT_STATE: DecksmithState = { sessions: [], activeSessionId: null };

export function loadFromStorage(): DecksmithState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed?.sessions)) {
      return {
        activeSessionId: parsed.activeSessionId ?? null,
        // Sessions stored before refinement existed have no pendingDiff.
        sessions: parsed.sessions.map((s: DecksmithSession) => ({
          ...s,
          pendingDiff: s.pendingDiff ?? null,
        })),
      };
    }
  } catch { /* ignore parse errors */ }
  return DEFAULT_STATE;
}

export function saveToStorage(state: DecksmithState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* ignore quota errors */ }
}

const decksmithSlice = createSlice({
  name: 'decksmith',
  initialState: loadFromStorage(),
  reducers: {
    createSession(state) {
      const id = crypto.randomUUID();
      state.sessions.unshift({
        id,
        title: 'New session',
        messages: [],
        deck: null,
        pendingDiff: null,
        createdAt: new Date().toISOString(),
      });
      state.activeSessionId = id;
    },
    setActiveSession(state, action: PayloadAction<string>) {
      if (state.sessions.some(s => s.id === action.payload)) {
        state.activeSessionId = action.payload;
      }
    },
    appendMessage(state, action: PayloadAction<{ sessionId: string; message: Message }>) {
      const session = state.sessions.find(s => s.id === action.payload.sessionId);
      if (session) session.messages.push(action.payload.message);
    },
    setDeck(state, action: PayloadAction<{ sessionId: string; deck: ParsedDeck }>) {
      const session = state.sessions.find(s => s.id === action.payload.sessionId);
      if (session) {
        session.deck = action.payload.deck;
        session.pendingDiff = null;
      }
    },
    updateSessionTitle(state, action: PayloadAction<{ sessionId: string; title: string }>) {
      const session = state.sessions.find(s => s.id === action.payload.sessionId);
      if (session) session.title = action.payload.title;
    },
    setPendingDiff(state, action: PayloadAction<{ sessionId: string; diff: DeckDiff | null }>) {
      const session = state.sessions.find(s => s.id === action.payload.sessionId);
      if (session) session.pendingDiff = action.payload.diff;
    },
    /** Records the deck id after a save, so refinement can target it. */
    setSavedDeckId(state, action: PayloadAction<{ sessionId: string; deckId: string }>) {
      const session = state.sessions.find(s => s.id === action.payload.sessionId);
      if (session?.deck) session.deck.savedDeckId = action.payload.deckId;
    },
    /**
     * Drops a generation id whose server-side preview is gone (saved or
     * expired), so the next message starts a fresh generation instead of
     * failing forever.
     */
    clearGenerationId(state, action: PayloadAction<{ sessionId: string }>) {
      const session = state.sessions.find(s => s.id === action.payload.sessionId);
      if (session?.deck) {
        session.deck.generationId = undefined;
        session.pendingDiff = null;
      }
    },
    // Mirrors the diff the backend applied when the user accepted it.
    acceptPendingDiff(state, action: PayloadAction<{ sessionId: string }>) {
      const session = state.sessions.find(s => s.id === action.payload.sessionId);
      if (!session?.deck || !session.pendingDiff) return;

      const cutIds = new Set(session.pendingDiff.cuts.map(c => c._id));
      const kept = session.deck.cards.filter(c => !cutIds.has(c._id));
      const added = session.pendingDiff.adds.map(a => ({
        _id: a._id,
        name: a.name,
        quantity: 1,
        role: a.role,
        image_uris: a.image_uris ?? {},
      }));

      session.deck = { ...session.deck, cards: [...kept, ...added] };
      session.pendingDiff = null;
    },
  },
});

export const {
  createSession,
  setActiveSession,
  appendMessage,
  setDeck,
  updateSessionTitle,
  setPendingDiff,
  setSavedDeckId,
  clearGenerationId,
  acceptPendingDiff,
} = decksmithSlice.actions;

export const selectSessions = (state: { decksmith: DecksmithState }) =>
  state.decksmith.sessions;
export const selectActiveSessionId = (state: { decksmith: DecksmithState }) =>
  state.decksmith.activeSessionId;
export const selectActiveSession = (state: { decksmith: DecksmithState }) =>
  state.decksmith.sessions.find(s => s.id === state.decksmith.activeSessionId) ?? null;

export default decksmithSlice.reducer;
