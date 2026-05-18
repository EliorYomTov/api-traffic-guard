package com.trafficguard.metrics;

import com.trafficguard.domain.SecurityEvent.EventType;
import com.trafficguard.metrics.dto.*;
import com.trafficguard.repository.SecurityEventRepository;
import com.trafficguard.service.RateLimitService;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@Transactional(readOnly = true)
public class MetricsService {

    private static final List<EventType> BLOCKED_TYPES = List.of(EventType.IP_BLOCKED, EventType.USER_BLOCKED);
    private static final List<EventType> RATE_LIMIT_TYPES = List.of(EventType.RATE_LIMIT_EXCEEDED);
    private final SecurityEventRepository repository;
    private final RateLimitService rateLimitService;
    private final StringRedisTemplate stringRedisTemplate;
    private final Clock clock;

    public MetricsService(SecurityEventRepository repository, Clock clock, RateLimitService rateLimitService, StringRedisTemplate stringRedisTemplate) {
        this.repository = repository;
        this.clock = clock;
        this.rateLimitService = rateLimitService;
        this.stringRedisTemplate = stringRedisTemplate;
    }

    public OverviewResponse getOverview(Long tenantId, TimeRange range) {
        Instant now = clock.instant();
        Instant currentStart = range.since(now);
        Instant previousStart = range.since(currentStart);

        // Current range [currentStart, now)
        long totalCurrent = repository.countByTenantInRange(tenantId, currentStart, now);
        long blockedCurrent = repository.countByTenantAndTypesInRange(tenantId, BLOCKED_TYPES, currentStart, now);
        long rateLimitCurrent = repository.countByTenantAndTypesInRange(tenantId, RATE_LIMIT_TYPES, currentStart, now);

        // Previous equivalent range [previousStart, currentStart)
        long totalPrevious = repository.countByTenantInRange(tenantId, previousStart, currentStart);
        long blockedPrevious = repository.countByTenantAndTypesInRange(tenantId, BLOCKED_TYPES, previousStart, currentStart);
        long rateLimitPrevious = repository.countByTenantAndTypesInRange(tenantId, RATE_LIMIT_TYPES, previousStart, currentStart);
        return new OverviewResponse(
                totalCurrent, percentDelta(totalCurrent, totalPrevious),
                blockedCurrent, percentDelta(blockedCurrent, blockedPrevious),
                rateLimitCurrent, percentDelta(rateLimitCurrent, rateLimitPrevious),
                null,                          // avgResponseTimeMs — not tracked yet
                range.getCode());
    }

    /**
     * Percent change from previous to current.
     * Returns null when there's no previous baseline (avoids division by zero
     * and avoids the misleading "+100%" / "+∞" display in the UI).
     */
    static Double percentDelta(long current, long previous) {
        if (previous == 0) {
            return null;
        }
        double delta = ((double) (current - previous) / previous) * 100.0;
        return Math.round(delta * 10.0) / 10.0;  // one decimal place
    }

    public TimeseriesResponse getTimeseries(Long tenantId, TimeRange range) {
        Instant now = clock.instant();
        Instant windowStart = range.since(now);
        int steps = range.getSteps();
        ChronoUnit unit = range.getUnit();
        List<TimeseriesResponse.DataPoint> points = new ArrayList<>(steps);
        for (int i = steps; i >= 1; i--) {
            Instant bucketEnd = windowStart.plus(i, unit);
            Instant bucketStart = windowStart.plus(i - 1, unit);
            long blocked = repository.countByTenantAndTypesInRange(tenantId, BLOCKED_TYPES, bucketStart, bucketEnd);
            long total = repository.countByTenantInRange(tenantId, bucketStart, bucketEnd);
            long allowed = total - blocked;
            String label = buildLabel(bucketStart, unit);
            points.add(new TimeseriesResponse.DataPoint(label, allowed, blocked));
        }
        return new TimeseriesResponse(range.getCode(), points);
    }

    private String buildLabel(Instant instant, ChronoUnit unit) {
        ZonedDateTime zdt = instant.atZone(ZoneOffset.UTC);
        return switch (unit) {
            case HOURS -> DateTimeFormatter.ofPattern("HH:mm", Locale.ENGLISH).format(zdt);
            case DAYS -> DateTimeFormatter.ofPattern("EEE", Locale.ENGLISH).format(zdt);
            default -> zdt.toLocalDate().toString();
        };
    }

    private static final Map<Integer, String> BUCKET_COLORS = Map.of(200, "#22c55e", 300, "#3b82f6", 400, "#f59e0b", 500, "#ef4444");

