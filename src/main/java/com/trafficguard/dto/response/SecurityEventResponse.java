package com.trafficguard.dto.response;

import com.trafficguard.domain.SecurityEvent;
import com.trafficguard.domain.SecurityEvent.EventType;

import java.time.Instant;

/**
 * Public-facing DTO for security events.
 * Never exposes tenant internals or raw userId.
 * Severity is derived from EventType so the DB schema stays clean.
 */
public record SecurityEventResponse(
        Long    id,
        Instant createdAt,
        String  eventType,
        String  severity,
        String  ipAddress,
        String  endpoint,
        Integer statusCode
) {

    public static SecurityEventResponse from(SecurityEvent e) {
        return new SecurityEventResponse(
                e.getId(),
                e.getCreatedAt(),
                e.getEventType().name(),
                resolveSeverity(e.getEventType()),
                e.getIpAddress(),
                e.getEndpoint(),
                e.getStatusCode()
        );
    }

    /**
     * Maps domain EventType → UI severity label.
     * Centralised here so frontend never has to guess.
     */
    private static String resolveSeverity(EventType type) {
        return switch (type) {
            case USER_BLOCKED, IP_BLOCKED          -> "CRITICAL";
            case RATE_LIMIT_EXCEEDED, LOGIN_FAILURE -> "WARNING";
            case LOGIN_SUCCESS                      -> "SUCCESS";
            case USER_UNBLOCKED                    -> "INFO";
        };
    }
}
