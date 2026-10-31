# Farmely Playwright E2E run — 29 Oct 2026

Command: `npm run test:e2e:readonly` from `frontend/` (Chromium, one worker).

| Result | Count | Meaning |
| --- | ---: | --- |
| PASS | 21/21 | New read-only Playwright tests executed successfully |
| FAIL | 0 | No failing tests in the final run |
| BLOCKED | 14 matrix cases | Need verified isolated database, seed data and/or payment mock |
| TODO | 2 matrix cases | Additional safe read-only coverage still to implement |

Scope of the 21 passing tests: authentication guard/validation (4), customer and marketplace smoke (2), staff dashboard and empty harvest validation (2), expert dashboard smoke (1), admin dashboard and nine catalogues (10), cross-role UI guards (2). The prior Customer Dashboard test in `example.spec.ts` was preserved. The existing quick-login suites were excluded from this run because they send `/api/auth/login` to the current environment.

The current marketplace rendered **0 plots**, so plot selection, compatibility, booking and lease checks were not exercised. `docker-compose.yml` defaults to the `farmely` database; an independent test database has **not** been verified. Payment flows were not invoked. Synthetic browser sessions mean role guard PASS results apply only to React navigation, not backend JWT enforcement. No `/api/users` response body was printed by the tests.

Test-only corrections during execution: replaced a login focus assertion with the actual validation alert, used the marketplace's Map region because it has no `<main>`, and scoped the admin Lands selector to its sidebar link. No business logic was modified.

Observed source risk: `src/components/common/Input.jsx` displays a required marker but does not forward the `required` attribute to the native `<input>`. The login form still rejects empty fields in its React handler. This was not changed as part of the test work.

Full planned cases, business rules, role inventory and the blocked feature list are in [TEST_MATRIX.md](TEST_MATRIX.md). Next execution gate: provision a distinct database, verify every backend `DB_URL` points to it, seed deterministic fixtures, and route all payment calls to mock/sandbox before running mutation workflows.
