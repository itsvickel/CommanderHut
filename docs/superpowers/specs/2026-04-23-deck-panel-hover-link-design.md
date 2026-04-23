# Deck Panel: Card Hover Previews + Full Deck Page Link

**Goal:** Hovering a card row in the Decksmith panel shows a floating card image tooltip; after saving, a link to the full deck page appears.

**Architecture:** Two self-contained enhancements to `DeckPanel.tsx`. Hover state is local React state — no Redux, no extra API calls (card images already live in `CardEntry.image_uris`). The deck page link uses the ID returned by `postDeckList` after a successful save.

**Tech Stack:** React 19, styled-components, React Router `<Link>`

---

## Feature 1: Card Hover Tooltip

**Trigger:** `onMouseEnter` on any card row (including the commander row) sets `hoveredCard: CardEntry | null`. `onMouseLeave` clears it.

**Tooltip component (`CardTooltip`):** Absolutely positioned, `right: 100%` relative to the Panel container, vertically centred near the hovered row using a `top` offset derived from the row's `getBoundingClientRect()`. Shows `card.image_uris.normal` (falls back to `image_uris.small`). Fixed width of 200px. Box shadow + border-radius to match the app's existing card aesthetic. Pointer-events none so it never blocks interaction.

**Data source:** `CardEntry.image_uris` already populated by the AI backend response — zero extra network requests.

**Commander row:** Also hoverable. Uses the `commanderImageUri` already on `ParsedDeck` (not `CardEntry`), so the tooltip component accepts `{ name, imageUri }` rather than a full `CardEntry`.

---

## Feature 2: Full Deck Page Link

**After save:** `postDeckList` returns the created deck object. Its `_id` field is stored in `savedDeckId: string | null` state (initially `null`).

**Link placement:** Beneath the Save button in the panel footer. Only rendered when `savedDeckId` is non-null. Uses React Router `<Link to={/decks/${savedDeckId}}>→ View Deck Page</Link>`.

**No pre-save placeholder:** The link is absent (not disabled/greyed) until a successful save — keeps the footer clean.

---

## Files Changed

- Modify: `src/Components/Decksmith/DeckPanel.tsx` — add hover state, `CardTooltip` styled component, `savedDeckId` state, footer link
- No new files required — everything fits cleanly inside `DeckPanel.tsx`
