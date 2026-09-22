# WebBoxEnterpriseEmployeeMealOrderingPlatform — Technical Solution Overview

## 1. Objectives and Scope

WebBox is a meal ordering platform for enterprise employees. This phase delivers **Tier 1 (Core)** and **Tier 2 (Advanced)**: a front-end/back-end system that can be started locally, persists data, and can be demonstrated.

This phase does not implement Tier 3's real-time inventory sync, LLM recommendations, and operations dashboard; however, the order, inventory, and data models retain extensible boundaries so that core flows do not need to be refactored later.

### 1.1 Acceptance Objectives for This Phase

| Scope | Key Results |
| --- | --- |
| Tier 1 | Registration/login, menu browsing/search/multi-category filtering/details, cart with customization options, checkout and ordering, order history/details/cancellation |
| Tier 2 | Dietary preferences and allergen alerts, recommendation ranking, budget reminders, ordering rules, Admin Console dish and daily menu management |
| Infrastructure | Frontend SPA → Spring Boot (JDK 17) → standalone MySQL 8.4 |
| Quality baseline | All-English user interface; amounts calculated in cents; authentication and role isolation; parameter validation; idempotent ordering; core service tests |

### 1.2 Explicitly Out of Scope for This Phase

- Real-time push of menu inventory (SSE / WebSocket);
- AI streaming recommendations and LLM API integration;
- Console operations data dashboard.

> **Inventory capability within this phase's scope**: the `availableQuantity` of a daily menu is the currently sellable inventory. The order transaction deducts inventory via an atomic update with an inventory condition; when inventory is insufficient, the order is rolled back and the specific out-of-stock dish is returned; after a `Pending` order is successfully cancelled, inventory is restored within the same transaction. This is used to verify concurrency safety and prevent overselling. Only the real-time push capability — where other viewers see inventory changes without refreshing — is not implemented.

## 2. Requirements Analysis

### 2.1 Users and Permissions

The system contains two types of identities:

| Role | Capabilities | Access Boundaries |
| --- | --- | --- |
| `EMPLOYEE` | Menu, cart, preferences, checkout, own orders | Can only access and modify their own resources |
| `ADMIN` | Console dish management, listing/unlisting, daily menu configuration | Cannot perform unauthorized operations through employee-facing APIs; employees cannot access `/console` or `/api/admin/**` |

Authentication uses an enterprise email and password. The email is not restricted to a specific domain, but must be a valid format and unique; the password must be at least 8 characters and contain both letters and numbers. Passwords are stored only as BCrypt hashes; after login, a short-lived access token (JWT) is held in an HTTP-only Cookie.

### 2.2 Key Business Rules for the Employee Side

1. **Menu**: only dishes that belong to the current date, are listed, and are configured in that day's menu are shown; supports keyword search on name/description, multi-select category filtering, and pagination.
2. **Customization options**: items cannot be added to the cart until all required option groups are completed; each combination of choices is a separate cart line item; surcharges are immediately reflected in the unit price and subtotal.
3. **Cart**: the same dish with the same configuration merges quantities; different configurations occupy separate lines; the total number of portions is capped at 5. The cart is first saved by the frontend; at checkout the backend recalculates prices and validates, and client-side prices are not trusted.
4. **Meal period and cutoff**: lunch closes at 10:00, dinner closes at 15:00. If the default meal period has closed, the nearest orderable meal period is selected automatically: if today's dinner has not closed, today's dinner is selected; otherwise, the next day's lunch is selected.
5. **Duplicate orders**: the same employee, same delivery date, and same meal period can have only one active order (`Pending` / `Confirmed`). If an active order already exists, the frontend guides the user to view it, and the backend still enforces the validation.
6. **Idempotent submission**: the checkout page generates an `Idempotency-Key` for each submission; repeated requests with the same user and key return the same order result, and no additional orders can be created.
7. **Inventory deduction**: when an order is submitted, the server aggregates quantities by dish and performs an atomic conditional update to deduct inventory; if any dish is out of stock, the entire order fails and the out-of-stock dish is indicated; overselling is not possible.
8. **Order cancellation**: only `Pending` orders can be cancelled; status updates must be constrained by server-side conditions, and clients are prohibited from passing arbitrary statuses directly. After a successful cancellation, the corresponding dish inventory is atomically restored.

### 2.3 Preferences and Reminders

- Allergens are a reminder rather than a filter: when an allergen tagged by the employee is matched, the frontend displays an English confirmation dialog; the employee can still add the item after confirming.
- When "Recommended for me" is enabled, dishes are sorted by cuisine and spice-level match and highlighted; when disabled, the default sorting is used.
- When the cart total exceeds the per-meal budget cap, the checkout page displays a notice but does not block the order.

