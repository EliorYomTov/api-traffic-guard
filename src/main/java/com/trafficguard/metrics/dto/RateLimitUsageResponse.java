package com.trafficguard.metrics.dto;

/**
 * Current rate limit consumption for the authenticated tenant.
 *
 * @param used        requests made in the current window
 * @param limit       maximum requests allowed per window
 * @param remaining   requests left in the current window
 * @param pct         usage percentage (0-100)
 * @param resetsInSec seconds until the window resets
 */
public record RateLimitUsageResponse(long used, long limit, long remaining, int pct, long resetsInSec) {
}