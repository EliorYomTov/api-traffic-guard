package com.trafficguard.metrics.dto;

import java.util.List;

/**
 * Time-series breakdown of allowed vs blocked requests.
 *
 * @param range  echo of the requested range code ("24h" | "7d" | "30d")
 * @param points ordered list of buckets, oldest → newest
 */
public record TimeseriesResponse(String range, List<DataPoint> points) {
    /**
     * @param label   display label — hour ("14:00") for 24h, day name ("Mon") for 7d/30d
     * @param allowed total events minus blocked
     * @param blocked IP_BLOCKED + USER_BLOCKED count
     */
    public record DataPoint(String label, long allowed, long blocked) {}
}