    public StatusCodesResponse getStatusCodes(Long tenantId, TimeRange range) {
        Instant now = clock.instant();
        Instant since = range.since(now);
        List<Object[]> rows = repository.countByStatusCodeBucketInRange(tenantId, since, now);
        long total = rows.stream().mapToLong(r -> ((Number) r[1]).longValue()).sum();
        List<StatusCodesResponse.StatusCodeBucket> buckets = rows.stream()
                .map(r -> {
                    int bucket = ((Number) r[0]).intValue();
                    long count = ((Number) r[1]).longValue();
                    double pct = total == 0 ? 0.0 : Math.round((count * 1000.0 / total)) / 10.0;
                    String label = (bucket / 100) + "xx";
                    String color = BUCKET_COLORS.getOrDefault(bucket, "#94a3b8");
                    return new StatusCodesResponse.StatusCodeBucket(label, count, pct, color);
                }).toList();
        return new StatusCodesResponse(range.getCode(), total, buckets);
    }

    public TopEndpointsResponse getTopEndpoints(Long tenantId, TimeRange range) {
        Instant now = clock.instant();
        Instant since = range.since(now);
        List<Object[]> rows = repository.findTopEndpointsInRange(tenantId, since, now, PageRequest.of(0, 10));
        List<TopEndpointsResponse.EndpointEntry> endpoints = rows.stream()
                .map(r -> new TopEndpointsResponse.EndpointEntry((String) r[0], ((Number) r[1]).longValue())).toList();
        return new TopEndpointsResponse(range.getCode(), endpoints);
    }

    private static final List<EventType> BRUTE_FORCE_TYPES = List.of(EventType.LOGIN_FAILURE);
    private static final List<EventType> RATE_LIMIT_TYPES_LIST = List.of(EventType.RATE_LIMIT_EXCEEDED);
    private static final List<EventType> BAD_KEY_TYPES = List.of(EventType.IP_BLOCKED, EventType.USER_BLOCKED);

    public ThreatCompositionResponse getThreatComposition(Long tenantId, TimeRange range) {
        Instant now = clock.instant();
        Instant windowStart = range.since(now);
        int steps = range.getSteps();
        ChronoUnit unit = range.getUnit();
        List<ThreatCompositionResponse.DataPoint> points = new ArrayList<>(steps);
        for (int i = steps; i >= 1; i--) {
            Instant bucketEnd = windowStart.plus(i, unit);
            Instant bucketStart = windowStart.plus(i - 1, unit);
            long bruteForce = repository.countByTenantAndTypesInRange(tenantId, BRUTE_FORCE_TYPES, bucketStart, bucketEnd);
            long rateLimit = repository.countByTenantAndTypesInRange(tenantId, RATE_LIMIT_TYPES_LIST, bucketStart, bucketEnd);
            long badKey = repository.countByTenantAndTypesInRange(tenantId, BAD_KEY_TYPES, bucketStart, bucketEnd);
            points.add(new ThreatCompositionResponse.DataPoint(buildLabel(bucketStart, unit), bruteForce, rateLimit, badKey));
        }
        return new ThreatCompositionResponse(range.getCode(), points);
    }

    public TopBlockedIpsResponse getTopBlockedIps(Long tenantId, TimeRange range) {
        Instant now = clock.instant();
        Instant since = range.since(now);
        List<Object[]> rows = repository.findTopBlockedIpsInRange(tenantId, BLOCKED_TYPES, since, now, PageRequest.of(0, 5));
        List<TopBlockedIpsResponse.BlockedIpEntry> ips = rows.stream()
                .map(r -> new TopBlockedIpsResponse.BlockedIpEntry((String) r[0], ((Number) r[1]).longValue(), "IP_BLOCKED")).toList();
        return new TopBlockedIpsResponse(range.getCode(), ips);
    }

    public RateLimitUsageResponse getRateLimitUsage(Long tenantId, int limitPerMinute) {
        String clientId = "tenant:" + tenantId;
        long used = rateLimitService.getRequestCount(clientId);
        long limit = limitPerMinute;
        long remaining = Math.max(0, limit - used);
        int pct = limit == 0 ? 0 : (int) Math.min(100, Math.round((used * 100.0) / limit));

        // Calculate seconds until window resets
        String key = "rate_limit:" + clientId;
        Long ttl = stringRedisTemplate.getExpire(key, java.util.concurrent.TimeUnit.SECONDS);
        long resetsInSec = ttl != null && ttl > 0 ? ttl : rateLimitService.getWindowSeconds();
        return new RateLimitUsageResponse(used, limit, remaining, pct, resetsInSec);
    }
}