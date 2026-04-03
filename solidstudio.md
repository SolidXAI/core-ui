# SolidX Studio

## The Idea

The goal was to create a persistent AI assistant experience across the entire application — similar to Shopify's theme editor or WordPress's site customizer. The user (an admin) can enter a special "Studio mode" from anywhere in the app, get a side panel with an AI chat agent, and navigate freely without losing the conversation. When done, they exit and the app returns to normal.

The key product requirements that shaped every decision:

- The AI panel must be **persistent across all navigation** — the chat session should never reset when moving between pages
- It must work on **any layout** — not just the built-in admin layout, but also fully custom layouts that consuming apps create
- It must work on **public (unauthenticated) routes** as well as protected ones
- Only **admin role users** can enter Studio mode
- The panel is **only visible when the user is logged in**
- Studio state **persists across page refreshes** (localStorage)
- On **logout**, Studio mode exits automatically

---

## What We Started With

The AI chat component (`SolidAiChat`) existed but was embedded inline in specific views:

- `SolidDashboard.tsx` — rendered in a collapsible panel section
- `SolidListView.tsx` — rendered in a side panel inside the list view
- `SolidChatterLocaleTabView.tsx` — rendered as a tab called "SolidX AI"

Every time the user navigated away from these views, the chat component unmounted and the conversation was lost. It was also completely invisible from any other page.

---

## Iteration 1: Layout-Level Wrapper (Abandoned)

The first approach was to lift the panel into the layout. We created `SolidStudioWrapper` — a component that, when studio mode was active, restructured the layout into a two-column grid: the normal app on the left, the AI panel on the right.

```
AdminLayout
  └── if studioMode: SolidAiStudioLayout (grid: [app | AI panel])
      else: Layout (normal)
```

**Problem:** This only worked for `AdminLayout`. Any consuming app that built a custom layout (e.g. `MerchantAppLayout` in `mswipe-nbf-app`) would not get Studio mode — they'd have to duplicate the logic themselves. It was layout-specific, not global.

---

## Iteration 2: Fixed Panel at App Root (Final Architecture)

The insight was to stop thinking about Studio as a layout concern and start thinking about it like a **chat widget** — something mounted once at the app root that floats over everything, regardless of what route or layout is active.

### How it works

```
BrowserRouter
  └── StoreProvider  (Redux, includes solidStudio reducer)
        └── AppEventListener  ← renders <SolidStudioPanel /> here
        └── AppRoutes         ← all routes, unchanged
```

`SolidStudioPanel` is `position: fixed` on the right edge of the screen. It reads from Redux to decide whether to render. When active, it sets `document.body.style.paddingRight` to the panel width (`420px`), which pushes all page content left — including custom layouts in consuming apps — without requiring any CSS changes in those projects.

```ts
// Inside SolidStudioPanel's useEffect
document.body.style.paddingRight = active ? PANEL_WIDTH : "";
document.body.style.transition = "padding-right 220ms ease";
```

This is cleaned up on unmount so it never leaks.

### Why padding-right on body, not margin-right?

`padding-right` on `body` was chosen over `margin-right` for two reasons:

1. **No visual gap** — padding extends the body's background into the padded area, so the page background fills the space between content and the panel. `margin-right` creates a gap that shows the `<html>` background instead, which breaks dark-mode and custom themed apps.
2. **Industry standard** — this is the same technique Bootstrap uses for modal scroll-lock (`body { padding-right: scrollbarWidth }`). It's a well-understood, widely tested pattern.

One caveat: if a consuming app applies `overflow-x: hidden` directly to `body`, padding can be clipped. In that case, `document.documentElement.style.marginRight` on `<html>` is a safe fallback — but in practice none of our consuming apps have this.

### Why AppEventListener?

`AppEventListener` is already mounted once at the app root in every consuming app:

```tsx
// App.tsx in any consuming project
<AppEventListener />
```

Adding `<SolidStudioPanel />` to its return value means consuming projects get Studio support automatically with zero code changes. They don't need to know it exists.

---

## Files Changed

### New files

**`src/redux/features/solidStudioSlice.ts`**

Redux slice that owns Studio mode state. Persists to localStorage under key `solidx.studio.mode` so the mode survives page refreshes.

```ts
// State shape
{ isStudioMode: boolean }

// Actions
enterStudioMode()  // sets true, writes to localStorage
exitStudioMode()   // sets false, removes from localStorage
```

