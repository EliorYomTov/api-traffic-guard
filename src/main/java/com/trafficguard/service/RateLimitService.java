package com.trafficguard.service;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

@Service
public class RateLimitService {

    private final StringRedisTemplate redis;
    private final Counter allowedCounter;
    private final Counter blockedCounter;

    @Value("${rate-limit.requests-per-window:10}")
    private int requestsPerWindow;

    @Getter
    @Value("${rate-limit.window-seconds:60}")
    private int windowSeconds;

    public RateLimitService(StringRedisTemplate redis, MeterRegistry meterRegistry) {
        this.redis = redis;
        this.allowedCounter = Counter.builder("rate_limit_allowed")
                .description("Number of allowed requests")
                .register(meterRegistry);
        this.blockedCounter = Counter.builder("rate_limit_blocked")
                .description("Number of blocked requests")
                .register(meterRegistry);
    }

    /**
     * Sliding window check with a dynamic limit (e.g. per-tenant plan).
     * Falls back to the same Redis key structure as isAllowed(clientId).
     */
    public boolean isAllowed(String clientId, int limit) {
        String key = "rate_limit:" + clientId;
        long nowMs = Instant.now().toEpochMilli();
        long windowStartMs = nowMs - (windowSeconds * 1000L);
        redis.opsForZSet().removeRangeByScore(key, 0, windowStartMs);
        Long count = redis.opsForZSet().zCard(key);
        if (count != null && count >= limit) {
            blockedCounter.increment();
            return false;
        }
        redis.opsForZSet().add(key, UUID.randomUUID().toString(), nowMs);
        redis.expire(key, java.time.Duration.ofSeconds(windowSeconds * 2L));
        allowedCounter.increment();
        return true;
    }

    public long getRequestCount(String clientId) {
        String key = "rate_limit:" + clientId;
        long windowStartMs = Instant.now().toEpochMilli() - (windowSeconds * 1000L);
        redis.opsForZSet().removeRangeByScore(key, 0, windowStartMs);
        Long count = redis.opsForZSet().zCard(key);
        return count != null ? count : 0;
    }

    public int getLimit() {
        return requestsPerWindow;
    }
}