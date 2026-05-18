package com.trafficguard.service;

import com.trafficguard.domain.SecurityEvent.EventType;
import com.trafficguard.dto.response.PagedEventsResponse;
import com.trafficguard.dto.response.SecurityEventResponse;
import com.trafficguard.repository.SecurityEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Read-only service for querying security events scoped to the calling tenant.
 *
 * Deliberately separate from SecurityEventService (which handles writes)
 * to keep responsibilities clear and make it easy to add caching later.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SecurityEventQueryService {

    private static final int MAX_PAGE_SIZE = 100;
    private final SecurityEventRepository repo;

    /**
     * Returns a paginated list of events for the given tenant.
     *
     * @param tenantId  enforced by controller — never null
     * @param severity  optional filter: CRITICAL | WARNING | SUCCESS | INFO
     * @param eventType optional filter: raw EventType name
     * @param page      zero-based page index
     * @param size      page size (capped at MAX_PAGE_SIZE)
     */
    public PagedEventsResponse getEvents(Long   tenantId, String severity, String eventType, int    page, int    size) {
        Pageable pageable = PageRequest.of(page, Math.min(size, MAX_PAGE_SIZE));
        Page<SecurityEventResponse> result;
        if (eventType != null) {
            // Exact EventType filter (e.g. ?eventType=IP_BLOCKED)
            EventType type = EventType.valueOf(eventType.toUpperCase());
            result = repo.findByTenantIdAndEventTypeOrderByCreatedAtDesc(tenantId, type, pageable)
                    .map(SecurityEventResponse::from);
        } else if (severity != null) {
            // Severity filter — map to the EventTypes that belong to it
            List<EventType> types = severityToEventTypes(severity.toUpperCase());
            result = repo.findByTenantIdAndEventTypeInOrderByCreatedAtDesc(tenantId, types, pageable)
                    .map(SecurityEventResponse::from);
        } else {
            // No filter — return everything for this tenant
            result = repo.findByTenantIdOrderByCreatedAtDesc(tenantId, pageable)
                    .map(SecurityEventResponse::from);
        }
        return new PagedEventsResponse(result.getContent(), result.getNumber(), result.getSize(), result.getTotalElements(), result.getTotalPages(), result.isLast());
    }

    /**
     * Maps a severity label → the EventTypes that produce that severity.
     * Must stay in sync with SecurityEventResponse.resolveSeverity().
     */
    private static List<EventType> severityToEventTypes(String severity) {
        return switch (severity) {
            case "CRITICAL" -> List.of(EventType.USER_BLOCKED, EventType.IP_BLOCKED);
            case "WARNING"  -> List.of(EventType.RATE_LIMIT_EXCEEDED, EventType.LOGIN_FAILURE);
            case "SUCCESS"  -> List.of(EventType.LOGIN_SUCCESS);
            case "INFO"     -> List.of(EventType.USER_UNBLOCKED);
            default -> throw new IllegalArgumentException("Unknown severity: " + severity);
        };
    }
}
