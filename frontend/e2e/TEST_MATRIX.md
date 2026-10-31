# Farmely E2E Test Matrix

Source audit: `src/App.jsx`, the role dashboards and API clients, Spring controllers and services, `Database/farmely_full_database.sql`, and `docker-compose.yml` (29 Oct 2026). This matrix tracks **implemented code paths**, not a claim of complete product coverage.

## Roles and surfaces found

| Role | UI surface | Backend or data surface | Current E2E state |
| --- | --- | --- | --- |
| Anonymous | Home, marketplace, plot detail, visit booking, login, registration, password recovery | Public catalogue and auth endpoints | Marketplace and auth validation smoke covered; other journeys blocked or pending |
| CUSTOMER | Garden, plot workspace, IoT, process, diary, harvest, contracts, AI/chat, account | Rentals, contracts, cultivation, monitoring, communication, payments | Dashboard smoke and client route guard covered |
| STAFF / FIELD_WORKER | Tasks, assigned plots, service requests, harvest, issue reports | Care tasks, service requests, harvest, issues | Dashboard smoke and client route guard covered |
| EXPERT | Chat, monitored plots, harvest approval, incidents, templates, compatibility, knowledge | Conversations, harvest, issues, knowledge | Dashboard smoke and client route guard covered |
| ADMIN | Overview, dispatch, contracts, visits, users, alerts, audit, nine master data catalogues | All management endpoints; `/api/users` restricted to ADMIN/EXPERT in identity service | Dashboard and catalogue navigation covered |
| LANDOWNER | No route, demo account, or default backend role found | `lands` table has no separate landowner role workflow | Not applicable in current code; revisit if implemented |

Default backend roles are `CUSTOMER`, `EXPERT`, `FIELD_WORKER`, `ADMIN` in `DataInitializer.java`. The UI maps `FIELD_WORKER` to `STAFF`. The existing quick-login tests and these new browser-seeded sessions are **demo/UI checks**; they do not prove JWT validity or API authorization.

## Test cases and priority

`PASS` means the named read-only Chromium test passed in this run. `BLOCKED` means an isolated test database or payment mock is required. `TODO` means safe coverage is not yet implemented.

| ID | Module / category | Case and key assertion | Priority | Status |
| --- | --- | --- | --- | --- |
| AUTH-01 | Authentication / happy | Anonymous access to each protected dashboard redirects to login | Smoke | PASS |
| AUTH-02 | Authentication / negative | Empty login stays on login with validation error | Smoke | PASS |
| AUTH-03 | Authentication / negative | Invalid registration name, phone, password and confirmation rejected before API call | Regression | PASS |
| AUTH-04 | Authentication / happy | Valid registration and login yield real JWT and customer role | Smoke | BLOCKED: registration writes users and login may write audit log |
| AUTH-05 | Authentication / negative | Wrong password, reset token expiry, duplicate email, public role escalation | Regression | BLOCKED: requires isolated identity database |
| AUTH-06 | Authentication / authorization | Customer cannot open admin route | Smoke | PASS: client route guard only |
| PUB-01 | Public / happy | Marketplace map and navigation render | Smoke | PASS; current catalogue returned 0 plots |
| PUB-02 | Public / workflow | Filter plots, inspect details, select compatible crop and lease interval | Regression | BLOCKED: no plot data in current environment |
| PUB-03 | Public / negative | Visit date in past rejected; confirm → complete, completed cannot cancel | Regression | BLOCKED: booking and transitions write data |
| CUS-01 | Customer / happy | Own garden dashboard renders | Smoke | PASS |
| CUS-02 | Customer / business | BR03 variety compatibility, BR04 minimum growing duration, BR07 overlapping lease, maintenance and start date | Critical regression | BLOCKED: reservation writes contracts/rentals; seed data required |
| CUS-03 | Customer / business | BR08 grace period once; activation; cancellation and refund state | Critical regression | BLOCKED: writes contracts/payments |
| CUS-04 | Customer / business | BR12 renewal at least 3 days before expiry and duration/compatibility checks | Critical regression | BLOCKED: renewal writes rentals |
| CUS-05 | Customer / happy | Read IoT, process, diary, contract details and account | Regression | TODO |
| CUS-06 | Customer / payment | VietQR/card/VNPay success, failed, cancel, return/IPN replay | Critical regression | BLOCKED: mock/sandbox and isolated database required |
| STF-01 | Staff / happy | Task dashboard renders | Smoke | PASS |
| STF-02 | Staff / workflow | Assigned task start → complete with evidence; service request handling | Critical regression | BLOCKED: writes tasks/service requests |
| STF-03 | Staff / negative | Harvest without plot, photo, weight or confirmation cannot submit | Regression | PASS: empty form cannot submit; individual field combinations remain TODO |
| STF-04 | Staff / workflow | Issue report and harvest record appear for expert | Critical regression | BLOCKED: cross-role writes |
| EXP-01 | Expert / happy | Dashboard renders | Smoke | PASS |
| EXP-02 | Expert / workflow | Diagnose issue, approve/reject harvest, advise staff/customer | Critical regression | BLOCKED: writes incidents, harvest, messages |
| EXP-03 | Expert / business | Knowledge/template/compatibility data visible and relevant to plot | Regression | TODO |
| ADM-01 | Admin / happy | Dashboard and master data render | Smoke | PASS |
| ADM-02 | Admin / happy | Lands, plots, IoT, crops, varieties, compatibility, documents, services, templates catalogues open | Regression | PASS: 9 routes |
| ADM-03 | Admin / workflow | CRUD master data, dispatch staff, manage visit/contract, user status | Critical regression | BLOCKED: writes/deletes database rows |
| ADM-04 | Admin / authorization | `/api/users` requires allowed role; user status and audit endpoints require ADMIN | Critical regression | BLOCKED: API auth requires real JWT; never log response body |
| XRL-01 | Cross-role / authorization | Staff cannot enter customer marketplace/checkout | Smoke | PASS: client route guard only |
| XRL-02 | Cross-role / authorization | Expert cannot enter admin master data | Smoke | PASS: client route guard only |
| XRL-03 | Cross-role / workflow | Customer reserves → mocked payment → admin activates → staff executes → expert reviews → customer sees result | Critical regression | BLOCKED: isolated database and payment mock required |

## Data and execution constraints

The schema defines 26 tables, including users, plots, contracts, rentals, payments, tasks, diaries, harvest, issues, conversations, notifications and audit logs. Database constraints include unique email/plot code/contract number and `rentals.end_date > start_date`. The application services add the business checks listed above.

`docker-compose.yml` and service defaults point to `farmely`, not a verified test database. Do not run mutation flows against that configuration. New `*.readonly.spec.ts` specs intercept all non-GET `/api/*` browser requests and avoid payment return/IPN endpoints. They use synthetic localStorage sessions, so their authorization assertions cover React route guards only. They do not inspect or print `/api/users` responses.

Run the safe suite with `npm run test:e2e:readonly`. Existing `example.spec.ts` and `smoke.spec.ts` are preserved and excluded from this command because their quick login calls `/api/auth/login` on the current environment.
