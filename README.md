# Commander Hut

AI-assisted deck building for Magic: The Gathering Commander. Describe the deck
you want and Decksmith builds a legal, synergy-driven 100-card list — then refine
it in conversation or have it analysed card by card.

## Features

- **Decksmith** — a chat workspace that generates decks from a prompt, with live
  progress through the validation pipeline and a deck panel that fills in as the
  result streams
- **Conversational refinement** — follow-up messages ("more removal", "swap
  Rhystic Study") return a reviewable diff you can apply or discard
- **Deck analysis** — statistics, mana curve, role coverage, and an AI critique
  with upgrade suggestions, on any deck
- **Deck management** — Moxfield-style deck detail view with inline editing,
  visual card grid, and import from JSON/CSV/XLSX
- **Card browsing** — search and filter the card database
- **Light and dark themes**

## Tech stack

- **React 19 + TypeScript**, built with Vite
- **Redux Toolkit** for auth and Decksmith session state
- **Tailwind CSS** for styling
- **Jest + Testing Library** for tests

The backend lives in a separate repository (`CommanderHut-backend`): Node.js,
Express, MongoDB, and Groq/Gemini for generation.

## Getting started

```bash
npm install
cp .env.example .env   # point VITE_API_BASE_URL at your backend
npm run dev
```

Every API endpoint is derived from `VITE_API_BASE_URL` in
[src/Constants/buildApiEndpoints.ts](src/Constants/buildApiEndpoints.ts), so
that single variable is all you need to configure.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Type-check and build for production |
| `npm test` | Run the test suite |
| `npm run test:watch` | Watch mode |
| `npm run lint` | Lint the project |

## Project layout

```
src/
  Components/   UI components (Layout, Chat, Decksmith, Deck, UI_Components)
  pages/        Route-level pages
  services/     API clients (aiService, deckService, cardService, …)
  store/        Redux slices (auth, decksmith)
  types/        Shared TypeScript types
  utils/        Helpers
docs/superpowers/   Design specs and implementation plans per phase
```