Initialises from localStorage on load:
```ts
const initialState = { isStudioMode: readFromLS() };
```

**`src/components/layout/SolidAiStudioLayout.tsx`**

Contains `SolidStudioPanel` — the fixed right panel. Key behaviours:

1. **Auth gate** — reads `useSession()`. If `status !== "authenticated"`, returns `null`. The panel is never shown to logged-out users.
2. **Auto-exit on logout** — if session becomes `"unauthenticated"` while studio is active, dispatches `exitStudioMode()` which also clears localStorage.
3. **Body padding** — sets `document.body.style.paddingRight` to `420px` when studio is active, shifting all page content left universally. Cleaned up on unmount.
4. **Always-mounted AI chat** — `SolidAiChat` lives inside the panel and is never unmounted while studio mode is active, preserving the WebSocket connection and full message history across all navigation.

```tsx
// Render guard
if (!isStudioMode || !isAuthenticated) return null;
```

### Modified files

**`src/redux/store/defaultStoreConfig.ts`**

Added `solidStudio: solidStudioReducer` to `solidReducers`. Because `createSolidStore` consumes this object, all consuming apps automatically get the slice in their store — no action needed from the consuming project.

**`src/routes/AppEventListener.tsx`**

Changed from returning `null` to returning `<SolidStudioPanel />`. This is the mount point that makes Studio available everywhere without consuming apps needing any code changes.

**`src/components/layout/AdminTopHeader.tsx`**

Added the Studio trigger button. Visible only to users with the `admin` role (checked via `hasAnyRole(user?.roles, ["Admin"])`). Dispatches `enterStudioMode()` on click.

**`src/resources/shadcn-base.css`**

Added Studio panel CSS classes. All values use existing CSS custom properties (`--primary`, `--border`, `--background`, etc.) so the panel automatically adapts to light/dark theme.

Key classes:
- `.solid-studio-panel-fixed` — the fixed right panel
- `.solid-studio-bar` — branded top bar inside the panel with exit button
- `.solid-studio-trigger-btn` — the "Studio" button in the admin header

No layout shift CSS is needed anywhere — content shifting is handled entirely via `document.body.style.paddingRight` at runtime.

**`src/components/core/list/SolidListView.tsx`**
**`src/components/core/dashboard/SolidDashboard.tsx`**
**`src/components/core/locales/SolidChatterLocaleTabView.tsx`**

All inline `SolidAiMainWrapper` usages commented out. The AI assistant is no longer embedded per-view — it lives in the global Studio panel.

---

## Integration in a Consuming App

### Admin-only app (e.g. school-fees-portal)

Zero changes required. `AdminLayout` → `AdminTopHeader` already has the Studio button. `AppEventListener` already mounts the panel. Body padding shifts the content automatically.

### App with custom layouts (e.g. mswipe-nbf-app)

Also zero changes. `AppEventListener` is already in `App.tsx`:

```tsx
<AppEventListener />  // SolidStudioPanel is rendered inside this
<AppRoutes />
```

When an admin activates Studio from an admin route and navigates to a public merchant-app route (`/merchant-app/home`), the panel stays visible — the Redux state and the AI chat session are preserved. The body `padding-right` shifts the merchant-app content left automatically, just like any other layout. No CSS opt-in required.

---

## Auth & Role Summary

| Check | Where | What it does |
|---|---|---|
| `hasAnyRole(user?.roles, ["Admin"])` | `AdminTopHeader` | Hides the Studio button from non-admins |
| `status === "authenticated"` | `SolidStudioPanel` | Prevents panel rendering for logged-out users |
| `status === "unauthenticated" && isStudioMode` | `SolidStudioPanel` | Auto-exits and clears localStorage on logout |

---

## State Flow

```
User clicks "Studio" button (admin only)
  → dispatch(enterStudioMode())
  → Redux: isStudioMode = true
  → localStorage: solidx.studio.mode = "true"
  → SolidStudioPanel: renders fixed panel
  → document.body.style.paddingRight = "420px"
  → All page content shifts left by 420px (any layout, any consuming app)

User clicks "Exit Studio"
  → dispatch(exitStudioMode())
  → Redux: isStudioMode = false
  → localStorage: solidx.studio.mode removed
  → SolidStudioPanel: returns null
  → document.body.style.paddingRight = ""
  → Content shifts back

User logs out while in Studio
  → useSession: status → "unauthenticated"
  → SolidStudioPanel effect: dispatch(exitStudioMode()) automatically
  → Same cleanup as above
```
