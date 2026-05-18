# API Traffic Guard — Project Context

> **הוראות שימוש:** הדבק את תוכן הקובץ הזה בתחילת כל שיחה חדשה.
> עדכן את הקובץ בסוף כל session (Week).

---

## Meta

- **Repo:** https://github.com/EliorYomTov/api-traffic-guard (public, MIT)
- **Convention:** קוד + comments באנגלית, שיחה בעברית, סגנון מנטורינג
- **Current week:** Week 8 (Metrics endpoints)

---

## Stack

| Layer      | Technology                                                                 |
|------------|----------------------------------------------------------------------------|
| Backend    | Java 21, Spring Boot 3.5.14, PostgreSQL 15, Redis 7                       |
| Frontend   | React 19, Vite 8, TypeScript, Tailwind v4, Geist font                     |
| Charts     | Chart.js, Recharts, Lucide React                                           |
| Data       | React Query (@tanstack/react-query)                                        |
| Auth       | JWT (HMAC-SHA384) + Argon2id, API Keys (atg_live_sk_xxx, SHA-256)         |
| CI/CD      | GitHub Actions — backend (Postgres+Redis services) + frontend (tsc+build) |

---

## Package Structure

```
com.trafficguard                        ← root (NOT com.atg — important!)
├── config/                             ← SecurityConfig, TimeConfig (Clock bean)
├── controller/                         ← REST controllers
├── domain/                             ← JPA entities: SecurityEvent, Tenant, User
│   └── SecurityEvent.EventType         ← nested enum (LOGIN_SUCCESS, LOGIN_FAILURE,
│                                           USER_BLOCKED, USER_UNBLOCKED,
│                                           IP_BLOCKED, RATE_LIMIT_EXCEEDED)
├── dto/
│   ├── request/
│   └── response/
├── exception/
├── metrics/                            ← NEW (Week 8)
│   ├── dto/
│   │   ├── OverviewResponse.java       ← record
│   │   └── TimeseriesResponse.java     ← record (range, List<DataPoint>)
│   ├── MetricsController.java
│   ├── MetricsService.java
│   └── TimeRange.java                  ← enum: HOURS_24, DAYS_7, DAYS_30
│                                           (fields: code, steps, unit: ChronoUnit)
├── repository/                         ← SecurityEventRepository, etc.
├── security/                           ← ApiKeyAuthFilter, JwtAuthenticationFilter,
│   │                                       JwtService, RateLimitFilter
│   └── TenantPrincipal.java            ← class עם Lombok @Getter
│                                           (לא record! accessor: getTenantId(), getRateLimitPerMinute())
└── service/
```

---

## Frontend Structure

```
frontend/src/
├── api/
│   ├── client.ts          ← axios, baseURL: '' (Vite proxy מעביר /api → :8080)
│   │                          default export (import client from './client')
│   ├── types.ts           ← AuthResponse, ApiKey, SecurityEventResponse,
│   │                          PagedEventsResponse, TenantInfo, EventsQueryParams,
│   │                          OverviewResponse, TimeRangeCode,
│   │                          TimeseriesResponse, TimeseriesDataPoint
│   ├── events.ts          ← fetchEvents(params)
│   └── metrics.ts         ← fetchOverview(range), fetchTimeseries(range)
├── hooks/
│   ├── useSecurityEvents.ts
│   ├── useMetricsOverview.ts
│   ├── useMetricsTimeseries.ts                        ← NEW (Week 8)
│   └── useWindowSize.ts   ← useBreakpoint() → isLarge/isMedium/isSmall
├── mocks/dashboardData.ts ← mock data (KPI sparklines still mock — Week 8 ongoing)
├── pages/
│   ├── LoginPage.tsx      ← URLs: /api/v1/auth/login + /api/v1/auth/register
│   └── DashboardPage.tsx  ← real events + real KPI counts + real timeseries
└── components/
    ├── layout/Sidebar.tsx
    ├── ui/KpiCard.tsx      ← Props: label, value, delta: number, trend: number[],
    │                           color, subtitle, icon (NO loading/suffix props!)
    └── charts/
        ├── AreaChartCard.tsx  ← מחובר ל-real timeseries data
        │                          Props: data: {month, allowed, blocked}[]
        │                          total/delta/subtitle עדיין hardcoded בתוך הcomponent
        ├── DonutChart.tsx
        ├── DualBarChart.tsx
        ├── GaugeChart.tsx
        └── StackedAreaChart.tsx
```

---

## Key Architectural Decisions

