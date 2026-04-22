// jest.setup.ts
import "@testing-library/jest-dom";
import { TextEncoder, TextDecoder } from "util";

// react-router-dom v7 references TextEncoder at module load; jsdom doesn't ship it.
if (typeof globalThis.TextEncoder === "undefined") {
  globalThis.TextEncoder = TextEncoder;
}
if (typeof globalThis.TextDecoder === "undefined") {
  (globalThis as unknown as { TextDecoder: typeof TextDecoder }).TextDecoder = TextDecoder;
}
