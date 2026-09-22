# WebBox Backend Acceptance Test Report

**Acceptance date:** 2026-09-22
**Acceptance scope:** Tier 1, Tier 2, and backend capabilities related to inventory transactions, idempotency, and concurrency safety.
**Acceptance method:** Code review, Maven automated tests, startup verification with real MySQL/Redis, read-only API verification.

## 1. Conclusion

**Conditional pass.**

The submitted backend is ready for front-end/back-end integration: infrastructure, Flyway, authentication and authorization, menu caching, menu categories, preference enums, cutoff, idempotency design, and inventory transaction code have all been verified.

The real concurrent integration tests have passed against an isolated MySQL test database. The only remaining delivery condition is to commit the relevant tests and Maven profile to Git so that this verification can be reproduced along with the deliverables.

## 2. Verified Environment and Commands

| Item | Result |
| --- | --- |
| Java | OpenJDK 17.0.20.1 |
| Maven | 3.8.3 |
| MySQL | Standalone MySQL 8.4.11 |
| Redis | Standalone project instance available |
| Flyway | 7 migrations verified at startup, database upgraded to V7 |

Executed:

```sh
. scripts/use-project-java.sh
cd backend
mvn test
```

Result: **21 tests passed, 0 failures, 0 errors, 0 skipped**.

Executed real MySQL concurrent integration tests:

```sh
WEBBOX_TEST_DB_NAME=webbox_backend_it mvn verify -Pmysql-it
```

Result: default tests **21/21 passed**; Failsafe MySQL integration tests **5/5 passed**.

To avoid occupying the default port, the service was started on a temporary port, with the audit JWT secret provided only in the process environment:

```sh
SERVER_PORT=28094 mvn spring-boot:run
```

Startup successfully connected to the real MySQL and Redis, and executed Flyway V7. The temporary process was stopped after acceptance was completed.

## 3. Acceptance Matrix

| Acceptance Item | Status | Evidence |
| --- | --- | --- |
| JDK 17 + Spring Boot + Maven | Pass | Maven build and tests completed |
| Standalone MySQL and Flyway | Pass | Real MySQL 8.4.11; Flyway verified up to V7 |
| Redis menu cache | Pass | Redis menu cache keys visible, TTL about 60 seconds |
| BCrypt and JWT Cookie authentication | Pass | BCrypt encoder, HTTP-only Cookie, JWT minimum secret length validation |
| JWT environment contract | Pass | `.env.example`, `ENVIRONMENT.md`, and README declare the required `WEBBOX_JWT_SECRET` |
| Employee/admin permission isolation | Pass | Employee access to admin daily menu endpoint returns 403 |
| Menu visibility, filtering, pagination, details | Pass | Real API returns listed daily menu, category filtering, customization options, allergens, inventory, and integer-cent prices |
| PRD dish categories | Pass | Supports Chinese, Western, Japanese, Light Meal, Korean, Southeast Asian |
| PRD allergen enums | Pass | Supports Peanuts, Dairy, Egg, Gluten, Soy, Fish, Shellfish |
| Taste preference | Pass | Backend validates `Light\|Moderate\|Rich`; V7 migrates legacy values to `Moderate` |
| Server-side price/option/total validation | Pass (code review) | Backend re-queries dishes and options and calculates in integer cents |
| Cutoff auto-switching | Pass (unit tests/code review) | `CutoffPolicy.resolve` covers the 10:00 and 15:00 boundaries |
| Active order unique constraint | Pass (code/migration review) | `uq_active_order(user_id, active_meal_key)` |
| Idempotency records | Pass (code/unit tests) | V4 supports placeholder records; repeated Keys query the existing order |
| Conditional inventory deduction and whole-order transaction | Pass (code/unit tests) | Conditional `UPDATE`, `@Transactional`, non-negative inventory constraint |
| Concurrent oversell prevention and repeated-cancellation inventory restore | Pass (real MySQL integration tests) | 5/5 Failsafe tests passed on the isolated `webbox_backend_it` database |

## 4. Key API Verification Results

| Scenario | Result |
| --- | --- |
| Demo employee login | Success, returns `EMPLOYEE` |
| Demo admin login | Success, returns `ADMIN` |
| 51-character menu search | Returns `400 VALIDATION_ERROR` |
| Employee accessing admin endpoint | Returns `403 FORBIDDEN` |
| `Light Meal` menu filtering | Returns migrated dish data |
| Admin reading daily menu and inventory | Success |
| Employee reading preferences | Returns `tastePreference: "Moderate"` |

## 5. Test Coverage Gaps and Risks

The workspace contains newly added but not yet committed MySQL integration tests:

- `backend/src/test/java/com/webbox/order/OrderServiceMySqlIT.java`
- `backend/src/test/java/com/webbox/order/MySqlIntegrationTestDatabase.java`
- The `mysql-it` Failsafe profile in `backend/pom.xml`

The test implementation covers:

- Concurrent requests with the same `Idempotency-Key` return the same order;
- Concurrent requests for the same employee and meal period keep only one active order;
- Concurrent ordering by different employees does not oversell;
- When any dish is out of stock, the entire order is rolled back;
- Concurrent repeated cancellations restore inventory only once.

The tests require an isolated database `webbox_backend_it` and enforce that it must not have the same name as the business database. It has been confirmed that this database can be connected to by `webox_app` and the tests passed against it; the business database `webox` was not involved in any test writes.

## 6. Mandatory Items Before Release

1. Commit the MySQL integration test files and the `mysql-it` Maven profile.
2. Keep `webbox_backend_it` as the isolated test database and maintain minimum necessary privileges for the application test account.
3. In CI or release acceptance, set the environment variable `WEBBOX_TEST_DB_NAME=webbox_backend_it` and execute:

   ```sh
   mvn verify -Pmysql-it
   ```

4. Use the passing result of this command as the final acceptance evidence for inventory concurrency, transaction rollback, idempotency, and cancellation inventory restore; the local acceptance result for this round is **5/5 passed**.

## 7. Out of Scope for This Phase

The following items are not counted as defects: real-time inventory push, LLM smart recommendations, Console operations dashboard.
