import { buildApiEndpoints } from './buildApiEndpoints';

// import.meta is Vite-only syntax; Jest maps this module to api.jest.ts
// (see moduleNameMapper in jest.config.cjs).
const API_ENDPOINT = buildApiEndpoints(
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api'
);

export default API_ENDPOINT;
