package com.trafficguard.dto.response;

import java.util.List;

/**
 * Paginated wrapper for security events.
 * Keeps the API contract stable if we switch to cursor-based pagination later.
 */
public record PagedEventsResponse(
        List<SecurityEventResponse> content,
        int  page,
        int  size,
        long totalElements,
        int  totalPages,
        boolean last
) {}
