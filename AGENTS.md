# WebBox Collaboration Requirements

All contributors must read [TECHNICAL_SOLUTION.md](docs/TECHNICAL_SOLUTION.md) and this file before making changes. The scope is **Tier 1 + Tier 2**, plus transactional inventory decrement/restore for concurrent order safety. Do not implement Tier 3 real-time inventory push, LLM recommendation, or the Console analytics dashboard unless explicitly assigned later.

## Non-negotiable product language rule

Every user-facing string must be **English**. This includes all UI labels, buttons, navigation, titles, menu data, categories, descriptions, allergens, spice levels, customization options, placeholders, form validation messages, toast/modal/error/success messages, empty/loading states, confirmation dialogs, order statuses, budget/allergen prompts, Console text, and accessibility labels.

Chinese is allowed only in internal engineering documents and code comments that are not exposed to users. Do not use PRD Chinese examples directly in UI, seed data, API error messages, or test assertions for visible copy.

## Mandatory platform and delivery constraints

- Deliver a complete local full-stack application: SPA → Java 17 + Spring Boot → independently running MySQL. H2, SQLite, in-memory databases, and embedded databases are prohibited.
- Use the existing project environment contract in `.env.example` and `ENVIRONMENT.md`. MySQL is the source of truth; Redis is available at the configured project port for menu caching and short-lived duplicate-submission suppression.
- Passwords must be BCrypt-hashed; never store plaintext passwords or commit secrets.
- Validate and bound all input: email format; password at least 8 characters containing letters and numbers; email/address no more than 200 characters; search input no more than 50 characters.
- Use integer cents (`long` / `BIGINT`) for all money calculations and format amounts as `¥xx.xx`; never use floating point for money.
- Protect all endpoints with authentication and role authorization. Employees may access only their own resources; only `ADMIN` may access Console APIs and routes.
- Use parameter binding/JPA APIs, never concatenate user input into SQL.
- Every order submit must be idempotent. Repeating the same authenticated request with the same `Idempotency-Key` must return one order, never create another.
- Enforce one active (`Pending` or `Confirmed`) order per employee/date/meal period, including under concurrent requests.
- Enforce a maximum of five total meal portions per order.
- On order placement, decrement daily-menu inventory atomically using a conditional update; prevent negative stock and roll back the entire order if any dish is insufficient. A successful `Pending` cancellation restores stock exactly once.
- Enforce lunch cutoff at 10:00 and dinner cutoff at 15:00 in `Asia/Shanghai`; automatically select the nearest orderable meal period as defined in the PRD.
- Keep the employee experience responsive on mobile and desktop. Use Ant Design for standard tables, forms, modals, drawers, date selection, feedback, and responsive grid patterns.
- Database schema and seeds must be managed by Flyway. Include English menu seed data and a current-day orderable menu for demonstration.
- Add tests for the business logic you implement, especially pricing, cutoff selection, idempotency, active-order uniqueness, authorization, inventory decrement/rollback, and cancellation restock.
- Update API documentation and local start instructions when API or configuration behavior changes.
- Preserve the complete, original AI coding conversation export under `ai-conversations/` for final delivery. Screenshots, excerpts, or retrospective summaries do not satisfy this requirement.
- Do not commit `.env`, credentials, runtime data, generated build output, or `node_modules`.

## Collaboration protocol

- Work only in your assigned area; do not overwrite another agent's changes.
- Read `git status` before modifying shared files. If a change is needed in a shared contract (API shape, DTO, database migration, environment configuration), state the dependency clearly rather than guessing.
- Keep changes cohesive, verify them, then create a Git commit with a descriptive conventional-style message before handing work back.
- Report the commit SHA, files changed, verification run, and any integration dependencies in the handoff.
