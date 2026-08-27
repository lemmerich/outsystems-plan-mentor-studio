# E2E Tests

## Setup

```bash
npm install
npx playwright install chromium
cp .env.example .env
# Edit .env and set BASE_URL to the published app URL from env_app
```

## Running tests

Run a single wave:
```bash
WAVE=1 npm test -- tests/w1.spec.ts
```

Run all committed waves:
```bash
npm test
```

Run with UI (useful for debugging):
```bash
npm run test:ui
```

## Test files

| File | Wave | What it covers |
|---|---|---|
| `w1.spec.ts` | W1 — Foundation | [fill in] |
| `w2.spec.ts` | W2 — [name] | [fill in] |

## Fixture files

Place any files needed by tests (PDFs, etc.) in `tests/files/`.
See `tests/files/README.md` for what each file is for.

## When a test fails

1. Do not proceed to the next wave.
2. Check whether the test or the app is wrong — the spec's test cases are the arbiter.
3. If the test is wrong, fix the test AND the spec together.
4. If the app is wrong, fire a fix turn against the same wave.

## Selector conventions

All locators and verbatim messages live in `support/selectors.ts`.
When a screen changes, update selectors there — not in individual test files.
