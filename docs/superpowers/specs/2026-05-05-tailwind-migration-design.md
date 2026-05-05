# Tailwind Migration + Theme Toggle Design

## Goal

Replace styled-components with Tailwind CSS across the entire frontend and add a persistent light/dark theme toggle in the Navbar.

## Architecture

**Tailwind setup:**
- Uninstall `styled-components` and its types. Install `tailwindcss`, `postcss`, and `autoprefixer`.
- Configure Tailwind with `darkMode: 'class'` so dark mode is controlled by a `dark` class on `<html>`, not the OS preference.
- Extend `tailwind.config.js` with the existing color palette from `src/styles/colors.js` so custom brand colors remain available as Tailwind utilities.
- Add `@tailwind base; @tailwind components; @tailwind utilities;` to `src/index.css`.

**Theme context:**
- `src/context/ThemeContext.tsx` — React context that initializes from `localStorage.getItem('theme') ?? 'light'` on mount, applies/removes the `dark` class on `document.documentElement` synchronously (no flash), and exposes `{ theme, toggleTheme }`.
- `ThemeProvider` wraps the app in `main.tsx`.

**Theme toggle in Navbar:**
- Sun/moon icon button in `Navbar.tsx` calls `toggleTheme()`. Writes new value to `localStorage`.
- Uses a simple SVG icon swap: sun icon when dark, moon icon when light.

**Migration scope — files to convert:**
- `src/Components/Navbar.tsx`
- `src/Components/UI_Components/Button.tsx`
- `src/Components/UI_Components/Spinner.tsx`
- `src/Components/UI_Components/ErrorState.tsx`
- `src/Components/UI_Components/PageBoundary.tsx`
- `src/Components/Auth/RequireAuth.tsx`
- `src/Components/Auth/RequireAdmin.tsx`
- `src/pages/home.tsx`
- `src/pages/Login.tsx`
- `src/pages/RegisterUser.tsx`
- `src/pages/CardPage.tsx`
- `src/pages/AdminMasterPrompt.tsx`
- `src/pages/Profile/Profile.tsx`
- `src/pages/Sandbox.tsx`
- `src/Components/Decksmith/DeckPanel.tsx`
- `src/Components/Decksmith/DeckPanelEmpty.tsx`
- `src/App.tsx` (remove GlobalStyle if any)

Each file: remove `styled` imports, delete styled-component declarations, replace with `className` using Tailwind utilities. Component props and logic are unchanged.

## Dark Mode Colour Mapping

| Light | Dark |
|-------|------|
| `bg-white` | `dark:bg-gray-900` |
| `text-gray-900` | `dark:text-gray-100` |
| `border-gray-200` | `dark:border-gray-700` |
| `bg-gray-50` (panels) | `dark:bg-gray-800` |
| `bg-blue-600` (buttons) | `dark:bg-blue-500` |

## Error Handling

No API calls introduced. Theme reads/writes `localStorage` which is synchronous and never throws in supported browsers.

## Testing

- `ThemeContext` tested: initializes from localStorage, toggles class on `document.documentElement`, persists to localStorage.
- `Navbar` theme toggle tested: button present, clicking calls toggleTheme.
- Existing component tests updated to remove styled-components matchers and use `className` queries instead where needed. No logic tests change.

## Out of Scope

- Migrating Decksmith AI chat (large component, handled separately).
- Changing any component behaviour, routing, or API calls.
- Adding new pages (covered in Spec 2).
