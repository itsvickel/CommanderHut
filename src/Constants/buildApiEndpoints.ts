// All endpoints derive from a single base URL so the frontend can never
// drift out of sync with individual per-endpoint env vars.
export function buildApiEndpoints(base: string) {
  return {
    // ========== ⚙️ Base URL ==========
    BASE_URL: base,

    // ========== 🔐 Authentication ==========
    LOGIN: `${base}/login`,
    LOGOUT: `${base}/logout`,
    ME: `${base}/me`,

    // ========== 👤 Users ==========
    USER_BASE_URL: `${base}/user`,

    // ========== 🃏 Cards ==========
    CARD_QUERY_BY_NAME: `${base}/cards/name/`,
    CARD_QUERY_BY_ID: `${base}/cards/id/`,
    RANDOM_CARD_LIST: `${base}/cards/randomList`,

    // ========== 🧠 AI ==========
    AI_GENERATE: `${base}/ai/deck/generate`,
    AI_REFINE: `${base}/ai/deck/refine`,
    AI_REFINE_ACCEPT: `${base}/ai/deck/refine/accept`,
    AI_ANALYZE: `${base}/ai/deck/analyze`,
    AI_SAVE: `${base}/ai/deck/save`,

    // ========== 🃏 Decks ==========
    DECK_BASE_URL: `${base}/decks`,
    DECK_BY_USER: `${base}/decks/user`,
    DECK_BY_ID: `${base}/decks/`,

    // ========== 👤 Profile ==========
    PROFILE_BASE_URL: `${base}/profile/`,
  };
}
