package com.trafficguard.metrics.dto;

import java.util.List;

/**
 * Most frequently called endpoints in the selected time range.
 */
public record TopEndpointsResponse(String range, List<EndpointEntry> endpoints) {
    /**
     * @param path  endpoint path (e.g. "/api/v1/auth/login")
     * @param count number of events recorded for this path
     */
    public record EndpointEntry(String path, long count) {
    }
}