# Deck Management UI — Edit & Delete

**Date:** 2026-05-05
**Status:** Approved
**Repo:** CommanderHut (frontend)
**Related backend:** `PATCH /api/decks/:id` and `DELETE /api/decks/:id` already implemented

---

## Overview

Add edit and delete capabilities to the deck list page. Controls live in a `···` overflow menu on each deck card (owner-only), keeping the UI clean and extensible for future actions (duplicate, share, export).

---

## New Files

| File | Purpose |
|---|---|
| `src/pages/EditDeck.tsx` | Full edit page at `/decks/:id/edit` |
| `src/Components/Deck/DeckOverflowMenu.tsx` | `···` dropdown with Edit and Delete items |
| `src/Components/Deck/DeleteDeckModal.tsx` | Simple confirm modal for deletion |

## Changed Files

| File | Change |
|---|---|
| `src/App.tsx` | Add route `/decks/:id/edit` → `<EditDeck />` (protected) |
| `src/pages/DeckPage.tsx` | Mount `<DeckOverflowMenu>` on each deck card; only rendered when `deck.owner === currentUser.id` |
| `src/services/deckService.ts` | Add `updateDeck(id, payload)` and `deleteDeck(id)` |

---

## DeckOverflowMenu

- Renders a `···` button in the top-right corner of each deck card in `DeckPage`
- Only shown when the deck belongs to the logged-in user
- Dropdown items (initial): **Edit deck**, **Delete**
- Designed for extension: future items (Duplicate, Share, Export) slot in without layout changes
- Clicking **Edit deck** → navigate to `/decks/:id/edit`
- Clicking **Delete** → open `<DeleteDeckModal>`

---

## EditDeck Page (`/decks/:id/edit`)

### Layout

Two-column layout:

**Left — Deck metadata**
- Deck name (text input)
- Format (select: Commander / Standard / Modern)
- Commander (text input)
- Tags (comma-separated text input)
- Public toggle (on/off)
- Commander art preview (auto-updates via Scryfall when commander name changes; same behaviour as Sandbox)

**Right — Card list editor**
- Search input (debounced, calls existing `cardService.fetchCardByName`)
- Dropdown of matches → click to add at quantity 1
- Card rows: name | − | quantity | + | ✕ remove
- Running card count shown in header

**Footer**
- Cancel → navigate back to `/decks` without saving
- Save Changes → `PATCH /api/decks/:id`

### Load behaviour

- On mount: `GET /api/decks/:id` to pre-populate all fields
- If the deck's owner does not match the logged-in user: redirect to `/decks`
- Show loading state while fetching

### Save behaviour

- Build payload with only fields that changed (diff against original on load)
- `PATCH /api/decks/:id` with changed fields
- `deck_list` sent as `[{ card: name, quantity }]` matching backend expectation
- On success: navigate to `/decks`
- On error: display inline error message below the Save button; stay on page

---

## DeleteDeckModal

- Triggered by clicking Delete in the overflow menu
- Shows deck name in the title: "Delete 'Atraxa Proliferate'?"
- Body: "This action cannot be undone."
- Buttons: Cancel (dismiss) | Delete (red, calls `DELETE /api/decks/:id`)
- On success: remove deck from the Redux Toolkit decks slice, stay on `/decks` (no full reload)
- On error: show error message inside the modal; keep modal open

---

## Service Layer (`deckService.ts`)

```ts
// Add to existing deckService.ts
updateDeck(id: string, payload: Partial<DeckPayload>): Promise<Deck>
// PATCH /api/decks/:id

deleteDeck(id: string): Promise<void>
// DELETE /api/decks/:id
```

`DeckPayload` fields: `deck_name`, `format`, `commander`, `commander_image`, `tags`, `is_public`, `deck_list: { card: string, quantity: number }[]`

---

## Error Handling

| Scenario | Behaviour |
|---|---|
| Load fails (deck not found) | Redirect to `/decks` with error toast |
| Save returns 403 | "You don't have permission to edit this deck" inline |
| Save returns 400 (card not found) | List unrecognised card names inline below the card editor |
| Delete fails | Error message inside the modal; modal stays open |
| Network error | Generic "Something went wrong, please try again" |

---

## Out of Scope

- Reusing / refactoring Sandbox into a shared DeckBuilder component (future)
- Editing AI-generated deck metadata fields (`ai_metadata`)
- Bulk card import on the edit page
