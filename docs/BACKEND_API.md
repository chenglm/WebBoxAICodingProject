# WebBox REST API

The backend is served at `/api`. All request and response bodies are JSON unless the endpoint says otherwise. Monetary values are integer cents (`2600` means `¥26.00`); clients must never calculate or submit a trusted total.

## Authentication and CORS

`POST /auth/login` sets `webbox_token`, an HTTP-only, `SameSite=Lax` cookie. The SPA must call every API with `credentials: 'include'`; it cannot read the cookie. `POST /auth/logout` clears it. The server allows credentialed calls only from `http://localhost:5173` and accepts `Content-Type` and `Idempotency-Key` request headers.

The backend will not start without `WEBBOX_JWT_SECRET`, a private value of at least 32 bytes. Set it in the local shell or uncommitted `.env`; never commit the value.

Unauthenticated protected endpoints return `401`; employee calls to `/admin/**` return `403`. Errors use `{ "code": "...", "message": "English message" }`.

## Auth

| Method and path | Request | Response |
| --- | --- | --- |
| `POST /auth/register` | `{email,password}`; password is 8+ characters with letters and numbers | `{id,email,role}` (employee) |
| `POST /auth/login` | `{email,password}` | `{id,email,role}` plus cookie |
| `POST /auth/logout` | none | `204`, clears cookie |
| `GET /auth/me` | none | `{id,email,role}` |

## Employee APIs

| Method and path | Purpose |
| --- | --- |
| `GET /menu?date=YYYY-MM-DD&q=&categories=Chinese&categories=Japanese&page=0&size=20` | Visible daily menu. Returns `{items,total,page,size,menuDate}`. Each item includes pricing, allergens, customization groups/items and `availableQuantity`. |
| `GET /menu/{dishId}?date=YYYY-MM-DD` | One visible daily-menu dish. |
| `GET /menu/categories` | Visible-dish category dictionary, returned as an alphabetically sorted string array. |
| `GET /menu/{dishId}/image` | Authenticated image stream when an administrator uploaded one. |
| `GET` / `PUT /me/preferences` | Read/update `{preferredCategories,spicePreference,tastePreference,budgetCents,allergens,recommendedEnabled}`. `tastePreference` is a flavour-intensity value: `Light`, `Moderate`, or `Rich`. `recommendedEnabled` is persisted per employee. |
| `GET` / `POST /me/addresses` | List/create `{id?,label,address,isDefault}`. |
| `PUT` / `DELETE /me/addresses/{id}` | Update/delete the caller's address. |
| `GET /orders/suggestion` | Server-selected `{deliveryDate,mealPeriod}` based on Shanghai cutoffs. |
| `POST /orders` | Create order; requires `Idempotency-Key`. See below. |
| `GET /orders` / `GET /orders/{id}` | Caller-owned order list/detail. |
| `POST /orders/{id}/cancel` | Cancels only a `Pending` order and restores inventory once. |

Create-order request:

```json
{
  "deliveryDate": "2026-09-23",
  "mealPeriod": "LUNCH",
  "addressId": 1,
  "items": [{"dishId": 1, "quantity": 2, "optionItemIds": [1]}]
}
```

`deliveryDate` and `mealPeriod` may be omitted for the server's nearest orderable meal. If a same-day requested meal is already closed, the server automatically resolves it to the nearest orderable meal. Provide either an owned `addressId` or `deliveryAddress`. A successful response is `{id,orderNumber,deliveryDate,mealPeriod,status,addressSnapshot,totalCents,items}`; `orderNumber` is a stable display identifier such as `WB-00000042`. Statuses are `Pending`, `Confirmed`, or `Cancelled`. Item prices and selected-option prices are server snapshots. Reusing the same key for the same user returns the original order. There can be only one active `Pending` or `Confirmed` order for a delivery date and meal period. Maximum total portions is five.

## Administrator APIs

All endpoints below require the `ADMIN` role.

| Method and path | Request / response |
| --- | --- |
| `GET /admin/dishes?q=&category=` | All dishes, including hidden dishes. |
| `POST /admin/dishes` | Creates a dish from the `DishInput` shape below; returns it. |
| `PUT /admin/dishes/{id}` | Replaces a dish and its allergens/customization groups; returns it. |
| `PATCH /admin/dishes/{id}/visibility?visible=true` | Changes availability; invalidates menu cache. |
| `POST /admin/dishes/{id}/image` | `multipart/form-data` with an `image` request part named `file`; max 5 MB. |
| `POST /admin/daily-menus` | `{menuDate:"YYYY-MM-DD",dishes:[{dishId,availableQuantity}]}`; upserts stock and invalidates menu cache. |
| `GET /admin/daily-menus?date=YYYY-MM-DD` | Reads the configured daily menu, including hidden dishes, as `{menuDate,items}`. Each item carries `availableQuantity`. |

`DishInput` is `{name,description,category,protein,spiceLevel,priceCents,imageUrl,visible,allergens,optionGroups}`. An `optionGroups` item is `{name,required,minSelections,maxSelections,items}` and an item is `{name,extraPriceCents}`.

## Important error codes

`VALIDATION_ERROR` (400), `INVALID_CREDENTIALS` (401), `FORBIDDEN` (403), `DISH_NOT_FOUND`/`ORDER_NOT_FOUND` (404), `EMAIL_EXISTS`, `ACTIVE_ORDER_EXISTS`, `OUT_OF_STOCK`, `ORDER_NOT_CANCELLABLE` (409), and `MISSING_IDEMPOTENCY_KEY` (400) are stable front-end handling codes. Stock failures roll back all item deductions; `OUT_OF_STOCK` names the unavailable dish in its English message.
