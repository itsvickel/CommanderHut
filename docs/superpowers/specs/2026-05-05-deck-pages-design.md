# Deck Pages Design

## Goal

Give users a personal deck collection: a `/decks` list page (auth-gated) showing their own decks, and a `/decks/:id` detail page with a Moxfield-style column layout and inline editing. Sandbox remains the creation entry point only.

## Architecture

### Backend — new endpoint

`PATCH /decks/:id` (auth required, owner only):
- Accepts `{ name?: string, cards?: { name: string, quantity: number }[] }`.
- Verifies the requesting user is the deck owner; returns 403 otherwise.
- If `name` provided, updates `deck_name`.
- If `cards` provided, resolves card names to ObjectIds (same logic as `createDeckWithCards`), replaces the `cards` array, returns errors for any unrecognised card names.
- Returns the updated deck document with populated card data.

The frontend sends card names (not ObjectIds) so new cards added by name are handled identically to deck creation — no client-side ID lookup needed.

### Frontend — new files

- `src/pages/DeckPage.tsx` — personal deck list (replaces current public gallery)
- `src/pages/DeckDetailPage.tsx` — detail view + inline editor
- `src/services/deckService.ts` — add `updateDeck(id, payload)` calling `PATCH /decks/:id`

### Frontend — routing

`/decks` wrapped in `RequireAuth` — redirects to `/login` if unauthenticated.  
`/decks/:id` is public (anyone with the link can view) but Edit/Delete controls only render for the owner.

## Decks List Page (`/decks`)

**Data:** Calls `GET /decks/user/:user_id` using the logged-in user's `id` from Redux on mount.

**States:**
- Loading: spinner
- Empty: "No decks yet — create one in Sandbox" with a link to `/sandbox`
- Loaded: responsive grid of deck cards

**Deck card contents:**
- Commander image (placeholder if none)
- Deck name
- Format badge
- Card count
- "Last updated" date
- Clicking navigates to `/decks/:id`

## Deck Detail Page (`/decks/:id`)

**Data:** Calls `GET /decks/:id` on mount. Populated card objects include `name`, `type`, `image_uris`, `quantity`.

### Column layout

Cards grouped into columns by MTG type, derived from each card's `type` field (e.g. `"Legendary Creature — Human Cleric"` → Creature column). Column order:

Commander · Creature · Instant · Sorcery · Enchantment · Artifact · Planeswalker · Land

Each column header shows type name + count. Each card row shows quantity + name. Hovering a card row shows the card image tooltip (floating, same approach as DeckPanel).

Dark/light theme applied via Tailwind `dark:` variants — inherits from global `ThemeContext`, no per-page toggle.

### Header

- Deck name (editable inline — click to edit, shows text input)
- Commander name + image
- Format badge
- Total card count
- **Save button** (disabled until there are pending changes, shows "Saving…" while in flight)
- **Delete button** (owner only — `confirm()` dialog, then `DELETE /decks/:id`, redirects to `/decks`)

### Inline editing (owner only)

**Rename:** Clicking the deck name turns it into a text input. Change is tracked in local state.

**Remove card:** Each card row has an × button. Removes the card from local state immediately (no server call yet).

**Add card:** A small text input pinned to the bottom of each column. Typing a name and pressing Enter adds the card (quantity 1) to that column in local state.

**Save:** Commits all pending changes via `PATCH /decks/:id`. On success, updates displayed data from the response. On failure, shows an inline error; local state is preserved so the user doesn't lose edits.

**Cancel / discard:** Navigating away without saving prompts the user via `window.beforeunload` if there are unsaved changes.

### Error handling

- Fetch fails: full-page error state with retry button.
- Save fails: inline error below the Save button; edits preserved.
- Card name not found on save: backend returns the unrecognised names; shown as a list under the Save button.
- Delete fails: inline error in the header; deck is not removed.

## Data Flow

```
Mount → GET /decks/:id → populate columns from card.type
User edits → local pendingChanges state
Save → PATCH /decks/:id { name, cards } → update displayed data from response
Delete → DELETE /decks/:id → navigate('/decks')
```

## Testing

**Decks list:**
- Unauthenticated → redirects to `/login`
- Loading state renders spinner
- Empty state renders link to Sandbox
- Deck cards render with correct name and format

**Deck detail:**
- Cards render in correct type columns
- Edit controls absent for non-owners
- Rename updates local state, Save button enables
- Remove card removes from column, Save button enables
- Save calls `PATCH /decks/:id` with correct payload
- Save failure shows error, preserves edits
- Delete calls `DELETE /decks/:id`, redirects on success

## Out of Scope

- Deck sharing / public gallery (existing `GET /decks` public endpoint untouched)
- Likes, tagging UI
- Drag-to-reorder cards
- Quantity editing (all added cards default to quantity 1; existing quantities preserved on edit)
- AI deck builder integration (separate feature)
