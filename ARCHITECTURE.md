# Architecture

This document explains the technical decisions behind API Traffic Guard — what was chosen, what was rejected, and why. It is updated each time the architecture changes.

## Design principles

Three principles guide every decision in this project:

1. **Make the simple thing work first.** A working monolith beats a half-working distributed system every time. Complexity is added only when there is concrete evidence it is needed.
2. **Hot path stays fast.** Every request goes through a security check. That check must complete in single-digit milliseconds, or the gateway becomes the bottleneck it was meant to prevent.
3. **Persistence is for audit, not for decisions.** Real-time decisions read from Redis; PostgreSQL is the historical record. Mixing the two creates latency and tight coupling.

## Current architecture (Week 1)

The system is a **single Spring Boot application** with two backing stores:

- **Redis** holds rate-limit counters and active blocks. Every key has a TTL, so cleanup is automatic.
- **PostgreSQL** holds users, security events, and the audit log. Writes are asynchronous where possible.

A servlet filter runs before any controller. It performs three checks in order:

1. Is the source IP currently blocked? → 403
2. Is the user (if authenticated) currently blocked? → 403
3. Has the rate limit for this IP / endpoint been exceeded? → 429

If all three pass, the request reaches the controller. After the response, a separate component records the outcome (success / failure) for the detection service. Detection runs asynchronously — it never blocks the response.

### Why a monolith, not microservices?

This was a deliberate choice, not a default. A few reasons:

- **The traffic profile does not justify it.** A single Spring Boot instance comfortably handles thousands of requests per second. The data tier is the bottleneck, not the application tier.
- **Network calls are not free.** Splitting RateLimit / Detection / User into separate services replaces in-process method calls (microseconds) with HTTP calls (milliseconds). Each hop also adds a failure mode.
- **Debuggability matters.** A single application is one log stream, one stack trace, one process to attach a debugger to. With three services, every bug is a distributed-systems bug.
- **Microservices solve organisational problems first, technical problems second.** They let independent teams ship independently. There is no team here.

The system is **structured** as if it were several services — separate packages with clear boundaries — so that splitting later is mechanical, not architectural. This is sometimes called a "modular monolith."

### Why Redis for rate limiting?

Three options were considered:

- **In-memory counters (Caffeine, ConcurrentHashMap).** Fastest. Rejected because counters are lost on restart and cannot be shared across instances. The moment you scale to two replicas, the limit is effectively doubled.
- **PostgreSQL counters with `UPDATE ... RETURNING`.** Persistent and shared. Rejected because every check is a transactional write. Easily 5–10ms per check, before contention.
- **Redis with `INCR` + `EXPIRE`.** Sub-millisecond, atomic, and TTL gives free cleanup. Chosen.

### Sliding window vs. fixed window vs. token bucket

The default algorithm is a **sliding-window log** approximation: each request adds a timestamp to a sorted set keyed by `rate:{ip}:{minute}`, with a 60-second TTL. The check is `ZCARD` to count entries in the active window.

Compared to alternatives:

- **Fixed window** (`rate:{ip}:{2026-04-28T10:30}` with `INCR`) is simpler and faster, but allows up to 2× the configured rate at the boundary between windows. Acceptable for many uses, but easy to abuse on purpose.
- **Token bucket** is friendlier to legitimate burst traffic — a user who is normally quiet can briefly exceed the average rate. This is implemented as an alternative for endpoints where bursts are expected (search, list endpoints). Not the default, since for login-like endpoints bursts are exactly what we want to stop.

## Data model

### PostgreSQL (durable)

Five tables:

- `users` — account state, hashed passwords (bcrypt, cost 12), status enum.
- `security_events` — every detection event, partitioned by month for cheap retention.
- `blocks` — durable record of blocks for audit. The active block is in Redis; this is the history.
- `rate_limit_rules` — configurable rules loaded at startup and refreshed on admin update.
- `audit_log` — every administrative action (who, what, when, target, source IP).

