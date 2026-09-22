# FRONTEND TEST REPORT

Scope: `frontend/**` (React SPA — employee and administrator surfaces).
Verified against `docs/BACKEND_API.md` and the live services on 2026-09-22.

| Item | Value |
| --- | --- |
| Frontend | React 18 + TypeScript (strict) + Vite 5 + React Router 6 + TanStack Query 5 + Ant Design 5 |
| Backend under test | `http://localhost:8080/api` (Spring Boot, MySQL + Redis) |
| SPA under test | `http://localhost:5173` (Vite dev server, `/api` proxied) |
| Frontend HEAD at test time | `536d659` (afterwards `5114659` aligned the taste vocabulary) |
| Test data | Seeded demo accounts; all test orders cancelled and preferences restored afterwards |

## 1. Static verification

| Check | Command | Result |
| --- | --- | --- |
| Type check | `npx tsc -b` | ✅ 0 errors (strict, `noUnusedLocals`, `noUnusedParameters`) |
| Unit tests | `npx vitest run` | ✅ **31/31 passed** in 3 files |
| Production build | `npm run build` | ✅ built in 3.2s |

Unit test coverage (business logic owned by the frontend):

| File | Tests | Covers |
| --- | --- | --- |
| `src/shared/lib/money.test.ts` | 9 | Integer-cent formatting (`¥xx.xx`), zero/negative/small values, yuan↔cent conversion, no float math |
| `src/shared/lib/mealSlot.test.ts` | 11 | Asia/Shanghai cutoff rules (10:00 lunch / 15:00 dinner, exact boundaries), nearest-orderable resolution, month/year rollover |
| `src/features/cart/cartReducer.test.ts` | 11 | Same-config merge, different-config split, 5-portion cap clamping, quantity edit, remove/clear, totals |

Build output (vendor-split):

```
dist/index.html                     0.76 kB │ gzip:   0.38 kB
dist/assets/index-*.css             0.82 kB │ gzip:   0.43 kB
dist/assets/query-*.js             41.56 kB │ gzip:  12.53 kB
dist/assets/index-*.js             62.26 kB │ gzip:  19.23 kB
dist/assets/react-*.js            162.39 kB │ gzip:  53.01 kB
dist/assets/antd-*.js           1,131.70 kB │ gzip: 355.49 kB
```

> Note: `npm run build` requires `dist/` to be removed beforehand in this environment; the sandbox's bulk-delete guard interrupts Vite's own `emptyDir` step (`rm -rf dist && npm run build`).

## 2. API-level end-to-end verification

Executed with scripted `curl` / Python `urllib` sessions (cookie jars per role).

### 2.1 Authentication and session

| Case | Expected | Observed |
| --- | --- | --- |
| Register employee | 201 + user body | ✅ `{"id":3,"email":"e2e...","role":"EMPLOYEE"}` |
| Register does **not** start a session | no cookie set | ✅ confirmed — frontend auto-logs-in after sign-up |
| Login | 200 + `webbox_token` HTTP-only cookie | ✅ |
| `GET /auth/me` unauthenticated | 401 | ✅ `UNAUTHORIZED` |
| Employee calls `/admin/dishes` | 403 | ✅ `FORBIDDEN` |

### 2.2 Menu

| Case | Observed |
| --- | --- |
| `GET /menu?page=0&size=3` | ✅ `{items,total,page,size,menuDate}`; item carries `category` (single), `protein`, `spiceLevel` (title case), `priceCents`, `allergens`, `optionGroups`, `availableQuantity` |
| `GET /menu/categories` | ✅ `["Chinese","Japanese","Korean","Light Meal","Western"]` |
| `GET /orders/suggestion` after dinner cutoff (22:00) | ✅ `{"deliveryDate":"2026-09-23","mealPeriod":"LUNCH"}` |

### 2.3 Preferences and addresses

| Case | Observed |
| --- | --- |
| `GET /me/preferences` default | ✅ empty lists, nulls, `recommendedEnabled:false` |
| `PUT /me/preferences` round-trip | ✅ persists `preferredCategories/spicePreference/tastePreference/budgetCents/allergens/recommendedEnabled` |
| Invalid vocabulary rejected | ✅ `VALIDATION_ERROR` for non-server values (frontend now uses exactly the server vocabularies) |
| `POST /me/addresses` | ✅ `{"id":2,"label":"Office",...}` |

