const API_ENDPOINT = {
  // ========== ⚙️ Base URL ==========
  BASE_URL: import.meta.env.VITE_API_BASE_URL,

  // ========== 🔐 Authentication ==========
  LOGIN: import.meta.env.VITE_API_LOGIN_BASE_URL,
  LOGOUT: import.meta.env.VITE_API_LOGOUT_BASE_URL,
  ME: import.meta.env.VITE_API_ME_BASE_URL,

  // ========== 👤 Users ==========
  USER_BASE_URL: import.meta.env.VITE_API_USER_BASE_URL,

  // ========== 🃏 Cards ==========
  CARDS_BASE_URL: import.meta.env.VITE_API_CARDS_BASE_URL,
  SCRYFALL: import.meta.env.VITE_API_SCRYFALL,
  CARD_QUERY: import.meta.env.VITE_API_CARD_QUERY,
  RANDOM_CARD_LIST: import.meta.env.VITE_API_RANDOM_CARD_LIST,

  // ========== 🧠 AI ==========
  AI_GENERATE: import.meta.env.VITE_API_AI_GENERATE,
  AI_TOGETHER_BASE: import.meta.env.VITE_API_AI_TOGETHER_BASE,

  // ========== 🃏 Decks ==========
  DECK_BASE_URL: import.meta.env.VITE_API_DECKS_BASE_URL,
  DECK_BY_USER: import.meta.env.VITE_API_DECKS_USER_URL,
};

export default API_ENDPOINT;
