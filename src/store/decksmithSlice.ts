import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Message, ParsedDeck } from '../types/chat';

export interface DecksmithSession {
  id: string;
  title: string;
  messages: Message[];
  deck: ParsedDeck | null;
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
    if (Array.isArray(parsed?.sessions)) return parsed as DecksmithState;
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
      if (session) session.deck = action.payload.deck;
    },
    updateSessionTitle(state, action: PayloadAction<{ sessionId: string; title: string }>) {
      const session = state.sessions.find(s => s.id === action.payload.sessionId);
      if (session) session.title = action.payload.title;
    },
  },
});

export const {
  createSession,
  setActiveSession,
  appendMessage,
  setDeck,
  updateSessionTitle,
} = decksmithSlice.actions;

export const selectSessions = (state: { decksmith: DecksmithState }) =>
  state.decksmith.sessions;
export const selectActiveSessionId = (state: { decksmith: DecksmithState }) =>
  state.decksmith.activeSessionId;
export const selectActiveSession = (state: { decksmith: DecksmithState }) =>
  state.decksmith.sessions.find(s => s.id === state.decksmith.activeSessionId) ?? null;

export default decksmithSlice.reducer;