### Multi-tenancy
- כל user מקבל tenant משלו בregistration
- `TenantPrincipal(tenantId, rateLimitPerMinute)` — principal יחיד ל-JWT + API key auth
- **SecurityEvent entity:** `@ManyToOne Tenant tenant` (לא `Long tenantId`)
  - ב-JPQL: `WHERE e.tenant.id = :tenantId` (לא `e.tenantId`)
  - Hibernate לא עושה JOIN כשניגשים רק ל-.id — משתמש ב-FK column ישירות

### Auth Flow
- `JwtAuthenticationFilter` — בונה `TenantPrincipal` מ-JWT claims, אפס DB calls
- `ApiKeyAuthFilter` — SHA-256 hash comparison
- `RateLimitFilter` — Redis sliding window, per-tenant

### Time Range Strategy
- Fixed ranges: `?range=24h|7d|30d` (לא flexible from/to)
- `TimeRange.fromCode(null)` → default DAYS_7 (permissive, לא 400)
- `Clock` injection בכל service שמשתמש ב-`Instant.now()` (testability)
- Granularity: HOURS_24 → שעות (24 נקודות), DAYS_7/DAYS_30 → ימים

### Caching
- אין cache בשלב זה — premature optimization
- Indexes על DB במקום (ראה V5 migration)

---

## Database

### Tenant בשימוש לפיתוח
- `user_id=104`, `tenant_id=2`, username: elior (סיסמה לא ידועה)
- `user_id=106`, `tenant_id=4`, username: elior2, password: Test1234! ← לשימוש בפיתוח
- 46+ security events בDB (tenant_id=2)
- 3 api_keys (2 active, 1 revoked)

### Flyway Migrations
| Version | Content |
|---------|---------|
| V1 | init marker |
| V2 | users + security_events |
| V3 | role column |
| V4 | multi-tenancy — tenants, api_keys, tenant_id על users ו-security_events |
| V5 | indexes for metrics queries (NEW — Week 8) |

### V5 Indexes
```sql
idx_security_events_tenant_created       -- (tenant_id, created_at DESC)
idx_security_events_tenant_type_created  -- (tenant_id, event_type, created_at DESC)
idx_security_events_tenant_endpoint      -- partial, WHERE endpoint IS NOT NULL
idx_security_events_tenant_ip            -- partial, WHERE ip_address IS NOT NULL
```

### Severity → EventType Mapping
```
CRITICAL → [USER_BLOCKED, IP_BLOCKED]
WARNING  → [RATE_LIMIT_EXCEEDED, LOGIN_FAILURE]
SUCCESS  → [LOGIN_SUCCESS]
INFO     → [USER_UNBLOCKED]
```

---

## API Endpoints

### Implemented & Working
```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
GET    /api/v1/tenant/me
GET    /api/v1/api-keys
GET    /api/v1/events?page=0&size=15&severity=CRITICAL&eventType=IP_BLOCKED
GET    /api/v1/metrics/overview?range=7d
GET    /api/v1/metrics/timeseries?range=7d          ← NEW (Week 8)
```

### Week 8 — Remaining
```
GET    /api/v1/metrics/status-codes?range=7d        ← NEXT
GET    /api/v1/metrics/top-endpoints?range=7d
GET    /api/v1/metrics/threat-composition?range=7d
GET    /api/v1/metrics/top-blocked-ips?range=7d
GET    /api/v1/metrics/rate-limit-usage
```

---

## Repository Queries (SecurityEventRepository)

```java
// Existing (Events API)
findByTenantIdOrderByCreatedAtDesc(...)
findByTenantIdAndEventTypeOrderByCreatedAtDesc(...)
findByTenantIdAndEventTypeInOrderByCreatedAtDesc(...)

// New (Metrics — Week 8)
countByTenantInRange(Long tenantId, Instant since, Instant until)
countByTenantAndTypesInRange(Long tenantId, Collection<EventType> types,
                              Instant since, Instant until)
```

---

## Known Gotchas

### Java
1. **Import collisions:**
   - `@Param` → תמיד `org.springframework.data.repository.query.Param` (לא `io.lettuce.core.dynamic.annotation.Param`)
   - `Collection` → תמיד `java.util.Collection` (לא `org.hibernate.mapping.Collection`)
   - **מניעה:** Settings → Editor → General → Auto Import → Exclude → הוסף את שני ה-Lettuce/Hibernate variants

2. **Clock bean:** חייב `@Bean public Clock clock() { return Clock.systemUTC(); }` ב-`TimeConfig.java`
   בלי זה: `Could not autowire. No beans of 'Clock' type found.`

3. **EventType נמצא nested:** `com.trafficguard.domain.SecurityEvent.EventType` (לא class עצמאי)

