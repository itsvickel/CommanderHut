const STATIC_ENDPOINTS = {
    BASE_URL: import.meta.env.VITE_API_BASE_URL,
    LOGIN: import.meta.env.VITE_API_LOGIN_BASE_UR,
    USER_BASE_URL: import.meta.env.VITE_API_USER_BASE_URL,
    CARDS_BASE_URL: import.meta.env.VITE_API_CARDS_BASE_URL,
    SCRYFALL: import.meta.env.VITE_API_SCRYFALL,
    CARD_QUERY: import.meta.env.VITE_API_CARD_QUERY,
    RANDOM_CARD_LIST: import.meta.env.VITE_API_RANDOM_CARD_LIST,
    AI_GENERATE: import.meta.env.VITE_API_AI_GENERATE,
    AI_TOGETHER_BASE: import.meta.env.VITE_API_AI_TOGETHER_BASE,
  };
 
  
  const API_ENDPOINT = {
    ...STATIC_ENDPOINTS,
  
    getCardById: (id: string) => `${STATIC_ENDPOINTS.CARDS_BASE_URL}/${id}`,
    getCardByName: (name: string) =>
      `${STATIC_ENDPOINTS.SCRYFALL}${STATIC_ENDPOINTS.CARD_QUERY}?fuzzy=${encodeURIComponent(name)}`,
  };
  
  
  export default API_ENDPOINT;