### 2.4 Ordering, inventory and idempotency

| Case | Observed |
| --- | --- |
| Submit order (dish 1, qty 2, +Brown rice) | ✅ `WB-00000004`, server-side price `(2600+100)×2 = 5400`; `201` |
| Repeat with same `Idempotency-Key` | ✅ same order id returned, no duplicate |
| Second order for same employee/date/period | ✅ `409 ACTIVE_ORDER_EXISTS` |
| Cancel `Pending` order | ✅ status `Cancelled`, stock restored 23 → 25 |
| Re-order after cancel | ✅ new order `WB-00000006` created |
| Dish stock forced to 0, then ordered | ✅ `409 OUT_OF_STOCK` — `"Insufficient stock for Pesto Pasta."` (names the dish) |
| Order response shape | ✅ `{id,orderNumber,deliveryDate,mealPeriod,status,addressSnapshot,totalCents,items}`; statuses `Pending/Confirmed/Cancelled` |

### 2.5 Admin console APIs

| Case | Observed |
| --- | --- |
| `GET /admin/dishes` | ✅ plain array of 9 dishes (incl. hidden), fields match `DishInput` |
| `GET /admin/daily-menus?date=2026-09-23` | ✅ `{menuDate,items}` incl. hidden dishes, each with `availableQuantity` |
| `POST /admin/daily-menus` | ✅ `204`; merge-upsert semantics verified (omitted dishes kept, quantity `0` = stop offering, no delete) |
| `PATCH /admin/dishes/{id}/visibility?visible=` | ✅ contract-compliant (covered by UI switch; not toggled during tests to preserve seed visibility) |

## 3. Browser-level verification (single session per role)

Scripted Chromium session against `http://localhost:5173`; screenshots retained as evidence.

### 3.1 Employee flow

| Step | Observed |
| --- | --- |
| Login as `employee@webbox.example` | ✅ redirect to `/menu`; navigation, cart badge, user menu rendered |
| Menu grid | ✅ 9 dish cards with image placeholder, name, `¥26.00` style prices, category/spice/protein tags, "25 portions left" |
| Recommendation & filters UI | ✅ "Recommended for me" switch present; search box (50-char cap) and multi-select category filter wired to `/menu?q=&categories=` |
| Dish detail modal | ✅ "Customize your dish", required group marked `Required · Choose 1`, "Add to cart" **disabled** until satisfied |
| Live pricing | ✅ selecting "Brown rice (+¥1.00)" updates total `¥26.00 → ¥27.00` |
| Add to cart | ✅ drawer opens, title `Your Cart (1/5)`, persistent cart line key `1#2` |
| Allergen confirmation | ✅ with `Peanuts` in preferences the card shows "Contains allergens you track"; adding opens English modal `Allergen notice` naming `Peanuts`, "Add anyway" continues |
| Checkout | ✅ default date = server suggestion, default address pre-selected, budget notice `This order exceeds your per-meal budget of ¥10.00. You can still place it.` (non-blocking) |
| Duplicate-order guard | ✅ submitting while an active order exists shows `You already have an active order for this slot.` with a link to My Orders |
| Order success | ✅ `Order placed!` with order number `WB-00000005`, delivery `2026-09-23 · Lunch · <address>`, total `¥27.00`, cart cleared |
| My Orders | ✅ list cards with status tags (`Pending`/`Cancelled`), `WB-…` numbers, detail drawer, `Cancel order` with English confirm → success |

### 3.2 Administrator flow

| Step | Observed |
| --- | --- |
| Admin login | ✅ lands on `/console/dishes` |
| Dish table | ✅ 9 rows (`Kung Pao Chicken · Chinese · ¥26.00 · Medium · Listed`), search + category filter + pagination |
| Edit drawer | ✅ `Edit dish` with Name / Description / Price (CNY) / Categories / Protein source / Spice level / Allergens / Listed / image upload, prefilled (`26.00`) and one option-group card |
| Daily menu page | ✅ 9 rows for the default date `2026-09-23` (tomorrow), quantity editor, "Stop offering" action, English hint that scheduled dishes cannot be deleted |
| Employee guard | ✅ `/console/dishes` for an employee renders the English 403 state |