### 2.4 Admin Console

Administrators can search and filter all dishes by category, create/edit dishes, maintain image URLs, prices, categories, protein sources, allergens, spice levels, and customization options, and control listing status. The daily menu is configured by date with dishes and supply quantities; the default operating date is the next day, while initialization or adjustment of the current day's menu is also allowed.

## 3. Technology Selection

| Layer | Choice | Rationale |
| --- | --- | --- |
| Frontend | React + TypeScript + Vite + React Router + TanStack Query | High SPA development efficiency, clear type constraints, well-suited to forms, caching, and responsive pages |
| UI | Ant Design + a small amount of CSS Modules | Tables, form validation, modals, drawers, date pickers, and responsive grids work out of the box, ensuring high-quality interactions can be completed within 1.5 hours; CSS Modules are used only to supplement brand styling and mobile details |
| Backend | Java 17 + Spring Boot 3 + Spring Web / Validation / Security / Data JPA | Meets the PRD-mandated stack, mature ecosystem, convenient for transactions, authentication/authorization, and testing |
| Database | Standalone MySQL 8.4 | Meets persistence requirements, supports unique indexes and transactional constraints |
| Migration | Flyway | Versioned SQL initializes the schema and seed menu; startup is repeatable |
| API description | OpenAPI / springdoc | Interfaces can be viewed interactively during development; a static API document is also provided at delivery |
| Testing | JUnit 5 + Mockito + Spring Boot Test | Covers core logic such as ordering, time rules, permissions, and price calculation |

Local development uses the already-created MySQL `webox` database. The connection account and password are provided via local environment variables; real passwords or `.env` files are never committed.

## 4. System Architecture and Data Flow

```text
Browser (React SPA)
       │ HTTPS / JSON + Idempotency-Key
       ▼
Spring Boot REST API
 ├─ Security: JWT authentication + role authorization
 ├─ Controllers: request validation and HTTP mapping
 ├─ Application services: menu, cart checkout, order, preference, admin
 ├─ Domain rules: pricing, cutoff resolution, duplicate-order check
 └─ Repositories: JPA parameterized queries
       │ transaction
       ▼
MySQL 8.4 (schema managed by Flyway)
```

The menu read path uses a Redis cache: it caches a lightweight projection of "date + visible menu before filtering" with a short TTL (e.g., 60 seconds). After an administrator changes a dish's listing status or the daily menu, the cache for the corresponding date is actively invalidated. Redis is also used for short-lived duplicate-submission suppression; the idempotency records and unique constraints for orders are still ultimately enforced by MySQL. The development environment uses a `127.0.0.1:6380` instance isolated from other projects; production connects to managed Redis via environment variables.

## 5. Backend Module Breakdown

```text
backend/
  auth/          Registration, login, tokens, current user
  user/          User profile, delivery address, dietary preferences
  menu/          Dishes, customization options, daily menus, employee menu queries
  cart/          Request models and server-side cart validation (persistence can be deferred)
  order/         Checkout, price snapshots, idempotency, cancellation, order queries
  admin/         Dish and daily menu Console APIs
  common/        Exceptions, unified responses, audit fields, money/time utilities
```

The frontend is organized by feature: `auth`, `menu`, `cart`, `orders`, `settings`, `console`; each feature encapsulates pages, business components, request hooks, and types. `shared/ui` uniformly encapsulates Ant Design theming, common confirmation dialogs, and status components; `shared/api` manages the request client and error mapping; `shared/lib` holds money and time utilities. Route guards handle both unauthenticated access and role mismatches; all user-facing strings are centralized in English copy files to avoid missed Chinese text.

## 6. Data Model Overview

| Entity | Key Fields and Constraints |
| --- | --- |
| `users` | `id`, unique `email`, `password_hash`, `role`, timestamps |
| `user_preferences` | `user_id`, preferred categories, spice preference, taste preference, budget bounds |
| `user_allergens` | `user_id` + `allergen` unique |
| `addresses` | `id`, `user_id`, address, is-default |
| `dishes` | Name, description, `price_cents`, category, protein, spice level, listed status, image URL |
| `dish_allergens` | `dish_id` + `allergen` unique |
| `option_groups` / `option_items` | Dish customization groups, required flag, options, `extra_price_cents` |
| `daily_menus` | `menu_date` + `dish_id` unique, currently sellable `available_quantity` (non-negative); orders deduct atomically via conditional update, and cancellation restores atomically after a successful conditional status change |
| `orders` | User, date, meal period, address snapshot, status, `total_cents`, idempotency key; active-order unique constraint strategy see below |
| `order_items` | Dish name/price snapshot, quantity, subtotal |
| `order_item_options` | Selected option name/surcharge snapshot |
| `idempotency_records` | User, idempotency key, request digest, order ID, response status |

