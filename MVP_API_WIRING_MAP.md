# MVP — API Wiring Map

**Agent H — Frontend Integration** · 2026-07-23
Status: **all 14 pages wired.** Zero business data reads `localStorage`.

Auth: all admin endpoints require `Authorization: Bearer <12h JWT>`.
Branch: `SCOPED` = server filters to the caller's branch unless OWNER.

---

## Wiring status by page

| Page | Was | Now calls | Auth | Branch | Status |
|---|---|---|---|---|---|
| `Login.tsx` | wrote `'dev-token'`, ignored password | `POST /auth/login` | public | — | ✅ |
| `ProtectedRoute.tsx` | checked a string existed | `GET /auth/me` | ✅ | — | ✅ |
| `Dashboard.tsx` | 5 localStorage reads | `appointments`, `clients`, `invoices`, `inventory/low-stock`, `service-visits` | ✅ | SCOPED | ✅ |
| `Clients.tsx` | `clientStore` ×4 | `GET/POST/PUT/DELETE /admin/clients` | ✅ | SCOPED | ✅ |
| `ClientDetail.tsx` | 4 reads | `clients/:id`, `service-visits?clientId=`, `invoices?clientId=`, `appointments` | ✅ | SCOPED | ✅ |
| `Appointments.tsx` | 7 calls | `GET/POST/PUT/DELETE /admin/appointments` + services/clients/staff | ✅ | SCOPED | ✅ |
| `Calendar.tsx` | 1 read | `GET /admin/appointments` | ✅ | SCOPED | ✅ |
| `Services.tsx` | 5 calls | `GET/POST/PUT/DELETE /admin/services` | ✅ | GLOBAL | ✅ |
| `Staff.tsx` | 4 calls | `GET/POST/PUT/DELETE /admin/staff` | ✅ | SCOPED | ✅ |
| `Inventory.tsx` | 3 calls | `GET/POST/PUT/DELETE /admin/inventory` | ✅ | SCOPED | ✅ |
| `Invoices.tsx` | 8 calls + client-side money | `GET/POST/PUT/DELETE /admin/invoices` | ✅ | SCOPED | ✅ |
| `Billing.tsx` | 14 calls + client money + client side effects | `POST /admin/invoices` (intent only) | ✅ | SCOPED | ✅ |
| `Settings.tsx` | 4 calls + `resetStore` | `GET/PUT /admin/settings` | ✅ | GLOBAL | ✅ |
| `Contact.tsx` (public) | EmailJS placeholders → always threw | `POST /api/public/contact` | public | — | ✅ |

## Payload changes the frontend had to make

| Page | Change |
|---|---|
| `Billing.tsx` | Sends `{serviceId\|productId, quantity}` + `discount:{type,value}`. **No** subtotal/tax/total/unitPrice. Displays the server's returned invoice. |
| `Billing.tsx` | Removed client-side stock decrement, `totalVisits` increment, and appointment completion — the server does all three in one transaction. |
| `Invoices.tsx` | Same intent-only payload; dropped local `Math.round` tax arithmetic. |
| `Billing`/`Invoices` | Stopped sending `invoiceNumber`; server generates it. |
| All create forms | `branch` display name → resolved to `branchId` by `store.ts`; server overrides for non-owners. |
| `Staff.tsx` | `branchId`/`role` no longer sent on update — server rejects them by design. |
| `Settings.tsx` | "Reset All Data" button removed. |

## Deliberately preserved

- **Live preview arithmetic in `Billing.tsx`.** The cashier must see a total before taking payment; a round-trip per keystroke would be unusable. The preview is display-only — the server's returned total is what is shown on the confirmation screen and stored. If they ever disagree, it is visible immediately rather than silently recorded.
- All component JSX, CSS, and layout. No UI redesign.
- `@tanstack/react-query` is still installed but unused — pages use `useState` + `useEffect`, matching the existing pattern. Adding a second data-fetching paradigm in 14 files was not worth it for v1.

## Known rough edges

| # | Issue | Impact |
|---|---|---|
| W1 | Lists request `limit=100`; a branch with >100 clients silently truncates | Fine at current scale; pagination is deferred |
| W2 | Errors surface via `alert()` on some pages, toasts on others | Cosmetic inconsistency |
| W3 | Walk-in clients get a synthesised `<digits>@walkin.local` email because the API requires one | Slightly ugly data; avoids a schema change |
| W4 | Branch filter dropdowns still match on display-name substrings | Works for two branches; revisit at more |
| W5 | No optimistic UI — every mutation refetches | Simpler and correct; marginally more requests |
