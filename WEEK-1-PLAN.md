# Week 1 — Foundation

Goal: a working monolith you can demo end-to-end and push to GitHub. By the end of this week, anyone can `git clone`, run `docker compose up`, and exercise the API. If a recruiter asks "show me code," this is what you point at.

The work is broken into seven issues sized to roughly 2–4 hours each. Numbering matches the suggested order.

---

## #1 — Project skeleton and `pom.xml`

Initialize the Maven project with Spring Boot 3.4 and the right dependencies up front, so you do not fight the build later.

**Tasks**
- Generate the project structure via [start.spring.io](https://start.spring.io) with: Maven, Java 21, Spring Boot 3.4.x, packaging JAR. Group `com.trafficguard`, artifact `api-traffic-guard`.
- Required dependencies: `spring-boot-starter-web`, `spring-boot-starter-data-jpa`, `spring-boot-starter-data-redis`, `spring-boot-starter-validation`, `spring-boot-starter-actuator`, `postgresql` (runtime), `flyway-core`, `lombok`, `spring-boot-starter-test`.
- Extract the generated zip into the existing repo, keeping the existing README, ARCHITECTURE.md, LICENSE, and architecture diagrams.
- Use the included Maven Wrapper (`./mvnw`) — no need to install Maven globally.

**Done when:** `./mvnw clean install -DskipTests` produces a JAR with no errors. `git status` is clean except for tracked source files.

---

## #2 — Docker Compose for local development

Get Postgres and Redis running locally before writing application code. Trying to run them on bare metal will cost you an evening.

**Tasks**
- Create `docker/docker-compose.yml` with three services: `postgres` (image `postgres:15-alpine`, port 5432, env vars for DB / user / password), `redis` (image `redis:7-alpine`, port 6379), and a placeholder `app` service that builds from `docker/Dockerfile` (you will fill the Dockerfile in #7).
- Add named volumes for Postgres data so it survives `docker compose down`.
- Add `application.yml` in `src/main/resources` pointing to `localhost:5432` and `localhost:6379` for local dev, and `application-docker.yml` overriding to `postgres:5432` and `redis:6379` for inside the container network.

**Done when:** `docker compose -f docker/docker-compose.yml up postgres redis -d` starts both, and you can `psql -h localhost -U trafficguard -d trafficguard` and `redis-cli ping`.

---

## #3 — Domain model and Flyway migrations

Define the data layer before the API. Schema changes are cheap now, expensive after the app is running against real data.

**Tasks**
- Create the JPA entity `User` (id, username, email, passwordHash, status enum, createdAt, updatedAt). Use a Java 21 `record` for read-only DTOs where appropriate.
- Create the JPA entity `SecurityEvent` (id, userId, eventType, ipAddress, endpoint, statusCode, createdAt).
- Create `UserRepository extends JpaRepository<User, Long>` and `SecurityEventRepository extends JpaRepository<SecurityEvent, Long>`.
- Write Flyway migration `V1__init.sql` in `src/main/resources/db/migration/` with `CREATE TABLE` for both, indexes on `users.username` (unique), `security_events.user_id`, `security_events.created_at`.
- Set `spring.flyway.enabled=true` and `spring.jpa.hibernate.ddl-auto=validate` (Flyway owns the schema; Hibernate validates).

**Done when:** App starts, Flyway logs show `Successfully applied 1 migration`, and `\dt` in `psql` shows both tables.

---

## #4 — User registration and login endpoints

The minimum viable API surface — enough to demo and to be the target of rate limiting and brute-force detection in the next issue.

**Tasks**
- DTOs as records: `RegisterRequest` and `LoginRequest` with `@NotBlank` validation.
- `UserService` with `register(RegisterRequest)` (bcrypt the password with `BCryptPasswordEncoder`, cost 12) and `authenticate(LoginRequest)` (returns boolean for now — JWT comes in week 2).
- `AuthController` with `POST /api/register` and `POST /api/login`. Return 400 on validation errors, 409 if username taken, 401 on wrong password, 200 on success.
- After every login attempt (success or failure), insert a `SecurityEvent` row with the outcome.

**Done when:** `curl` can register a user, login successfully, and a wrong password returns 401. The `security_events` table fills up as you exercise the endpoints.

---

## #5 — Rate limiting filter (Redis-backed)

The first real piece of the gateway. Implemented as a servlet filter so it runs before any controller.

**Tasks**
- Add `RateLimitFilter implements Filter`. On every request, extract the source IP (mind `X-Forwarded-For` if testing behind nginx).
- Use `RedisTemplate` to call `INCR rate:{ip}:{currentMinute}` and `EXPIRE` the key for 60 seconds.
- If the returned count exceeds the configured limit (default 100, read from `application.yml`), respond with HTTP 429, header `Retry-After: 60`, body `{"error": "rate_limit_exceeded"}`.
- Register the filter via `FilterRegistrationBean` so its order is explicit (run early — order 1).

**Done when:** A `for` loop sending 110 requests gets the first 100 with 200, the rest with 429. `redis-cli KEYS "rate:*"` shows the active key, and after 60 seconds it expires.

---

## #6 — Brute-force detection and TTL blocking

The second piece of the gateway, and the one that makes the project actually interesting.

**Tasks**
- In `UserService.authenticate`, on failure call `redisTemplate.opsForValue().increment("login_fail:" + username)` and `expire("login_fail:" + username, Duration.ofMinutes(15))`.
- If the counter reaches 10, set `block:user:{username}` with TTL 15 minutes and write a `SecurityEvent` with type `USER_BLOCKED`.
- On success, `DEL login_fail:{username}` to reset the counter.
- Add a check at the top of `RateLimitFilter` (or a separate `BlockFilter`): if `block:user:{username}` or `block:{ip}` exists, return 403 with `{"error": "blocked", "retryAfterSeconds": <ttl>}`.

**Done when:** 11 wrong logins for the same user blocks them, the 12th attempt — even with the right password — returns 403, and after 15 minutes (or after manually `DEL`ing the key in Redis) login works again.

---

## #7 — Dockerfile, end-to-end run, README polish

Make the project runnable by anyone with one command. This is what a recruiter will actually test.

**Tasks**
- Write `docker/Dockerfile` using a multi-stage build: `eclipse-temurin:21-jdk-alpine` to build with Maven, `eclipse-temurin:21-jre-alpine` for the runtime image. Final image should be under 250 MB.
- Update `docker-compose.yml` so `app` builds from this Dockerfile and depends on `postgres` and `redis` with healthchecks.
- Take screenshots / record an asciinema of the demo flow (register → login → trigger block → see 403). Embed them in README.
- Tag the commit: `git tag week-1 -m "Week 1: working monolith"` and `git push origin week-1`.

**Done when:** A clean machine with Docker installed can run `git clone && cd api-traffic-guard && docker compose up` and exercise the full flow with `curl`. The README screenshots match the actual behavior.

---

## What you can say in an interview after Week 1

> "I built an API gateway that does rate limiting and brute-force detection. The hot path uses Redis with a sliding-window counter for sub-millisecond rate-limit checks; the audit trail goes to PostgreSQL. Blocks have a TTL so they expire automatically. I deliberately kept it as a single Spring Boot service because at this scale microservices would add complexity without solving a real problem — the plan is to extract services only when there's measurable pressure to do so."

That paragraph covers: caching strategy, time-window algorithms, separation of concerns, security event logging, and architectural judgment. That is a strong twenty seconds in any backend interview.
