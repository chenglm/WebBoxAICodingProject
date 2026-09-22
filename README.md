# WebBoxEnterpriseEmployeeMealOrderingPlatform

Enterprise employee meal ordering platform: React SPA + Spring Boot 3 (Java 17) + MySQL 8.4 + Redis.

## Local startup

1. Copy the environment template and supply local service credentials:

   ```sh
   cp .env.example .env
   openssl rand -base64 48
   ```

   Put the generated value in `.env` as `WEBBOX_JWT_SECRET`. It is mandatory, must be at least 32 bytes, and must never be committed.

2. Start the project Redis instance and use Java 17:

   ```sh
   . scripts/use-project-java.sh
   set -a
   . ./.env
   set +a
   scripts/start-redis.sh
   ```

3. Start the API service. Flyway applies the MySQL schema and English demonstration seed data automatically:

   ```sh
   cd backend
   mvn spring-boot:run
   ```

   The API is available at `http://localhost:8080/api`. If port 8080 is already in use, set `SERVER_PORT` for that terminal session.

4. Start the frontend in a separate terminal. It calls `/api` and expects the backend CORS origin `http://localhost:5173`.

See [ENVIRONMENT.md](ENVIRONMENT.md) for the complete local-service contract and [docs/BACKEND_API.md](docs/BACKEND_API.md) for endpoint details.
