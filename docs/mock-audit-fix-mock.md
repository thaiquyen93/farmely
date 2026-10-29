# Mock audit on `fix/mock`

Checked React source, the Vite API plugin, the running PostgreSQL data, and the four role dashboards on 2026-10-29.

## Replaced with database data

- Expert operations: assigned active rentals, issue reports, process templates, plot/variety compatibility, knowledge documents, and worker list now load through the existing APIs. Failed writes no longer claim local success for diagnosis or task dispatch.
- Admin revenue: successful `PAYMENT` transactions add revenue; successful `REFUND` transactions subtract it. Pending payments remain separate. Lease, service, monthly, gateway, and recent transaction figures all use the existing `payment_transactions` table. No revenue table was added.
- Service checkout: transaction amount now comes from the active service's database price, rather than a client supplied amount.
- Cancellation: the preview and approval use actual successful contract payments; approval records a refund transaction linked to the cancellation. The dashboard counts that transaction as negative revenue.
- Role login: demo tokens are no longer issued on failed login; quick role buttons authenticate with the seeded account password. Existing demo tokens are ignored when restoring a session.
- Admin crop, variety, process template, compatibility, and IoT station lists no longer start with sample rows. Admin audit logs also no longer show fabricated entries on API failure.
- Visible business rule codes were removed from the React UI and API response messages. Internal rule identifiers used by the lease logic remain.

## Remaining mock or browser-only features

These are outside the expert operations and admin revenue changes above. They should not be presented as database backed:

- Chat across customer, expert, and staff: `frontend/src/api/communication/chatStorage.js` seeds ten sample conversations in localStorage; `chatService.js` writes locally first and sends a best effort backend request with hardcoded sender IDs. The expert inbox still displays those sample threads.
- Customer IoT charts and alerts: `frontend/src/pages/customer/CustomerDashboard.jsx` retains fixed chart datasets and fixed alert values as fallbacks.
- Harvest plans and requests: the expert and customer dashboards share localStorage data and do not persist the full workflow in PostgreSQL.
- AI assistant: `frontend/src/components/customer/FarmelySmartAssistant.jsx` returns canned local replies when the AI endpoint fails. `frontend/src/pages/customer/CustomerDashboard.jsx` also has an AI fallback.
- Site visit lounge: `frontend/src/components/customer/CustomerWelcomeLounge.jsx` can create a browser-only visit after an API failure.
- Service and emergency request UI: `frontend/src/pages/customer/CustomerDashboard.jsx` still has browser-only fallback paths and localStorage order caching. The tested service checkout API itself persists correctly.
- Password recovery: the public forgot/reset pages contain demo fallback paths when the API is unavailable.
- Admin process template detail has been changed to show a load or save error instead of sample rows; other informational text and static reference content across the app may remain by design.

## Verification

- `npm run build`: passed.
- `npm test`: 17 files, 169 tests passed.
- Real login and `/api/auth/me`: CUSTOMER, EXPERT, FIELD_WORKER, ADMIN all returned their own roles.
- Browser quick login: EXPERT opened `/expert/dashboard`; ADMIN opened `/admin/dashboard` and displayed the existing 3,360,000 VND refund as a negative entry.
- Service checkout test: client sent `amount: 1` for service S01. The API stored 25,000 VND from the service catalog; service revenue rose from 120,000 to 145,000 VND. Test rows were deleted, returning it to 120,000 VND.
- Cancellation approval SQL was executed in a PostgreSQL transaction against contract 6 with 6,075,000 VND paid. It calculated an 80% refund of 4,860,000 VND and changed contract/rental status; `ROLLBACK` restored all original data.
