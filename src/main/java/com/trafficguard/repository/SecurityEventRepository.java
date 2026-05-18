package com.trafficguard.repository;

import com.trafficguard.domain.SecurityEvent;
import com.trafficguard.domain.SecurityEvent.EventType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface SecurityEventRepository extends JpaRepository<SecurityEvent, Long> {

    // ── Existing queries (unchanged — used by admin controller & filters) ────

    List<SecurityEvent> findByIpAddress(String ipAddress);

    List<SecurityEvent> findByUserId(Long userId);

    List<SecurityEvent> findByEventType(EventType eventType);

    long countByUserIdAndEventTypeAndCreatedAtAfter(Long userId, EventType eventType, Instant after);

    long countByIpAddressAndEventTypeAndCreatedAtAfter(String ipAddress, EventType eventType, Instant after);

    List<SecurityEvent> findByEventTypeAndCreatedAtAfterOrderByCreatedAtDesc(EventType eventType, Instant after);

    List<SecurityEvent> findAllByOrderByCreatedAtDesc(Pageable pageable);

    // ── New tenant-scoped queries (used by /api/v1/events) ───────────────────

    /**
     * All events for a tenant, newest first — supports pagination.
     * Used for the "All" filter tab.
     */
    Page<SecurityEvent> findByTenantIdOrderByCreatedAtDesc(Long tenantId, Pageable pageable);

    /**
     * Events for a tenant filtered by a single EventType.
     * Used for specific-type filtering (e.g. ?eventType=IP_BLOCKED).
     */
    Page<SecurityEvent> findByTenantIdAndEventTypeOrderByCreatedAtDesc(
            Long tenantId, EventType eventType, Pageable pageable);

    /**
     * Events for a tenant filtered by multiple EventTypes.
     * Used for severity grouping — e.g. CRITICAL maps to [USER_BLOCKED, IP_BLOCKED].
     */
    Page<SecurityEvent> findByTenantIdAndEventTypeInOrderByCreatedAtDesc(
            Long tenantId, List<EventType> eventTypes, Pageable pageable);

    /**
     * Count of events per tenant — used for the badge counter in the sidebar.
     */
    long countByTenantId(Long tenantId);
}