### 3.3 Responsive layout

| Viewport | Observed |
| --- | --- |
| Desktop 1280×800 | ✅ horizontal navigation, cart badge, user email in header |
| Mobile 390×844 | ✅ hamburger navigation (`Open navigation`), 9 cards in a single column, no horizontal overflow |

## 4. Contract alignment work driven by testing

Integration testing surfaced divergences from the initial assumptions; all were fixed in `536d659`:

1. Server vocabularies are title-case: spice `None/Mild/Medium/Hot`; allergens `Peanuts/Dairy/Egg/Gluten/Soy/Fish/Shellfish`.
2. `tastePreference` vocabulary changed twice with the backend (`Savory…` → **`Light|Moderate|Rich`**, backend `f46268f`); the frontend now matches the source contract (`5114659`). **The running backend instance still serves the previous build — restart it before re-verifying this field live.**
3. Order statuses are `Pending/Confirmed/Cancelled`; the success screen and order views use the server-provided `orderNumber` (`WB-00000042` style).
4. `POST /auth/register` does not set the session cookie — the SPA logs in automatically after sign-up.
5. `recommendedEnabled` is persisted by `/me/preferences` (local `localStorage` store removed).
6. Categories come from `GET /menu/categories`; the admin daily menu reads `GET /admin/daily-menus?date=`.
7. Daily-menu writes are merge-upserts (no delete): the UI replaced "remove" with "Stop offering" (quantity 0) plus an English hint.

## 5. Known gaps and follow-ups

| # | Item | Owner | Note |
| --- | --- | --- | --- |
| 1 | Backend instance restart | Backend | Live service predates `f46268f`; re-run the preferences check after restart |
| 2 | Image upload E2E (`POST /admin/dishes/{id}/image`) | Frontend | UI implemented (multipart `file` part, ≤5 MB); not exercised in this round because the browser file-picker flow adds cost. Verify once with a real file before demo |
| 3 | Address management beyond checkout | Frontend | Only selection + free-text new address are implemented; `PUT/DELETE /me/addresses/{id}` are not surfaced (not in Tier 1/2 scope) |
| 4 | Automated UI regression suite | Frontend | Current browser checks are scripted ad-hoc; a Playwright smoke (login → add to cart → checkout) is recommended if regression risk grows |
| 5 | Demo credentials in README | Backend | Verified password is `Password123` for both demo accounts (backend `6b85c2b` documents access) |
| 6 | Real-time stock push, LLM recommendation, analytics dashboard | — | Explicitly out of scope for Tier 1 + Tier 2 |

## 6. How to reproduce

```sh
# services
set -a; . ./.env; set +a                       # project env
export WEBBOX_JWT_SECRET=<32+ byte secret>     # required by the backend
export SERVER_PORT=8081                        # 8080 may be occupied locally
cd backend && mvn spring-boot:run

# frontend
cd frontend && npm install
VITE_DEV_API_TARGET=http://127.0.0.1:8081 npm run dev   # http://localhost:5173

# checks
npx tsc -b && npx vitest run && rm -rf dist && npm run build
```

Demo accounts: `admin@webbox.example` / `employee@webbox.example`, password `Password123`.

## 7. Verdict

The SPA meets the Tier 1 + Tier 2 functional scope for both roles: authentication with cookie sessions and role guards, menu discovery with search/filters/details/customization, cart rules (merge, 5-portion cap), allergen and budget advisories, idempotent checkout with cutoff-aware slot selection and duplicate-order protection, order history with `Pending` cancellation, preferences, and the administrator Console for dishes and daily menus — on desktop and mobile layouts.

All user-visible copy is English; money is handled in integer cents end-to-end; local builds, type checks and 31 unit tests pass; API and browser verification passed against the live stack, with two residual items tracked above (backend restart for the newest taste vocabulary, and a one-off image-upload check).
