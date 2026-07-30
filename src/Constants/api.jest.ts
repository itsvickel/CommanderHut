import { buildApiEndpoints } from './buildApiEndpoints';

// Jest-safe stand-in for api.ts (which uses Vite's import.meta syntax).
// Wired up via moduleNameMapper in jest.config.cjs.
const API_ENDPOINT = buildApiEndpoints('http://localhost:3000/api');

export default API_ENDPOINT;
