# Admin Master Prompt UI Design

**Goal:** Add a protected admin page at `/admin/masterprompt` where admins can view and edit the three editable master prompt sections (`role_description`, `domain_restrictions`, `additional_rules`) and see the hardcoded `output_format` read-only.

**Architecture:** Frontend-only change (plus a small backend change to expose `is_admin` in the auth session). The admin page calls the existing `GET /PUT /api/admin/masterprompt` endpoints. A new `RequireAdmin` route wrapper gates access using `is_admin` from Redux state. The `User` type is extended with `is_admin: boolean`, populated from the `/api/check-auth` response.

**Implementation target:** `CommanderHut` (frontend repo), one field addition to `CommanderHut-backend`'s auth endpoint.

---

## Backend Change

**File:** auth controller — the endpoint that handles `GET /api/check-auth`

Include `is_admin` in the returned user object:

```json
{ "id": "...", "username": "...", "email_address": "...", "is_admin": true }
```

No schema change needed — `is_admin` already exists on the MongoDB User document.

---

## Frontend Changes

### 1. `User` type — `src/store/AuthSlice.tsx`

Add `is_admin: boolean` to the `User` interface:

```ts
export interface User {
  id: string;
  username: string;
  email_address: string;
  is_admin: boolean;
}
```

Add a selector:

```ts
export const selectIsAdmin = (state: { auth: AuthState }): boolean =>
  state.auth.user?.is_admin ?? false;
```

### 2. `RequireAdmin` component — `src/Components/Auth/RequireAdmin.tsx`

Mirrors `RequireAuth`. Shows `<Spinner />` while auth is resolving, redirects to `/` if authenticated but not admin, and renders children if admin.

```tsx
const RequireAdmin = ({ children }: Props) => {
  const status = useSelector(selectAuthStatus);
  const isAdmin = useSelector(selectIsAdmin);

  if (status === 'idle' || status === 'checking') return <Spinner />;
  if (status === 'unauthenticated') return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  return children;
};
```

### 3. Route — `src/App.tsx`

Add a new `adminRoute` helper and route:

```tsx
const adminRoute = (element: ReactElement) => (
  <PageBoundary>
    <RequireAdmin>{element}</RequireAdmin>
  </PageBoundary>
);

<Route path="/admin/masterprompt" element={adminRoute(<AdminMasterPrompt />)} />
```

### 4. Admin service — `src/services/adminService.ts`

Two functions backed by `axios` with `withCredentials: true`:

- `getMasterPrompt(): Promise<MasterPromptData>` — `GET /api/admin/masterprompt`
- `updateMasterPrompt(data: MasterPromptData): Promise<MasterPromptData>` — `PUT /api/admin/masterprompt`

```ts
interface MasterPromptData {
  role_description: string;
  domain_restrictions: string;
  additional_rules: string;
}
```

### 5. Admin page — `src/pages/AdminMasterPrompt.tsx`

Single-page form component. Layout: page title + subtitle, three editable labeled textareas, one greyed read-only textarea for Output Format, one "Save Changes" button.

**Data flow:**
- On mount: calls `getMasterPrompt()`, populates local state for each field. Shows a loading spinner while fetching. Shows an error message if the fetch fails.
- Editing: each textarea is a controlled input with its own state.
- Save: calls `updateMasterPrompt(...)`, shows "Saving…" on the button while in-flight (button disabled). On success: shows "Saved!" inline (clears after 2 seconds, button re-enables). On error: shows inline error message.

**Output Format field:** Read-only textarea displaying the hardcoded `OUTPUT_FORMAT` string (copied as a local constant in the component). A small label reads "(hardcoded — edit in source)". Greyed background to signal non-editable.

---

## Layout

Single-column form, full-width textareas. Each section:
- Section label (uppercase, small, grey)
- Textarea (auto-height enough for typical content — `rows={4}` for role/domain, `rows={6}` for rules, `rows={5}` for output format)
- Save Changes button right-aligned at the bottom of the form

No navigation link added in this ticket — the page is accessible by URL only.

---

## Files

| Action | File |
|--------|------|
| Modify | `src/store/AuthSlice.tsx` — add `is_admin` to `User`, add `selectIsAdmin` |
| Create | `src/Components/Auth/RequireAdmin.tsx` |
| Modify | `src/App.tsx` — add `adminRoute` helper and `/admin/masterprompt` route |
| Create | `src/services/adminService.ts` |
| Create | `src/pages/AdminMasterPrompt.tsx` |
| Backend | Auth endpoint — include `is_admin` in check-auth response |
