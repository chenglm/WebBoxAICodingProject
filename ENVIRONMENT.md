# Local Development Environment

This project uses separate, local services. All application secrets belong in `.env`, which is ignored by Git. Start from `.env.example` when preparing another machine.

## Prerequisites

| Dependency | Required version | Status on this machine |
| --- | --- | --- |
| Java | JDK 17 | Installed via Homebrew |
| Maven | 3.8+ | Available |
| Node.js / npm | Node 22.23.2 / npm 10.9.8 | Available through NVM in an interactive terminal |
| MySQL | 8.4 | Running on `127.0.0.1:3306` |
| Redis | 6.2+ | Project instance runs on `127.0.0.1:6380` |

## Why Redis Uses Port 6380

Port `6379` is already used by an unrelated local project and has its own data directory. WebBox must not share or overwrite that instance. The supplied start script creates an isolated Redis process whose append-only data and logs remain under `.runtime/redis/`.

## Start a Development Session

```sh
# Use JDK 17 only in the current terminal session.
. scripts/use-project-java.sh

# Load non-secret connection settings and start the project Redis instance.
set -a
. ./.env
set +a
scripts/start-redis.sh

# Optional health checks.
java -version
mysql -u "$WEBBOX_DB_USERNAME" -p -h "$WEBBOX_DB_HOST" -P "$WEBBOX_DB_PORT" "$WEBBOX_DB_NAME"
redis-cli -h "$WEBBOX_REDIS_HOST" -p "$WEBBOX_REDIS_PORT" ping
```

The frontend should run from an interactive terminal so NVM selects the ARM-native Node version declared in `.nvmrc`. If a terminal still resolves `node` from `/usr/local/bin`, run `nvm use` from the project root before running npm commands.

## Application Configuration Contract

The forthcoming Spring Boot service will map the following environment variables to its datasource and Redis connection configuration:

- `WEBBOX_DB_HOST`, `WEBBOX_DB_PORT`, `WEBBOX_DB_NAME`, `WEBBOX_DB_USERNAME`, `WEBBOX_DB_PASSWORD`
- `WEBBOX_REDIS_HOST`, `WEBBOX_REDIS_PORT`

Redis is used for short-lived menu cache entries and distributed duplicate-submission suppression. MySQL remains the source of truth for orders and the final idempotency/unique-order guarantees.
