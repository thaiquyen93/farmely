# Mock audit on `fix/mock`

Checked React source, the Vite API plugin, the running PostgreSQL data, and the four role dashboards on 2026-10-30. Remaining items below are an inventory, not a request to change them in this round.

## Replaced with database data

- Expert assignment data: the expert plot list filters active rentals by the signed-in expert. Admin staff and expert selectors load user records through the existing API. Other expert dashboard examples are listed below.
- Admin revenue: successful `PAYMENT` transactions add revenue; successful `REFUND` transactions subtract it. Pending payments remain separate. Lease, service, monthly, gateway, and recent transaction figures all use the existing `payment_transactions` table. No revenue table was added.
- Service checkout: transaction amount now comes from the active service's database price, rather than a client supplied amount.
- Cancellation: the preview and approval use actual successful contract payments; approval records a refund transaction linked to the cancellation. The dashboard counts that transaction as negative revenue.
- Role login: demo tokens are no longer issued on failed login; quick role buttons authenticate with the seeded account password. Existing demo tokens are ignored when restoring a session.
- Admin crop, variety, process template, compatibility, and IoT station lists no longer start with sample rows. Admin audit logs also no longer show fabricated entries on API failure.
- Visible business rule codes were removed from the React UI and API response messages. Internal rule identifiers used by the lease logic remain.

## Remaining mock or browser-only features

These are outside the expert operations and admin revenue changes above. They should not be presented as database backed:

- Chat now loads assigned active rentals from PostgreSQL and stores messages there. The expert dashboard still contains static reference text and sample issue descriptions outside the chat flow.
- Customer IoT charts and alerts: `frontend/src/pages/customer/CustomerDashboard.jsx` retains fixed chart datasets and fixed alert values as fallbacks.
- Customer harvest requests and staff completion now persist in PostgreSQL. The old expert harvest panel, currently hidden by the integrated navigation, still contains browser-only localStorage logic and needs a separate cleanup if that panel is restored.
- AI assistant: `frontend/src/components/customer/FarmelySmartAssistant.jsx` returns canned local replies when the AI endpoint fails. `frontend/src/pages/customer/CustomerDashboard.jsx` also has an AI fallback.
- Site visit lounge: `frontend/src/components/customer/CustomerWelcomeLounge.jsx` can create a browser-only visit after an API failure.
- Service and emergency request UI: `frontend/src/pages/customer/CustomerDashboard.jsx` still has browser-only fallback paths and localStorage order caching. The tested service checkout API itself persists correctly.
- Password recovery: the public forgot/reset pages contain demo fallback paths when the API is unavailable.
- Admin process template detail has been changed to show a load or save error instead of sample rows; other informational text and static reference content across the app may remain by design.
- Staff task and plot cards still use example values when telemetry, crop details, or names are missing. Admin rental cards likewise use example plot codes, area, sensor values, and progress when API fields are empty.

## Verification

- `npm run build`: passed.
- `npm test`: 17 files, 169 tests passed.
- Real login and `/api/auth/me`: CUSTOMER, EXPERT, FIELD_WORKER, ADMIN all returned their own roles.
- Browser quick login: EXPERT opened `/expert/dashboard`; ADMIN opened `/admin/dashboard` and displayed the existing 3,360,000 VND refund as a negative entry.
- Service checkout test: client sent `amount: 1` for service S01. The API stored 25,000 VND from the service catalog; service revenue rose from 120,000 to 145,000 VND. Test rows were deleted, returning it to 120,000 VND.
- Cancellation approval SQL was executed in a PostgreSQL transaction against contract 6 with 6,075,000 VND paid. It calculated an 80% refund of 4,860,000 VND and changed contract/rental status; `ROLLBACK` restored all original data.
- Current integration run: service checkout ignored a client supplied 9,999,999 VND and raised revenue by the database price of 25,000 VND. A 5,000 VND refund reduced net revenue by 5,000 VND. Both test transactions were removed and net revenue returned to 18,650,000 VND.
- Current integration run: customer request on P-10 reached its assigned staff; completion saved 4.5 kg and evidence, and the customer notification API returned “Thu hoạch thành công”. Test request, result, and notifications were removed.
- Current integration run: reassignment of P-10 from expert 6 to expert 5 changed staff and expert chat visibility accordingly; the original assignment was restored and test conversations removed.