All foreign keys are enforced. Lookup columns (`user_id`, `ip_address`, `created_at`) are indexed.

### Redis (ephemeral)

The keyspace is partitioned by prefix:

| Pattern | Type | TTL | Purpose |
|---|---|---|---|
| `rate:{ip}:{window}` | sorted set | 60s | Sliding-window timestamps for IP-level rate limiting |
| `rate:user:{userId}` | counter | 60s | Per-user rate counter |
| `block:{ip}` | string | configurable (default 15m) | Active IP-level block |
| `block:user:{userId}` | string | configurable (default 15m) | Active user-level block |
| `login_fail:{userId}` | counter | 15m | Failed-login counter for brute-force detection |
| `stats:realtime` | hash | none | Aggregated counters served to the admin stats endpoint |

## Failure modes

A security gateway that fails open is a liability; one that fails closed is a denial-of-service vector. The middle ground is **degrade explicitly**:

- **Redis unavailable** → fail open, log a warning at ERROR level, increment a `redis_unavailable` Prometheus counter, alert. Rationale: blocking all traffic is worse than briefly accepting more than we should.
- **PostgreSQL unavailable** → reads from cache; writes are buffered (in Phase 4 this becomes Kafka, see below); admin API returns 503.
- **Filter throws an unexpected exception** → fail open with full stack trace logged. The hot path must never crash the application.

These choices are documented and intentional, not implicit.

## Roadmap and the rationale for each step

Each weekly milestone exists because there is a concrete reason to add it, not because the technology is on a CV checklist.

### Week 2 — Spring Security + JWT, integration tests

Why: Right now, anyone can call the admin endpoints. Production-grade security needs proper authentication. JWT specifically because the system has no session state — a stateless token fits a horizontally-scaled service better than server-side sessions. Testcontainers because mocked DBs lie; a real PostgreSQL container in the test catches schema and SQL bugs that mocks miss.

### Week 3 — Prometheus + Grafana + structured logging

Why: A security system whose state cannot be observed is unverifiable. Knowing that "the rate limiter is firing" requires metrics; knowing why a specific user was blocked requires correlated logs. This week makes the system **debuggable in production**.

### Week 4 — Kafka

Why this is the first real complexity: writing every security event to PostgreSQL synchronously couples request latency to database write latency. Under load, slow audit writes slow the whole gateway. Sending events to a Kafka topic instead means the hot path is unaffected, and a separate consumer drains the topic into PostgreSQL at its own pace.

This is the **first technology added because of measured pressure** rather than for the sake of learning it. The CV-listing benefit is a side effect.

### Week 5 — Extract Detection into a microservice

Why now and not earlier: Detection has a different scaling profile. It does CPU-intensive analysis on streams of events, while the gateway is I/O-bound. Co-locating them means scaling one forces scaling the other. Splitting them allows independent scaling. This is the **first time microservices solve a real problem** here.

After this split, the system genuinely is a microservices architecture: a Gateway service and a Detection service, communicating via Kafka. That is a meaningful architectural step, not a fashion statement.

### Week 6+ — Frontend, CI/CD, Kubernetes

These are operational concerns, not architectural ones. They turn the project from "code that runs locally" into "code that ships." Each is added when its absence becomes the limiting factor.

## What this project is not trying to be

A few things are deliberately out of scope, to keep the scope honest:

- **It is not a Web Application Firewall.** WAFs do deep packet inspection, signature matching, and rule sets like the OWASP Core Rule Set. That is a different problem.
- **It is not an Identity Provider.** It validates JWTs but does not issue them. A real deployment would put it behind an existing identity provider (Auth0, Keycloak, Cognito).
- **It is not anomaly-detection-by-ML.** The detection logic is rule-based and threshold-based. ML-based detection is interesting and could be added, but it is a separate system with its own data and feedback loop.

Keeping the scope narrow is what makes the project finishable. A finished project that solves one thing well is a better portfolio piece than an unfinished project that tries to solve five.
