# AI Quality Improvements — Phase 1 Design

**Date:** 2026-06-08  
**Project:** Commander Hut (frontend) + CommanderHut-backend  
**Scope:** Phase 1 of 2. Phase 2 (UX overhaul) to follow once this lands.

---

## Problem Statement

The current AI deck generation pipeline has four ranked pain points:

1. **Hallucinated/invalid cards** — Gemini suggests cards that don't exist or aren't legal in Commander; the backend silently drops them with no user feedback.
2. **Bad commander choices** — Commander is sometimes not legendary, wrong color identity, not thematically matched, or outright invalid.
3. **No progress feedback** — Users wait 5–10 seconds with a single spinner; no indication of what's happening.
4. **Generic decks** — Cards are legal but lack real synergy or strategic cohesion (addressed partially by fixing 1–3).

---

## Approach

**Structured JSON output from Gemini + Scryfall validation loop + SSE progress streaming.**

- Force Gemini to return a strict JSON schema (eliminating bold-text parsing).
- Validate every card and the commander against Scryfall after generation.
- Invalid cards trigger a targeted re-prompt; persistent failures trigger a full retry.
- Backend switches to SSE so the frontend can show discrete progress stages.

---

## Architecture

### Pipeline stages (backend)

```
① SSE connection opened         — frontend connects, progress stream begins
② Gemini call (structured JSON) — returns commander + 30 signature cards + strategy
③ Commander validation          — Scryfall: exists? legendary? legal? theme match?
                                  → fail: re-prompt (max 2 retries)
④ Card validation loop          — batch Scryfall lookup for all 30 cards
                                  → ≤5 failures: one targeted re-prompt
                                  → >5 failures: full regeneration with failure context
⑤ Fill engine                   — existing logic, now runs only on validated cards
⑥ Result event                  — complete deck + strategy sent, SSE closes
```

Each stage emits a `progress` SSE event. The final deck is delivered as a `result` event with the same payload shape as today — no frontend breaking changes beyond switching from `fetch` to `EventSource`.

---

## Gemini Structured Output Schema

Gemini's native JSON schema enforcement is used (not post-processing). The model rejects its own output if it deviates from the schema.

```json
{
  "commander": {
    "name": "string",
    "reason": "string — why this commander fits the requested theme"
  },
  "signature_cards": [
    {
      "name": "string",
      "role": "string — explicit role this card plays in the deck"
    }
    // exactly 30 entries
  ],
  "strategy": "string — 2-3 sentence deck strategy description",
  "themes": ["string"],
  "power_bracket": "integer 1–5",
  "budget_tier": "budget | medium | high"
}
```

**Why this helps:**
- Eliminates the regex-based bold-text parser (`parseResponse.js`).
- Each card arrives with an explicit `role` — surfaced in the UI as a tooltip or card annotation.
- `themes` array stored on the `Deck` model for future search/filter.
- `commander.reason` shown to the user for explainability.

---

## Commander Validation

Runs after step ②. Checks performed against Scryfall:

1. Card exists.
2. Is legendary + creature, or planeswalker with "can be your commander" oracle text.
3. Legal in Commander format.
4. Theme match: oracle text / type line contains at least one of the requested themes (soft check — logged, not blocking).

**On failure:** Re-prompt Gemini with specific failure reason:
> "Pick a different legendary creature for the [theme] theme in [colors]. [CardName] is not valid because [reason]. Must be legal in Commander."

Max 2 retries. If both fail → return `{ error: "Could not find a valid commander for this theme" }` to frontend with a user-facing message.

---

## Card Validation Loop

Runs after step ②, in parallel with commander validation where possible.

- Uses Scryfall's `/cards/collection` endpoint — one API call for all 30 cards.
- Each card checked: exists, legal in Commander, color identity ⊆ commander's color identity.
- **≤ 5 invalid cards:** one targeted re-prompt listing the invalid names and their failure reasons.
- **> 5 invalid cards:** full regeneration; failure context (banned/invalid card names) injected into the new Gemini prompt to prevent recurrence.

**Prompt injection changes (applies to all requests, not just retries):**
- Commander's color identity injected explicitly: "All cards must fit within [W/U/B/G] color identity."
- Banned card list injected at prompt-build time (currently only on retry).
- Admin master prompt applied on top.

---

## SSE Progress Events

Backend endpoint changes from `POST /api/ai/generate` (JSON response) to `GET /api/ai/generate` (SSE, `text/event-stream`).

### Event types

```
event: progress
data: { "stage": "generating", "message": "Generating deck concept..." }

event: progress
data: { "stage": "commander", "message": "Commander selected: Atraxa, Praetors' Voice" }

event: progress
data: { "stage": "validating_commander", "message": "Validating commander..." }

event: progress
data: { "stage": "validating_cards", "message": "Validating cards (18/30)..." }

event: progress
data: { "stage": "filling", "message": "Filling remaining slots..." }

event: progress
data: { "stage": "finalising", "message": "Finalising deck..." }

event: result
data: { ...deck payload (same shape as current response)... }

event: error
data: { "stage": "validating_commander", "message": "Commander not found — try a different theme" }
```

### Frontend changes (Decksmith)

- Replace `fetchMTGIdea` (fetch-based) with an `EventSource` connection.
- Replace spinner with a stage checklist:
  - Pending stages: grey circle
  - Current stage: spinning indicator + stage label
  - Completed stages: green checkmark + stage label
  - Failed stage: red X + error message
- On `result` event: existing deck display logic unchanged.

---

## What Does NOT Change

- `fillEngine.js` — unchanged, now receives only validated signature cards.
- `bracketFilter.js` — unchanged.
- `previewCache.js` — unchanged.
- `dailyCap.js` middleware — unchanged.
- Admin master prompt system — unchanged, still applied on top.
- Deck save flow (`POST /api/ai/deck/save`) — unchanged.
- Frontend deck display after generation — unchanged.

---

## Files Touched

### Backend (`CommanderHut-backend`)
- `services/aiDeckBuilder/pipeline.js` — refactor to SSE emitter, add Scryfall validation stages
- `services/aiDeckBuilder/geminiClient.js` — switch to structured JSON output schema
- `services/aiDeckBuilder/parseResponse.js` — replace with schema-typed extractor (thin wrapper)
- `services/aiDeckBuilder/resolveCommander.js` — add Scryfall validation + retry logic
- `services/aiDeckBuilder/resolveSignatures.js` — replace with Scryfall batch validation
- `services/scryfallService.js` — new: Scryfall API client (`/cards/named`, `/cards/collection`)
- `controllers/deckBuilderController.js` — switch to SSE response headers
- `routes/aiRoutes.js` — update generate route to support SSE

### Frontend (`CommanderHut`)
- `src/services/aiService.ts` — replace fetch with EventSource-based stream handler
- `src/Components/Decksmith/DeckPanel.tsx` — replace spinner with stage checklist component
- `src/Components/UI_Components/GenerationProgress.tsx` — new: stage checklist component

---

## Out of Scope (Phase 2)

- Decksmith chat UI redesign
- Deck detail view improvements
- Card browsing / search
- Navigation / overall layout
