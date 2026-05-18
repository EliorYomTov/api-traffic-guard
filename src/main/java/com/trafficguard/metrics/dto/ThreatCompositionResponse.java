package com.trafficguard.metrics.dto;

import java.util.List;

/**
 * Stacked breakdown of threat types over time.
 */
public record ThreatCompositionResponse(
        String range,
        List<DataPoint> points
) {
    /**
     * @param label      display label (day name or hour)
     * @param bruteForce count of LOGIN_FAILURE events
     * @param rateLimit  count of RATE_LIMIT_EXCEEDED events
     * @param badKey     count of IP_BLOCKED + USER_BLOCKED events
     */
    public record DataPoint(
            String label,
            long bruteForce,
            long rateLimit,
            long badKey
    ) {}
}