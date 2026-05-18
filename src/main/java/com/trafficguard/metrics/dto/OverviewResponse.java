package com.trafficguard.metrics.dto;

/**
 * Overview KPI metrics for the dashboard top row.
 *
 * @param totalRequests        total events in the selected range
 * @param totalRequestsDelta   percent change vs the previous equivalent range (e.g. +12.5)
 * @param blockedRequests      count of IP_BLOCKED + USER_BLOCKED events
 * @param blockedRequestsDelta percent change vs the previous range
 * @param rateLimitHits        count of RATE_LIMIT_EXCEEDED events
 * @param rateLimitHitsDelta   percent change vs the previous range
 * @param avgResponseTimeMs    placeholder — we don't track response time yet, returns null
 * @param range                echo of the requested range code ("24h" | "7d" | "30d")
 */
public record OverviewResponse(
        long totalRequests,
        Double totalRequestsDelta,
        long blockedRequests,
        Double blockedRequestsDelta,
        long rateLimitHits,
        Double rateLimitHitsDelta,
        Long avgResponseTimeMs,
        String range) {
}