4. **TenantPrincipal — לא record!** זה class עם Lombok `@Getter`.
   accessor הוא `getTenantId()` ולא `tenantId()` — שגיאה נפוצה בcontrollers.

5. **AuthController URL:** `@RequestMapping("/api/v1/auth")` — חייב `/v1/`.
   SecurityConfig: `.requestMatchers("/api/v1/auth/**").permitAll()`

### Maven / IntelliJ
6. **junit-vintage-engine:** spring-boot-starter-test מביא אותו transitively.
   הוצא אותו — אין צורך ב-JUnit 4 support:
   ```xml
   <dependency>
       <groupId>org.springframework.boot</groupId>
       <artifactId>spring-boot-starter-test</artifactId>
       <scope>test</scope>
       <exclusions>
           <exclusion>
               <groupId>org.junit.vintage</groupId>
               <artifactId>junit-vintage-engine</artifactId>
           </exclusion>
       </exclusions>
   </dependency>
   ```

7. **IntelliJ test runner:** מגדיר ב-`File → Settings → Build, Execution, Deployment → Maven → Runner`
   ✅ "Delegate IDE build/run actions to Maven" — פותר classpath mismatches לתמיד

### TypeScript / React
8. **client.ts — baseURL ריק + Vite proxy:** `baseURL: ''` עובד כי vite.config.ts מגדיר proxy מ-`/api` → `localhost:8080`. אל תוסיף `baseURL: 'http://localhost:8080'`.

9. **client.ts — default export:** `import client from './client'` (לא `import { client }`)

10. **KpiCard props:** מקבל `trend: number[]` (sparkline array), לא `'up'|'down'|'flat'` string
    — sparklines עדיין mock (`kpiData.xxx.trend`) עד שיהיה `/timeseries` מחובר לsparklines

11. **percentDelta returns null (not 0) when previous=0:** מכוון — UI מציג "—" במקום "∞%"

12. **AreaChartCard — total/delta hardcoded:** הגרף מחובר ל-real data אבל `60,847` ו-`▲12.6%` עדיין hardcoded בתוך הcomponent — צריך לתקן בהמשך.

13. **buildLabel locale:** חייב `Locale.ENGLISH` ב-DateTimeFormatter, אחרת labels יוצאים בעברית.

---

## Tests

```
backend/src/test/java/com/trafficguard/metrics/MetricsServiceTest.java
  ✅ percentDelta_returnsNull_whenPreviousIsZero
  ✅ percentDelta_positiveChange
  ✅ percentDelta_negativeChange
  ✅ percentDelta_roundsToOneDecimal

backend/src/test/java/com/trafficguard/controller/AuthControllerIntegrationTest.java
  ✅ register_shouldReturn201_withValidRequest
  ✅ login_shouldReturn200_withValidCredentials
  ✅ login_shouldReturn401_withWrongPassword
  ✅ register_shouldReturn409_whenUsernameExists
```

הרצה: `./mvnw test -Dtest=MetricsServiceTest` (מה-root directory)

---

## Week Status

| Week | Focus | Status |
|------|-------|--------|
| 1-4  | Auth, Security, Multi-tenancy, Flyway | ✅ Done |
| 5-6  | Events API, React Query, Responsive UI | ✅ Done |
| 7    | CI/CD, GitHub Actions | ✅ Done |
| 8    | Metrics endpoints | 🔄 In Progress |

### Week 8 Progress
- [x] V5 migration (indexes)
- [x] TimeRange enum (+ steps, unit fields)
- [x] OverviewResponse DTO
- [x] TimeseriesResponse DTO
- [x] Repository queries
- [x] MetricsService + Clock bean
- [x] MetricsController (/overview + /timeseries)
- [x] Frontend: types + fetchOverview + fetchTimeseries
- [x] Frontend: useMetricsOverview + useMetricsTimeseries
- [x] DashboardPage: KPI cards מציגים real data
- [x] DashboardPage: AreaChartCard מחובר ל-real timeseries
- [x] Unit tests (MetricsServiceTest — 4 passing)
- [x] AuthControllerIntegrationTest — 4 passing
- [ ] `/status-codes` endpoint + DonutChart חיבור         ← NEXT
- [ ] `/top-endpoints` endpoint
- [ ] `/threat-composition` endpoint
- [ ] `/top-blocked-ips` endpoint
- [ ] `/rate-limit-usage` endpoint
- [ ] AreaChartCard: total/delta/subtitle מ-props (לא hardcoded)
- [ ] AreaChartCard: tabs Year/Month/Week/Day פונקציונליים

---

## Security Config (CORS)
מוגדר ל-`localhost:5173` ו-`localhost:4173` בלבד.