Monetary fields uniformly use `BIGINT` cents (e.g., `2250` means `¥22.50`); Java converts and displays with `long`/`BigDecimal`, never `double`.

## 7. Reliability and Security Design

### 7.1 Order Transaction and Idempotency

1. Validate JWT identity, request format, cart total portions, dish visibility, customization options, and cutoff rules;
2. Read/create the idempotency record within a single database transaction; if a completed record already exists, return the original order directly;
3. Check whether the employee has an active order for the same date and meal period;
4. The server calculates amounts based on the current prices of the menu and options; aggregates quantities by dish and executes, item by item, `UPDATE daily_menus SET available_quantity = available_quantity - :quantity WHERE menu_date = :date AND dish_id = :dishId AND available_quantity >= :quantity`. If any update affects 0 rows, an out-of-stock error is thrown and the entire transaction is rolled back;
5. Order, order items, and option snapshots are written only after all inventory updates succeed;
6. The idempotency result is written and the transaction is committed.

The database uses a unique constraint to help protect the idempotency key (`user_id, idempotency_key`). For "active order uniqueness", an in-transaction conditional check is used, and a unique index on `(user_id, active_meal_key)` is created in the schema using a uniquely-able `active_meal_key` (the active state is `date#meal`, and `NULL` after cancellation), preventing concurrent requests from slipping past the business check. The cancellation operation first conditionally updates the order (`status = Pending`), and restores inventory only when the affected row count is 1; thus repeated cancellations do not restore inventory multiple times.

### 7.2 Authorization and Input Protection

- Spring Security's method-level role control protects admin endpoints; resource queries always include the current `user_id` condition.
- Controllers use Bean Validation to limit lengths, enums, and formats (email/address ≤ 200, search term ≤ 50).
- JPA Criteria / parameter binding implement search and filtering without SQL concatenation; HTML/URL inputs are handled with allowlists and output encoding.
- Unified exception handling returns English error messages that are actionable but do not leak internal information.
- Login failures return a generic message, passwords are stored with BCrypt, and sensitive configuration is loaded only from environment variables.

### 7.3 Time and Testability

The backend uniformly uses the `Asia/Shanghai` timezone and injects a `Clock`, so cutoff rules can be tested reliably. Delivery date and meal period are ultimately resolved by the backend; the frontend displays the suggested values returned by the backend to avoid inconsistencies caused by browser clocks or timezone differences.

## 8. Initial Data and Demo Strategy

Flyway seed data will create: an admin account, a demo employee account, the 9 English dishes from the PRD, dish customization options, orderable menus for the current and next day, supply quantities, and a sample address. Passwords will not be written to the database in plaintext; pre-generated BCrypt hashes will be inserted; the demo account information will be clearly documented in the README.

Product images are copied from the candidate delivery package's `product_images/` into the frontend static assets with a stable mapping. When an image is missing, an English placeholder state is used and the core ordering flow is unaffected.

## 9. Testing and Delivery

Minimum test set:

- Price calculation (add-ons, multiple quantities, cent-unit precision);
- Cutoff auto-switching (10:00 and 15:00 boundaries and cross-day);
- Total portion cap, required customization options, and budget reminders;
- Repeated submissions with the same idempotency key produce only one order;
- Active order uniqueness for the same meal period, and re-ordering is possible after cancellation;
- Concurrent ordering will not push inventory below zero; insufficient inventory rolls back the entire order, and a successful cancellation restores inventory only once;
- Employee access to the Console is denied, while admins can operate it.

At delivery, the project root will contain `README.md`, executable tests, and the complete raw AI conversation export files in `ai-conversations/`; `docs/` will contain the API documentation and this technical solution. Each verified change unit is committed as a Git commit.

## 10. Implementation Order

1. Initialize the Maven backend, React frontend, environment variable template, MySQL/Flyway;
2. Model and seed data, complete authentication and the English base layout;
3. Complete menu, details, customization, cart, and ordering with conditional inventory deduction;
4. Complete order query/cancellation, preferences, and all ordering rules;
5. Complete Console dish/daily menu management;
6. Fill in tests, API documentation, startup instructions, and perform end-to-end verification.
