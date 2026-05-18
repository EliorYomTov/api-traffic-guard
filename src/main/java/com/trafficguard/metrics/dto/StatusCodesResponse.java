package com.trafficguard.metrics.dto;

import java.util.List;

/**
 * Distribution of HTTP status codes for the dashboard donut chart.
 */
public record StatusCodesResponse(
        String range,
        long total,
        List<StatusCodeBucket> buckets
) {
    /**
     * @param label  display label — "2xx", "3xx", "4xx", "5xx"
     * @param count  number of events with this status code range
     * @param pct    percentage of total (one decimal place)
     * @param color  hex color for the donut chart segment
     */
    public record StatusCodeBucket(
            String label,
            long count,
            double pct,
            String color
    ) {}
}