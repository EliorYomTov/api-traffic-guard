package com.trafficguard.controller;

import com.trafficguard.dto.response.PagedEventsResponse;
import com.trafficguard.security.TenantPrincipal;
import com.trafficguard.service.SecurityEventQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * Tenant-scoped security events endpoint.
 *
 * All queries are automatically scoped to the authenticated tenant —
 * a tenant can never see another tenant's events.
 *
 * Intentionally separate from the legacy /api/admin/events controller,
 * which is kept intact for backward compatibility.
 *
 * GET /api/v1/events
 *   ?page=0          zero-based page (default 0)
 *   ?size=20         page size, max 100 (default 20)
 *   ?severity=       CRITICAL | WARNING | SUCCESS | INFO  (optional)
 *   ?eventType=      LOGIN_FAILURE | IP_BLOCKED | ...     (optional, takes precedence over severity)
 *
 * Examples:
 *   GET /api/v1/events                         → all events, page 0
 *   GET /api/v1/events?severity=CRITICAL       → critical events only
 *   GET /api/v1/events?eventType=IP_BLOCKED    → IP_BLOCKED events only
 *   GET /api/v1/events?page=1&size=50          → page 1, 50 per page
 */
@RestController
@RequestMapping("/api/v1/events")
@RequiredArgsConstructor
public class TenantSecurityEventController {

    private final SecurityEventQueryService queryService;

    @GetMapping
    public ResponseEntity<PagedEventsResponse> getEvents(
            @AuthenticationPrincipal TenantPrincipal principal,
            @RequestParam(defaultValue = "0")  int    page,
            @RequestParam(defaultValue = "20") int    size,
            @RequestParam(required = false)    String severity,
            @RequestParam(required = false)    String eventType
    ) {
        Long tenantId = principal.getTenantId();

        PagedEventsResponse response = queryService.getEvents(
                tenantId, severity, eventType, page, size
        );

        return ResponseEntity.ok(response);
    }
}
