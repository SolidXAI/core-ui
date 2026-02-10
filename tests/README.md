# UI Tests (Playwright)

## Environment
- `UI_BASE_URL` (example: `http://localhost:5173`; defaults to `http://localhost:5173` if unset)

Core UI tests are compiled to `dist-tests/` and shipped for execution from `node_modules`.

## Consuming Project Dev Dependencies
- `@playwright/test`
- `dotenv` (optional if you want `.env` support)

## Run (from a consuming project)
- `npx playwright test --config playwright.config.ts`
