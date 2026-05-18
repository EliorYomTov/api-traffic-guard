package com.trafficguard.repository;

import com.trafficguard.domain.SecurityEvent;
import com.trafficguard.domain.SecurityEvent.EventType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Collection;
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

    // === Metrics aggregations ===

    @Query("""
            SELECT COUNT(e) FROM SecurityEvent e
            WHERE e.tenant.id = :tenantId
              AND e.createdAt >= :since
              AND e.createdAt < :until
            """)
    long countByTenantInRange(
            @Param("tenantId") Long tenantId,
            @Param("since") Instant since,
            @Param("until") Instant until);

    @Query("""
            SELECT COUNT(e) FROM SecurityEvent e
            WHERE e.tenant.id = :tenantId
              AND e.eventType IN :types
              AND e.createdAt >= :since
              AND e.createdAt < :until
            """)
    long countByTenantAndTypesInRange(
            @Param("tenantId") Long tenantId,
            @Param("types") Collection<SecurityEvent.EventType> types,
            @Param("since") Instant since,
            @Param("until") Instant until);

    @Query("""
            SELECT FLOOR(e.statusCode / 100) * 100 AS bucket,
                   COUNT(e) AS cnt
            FROM SecurityEvent e
            WHERE e.tenant.id = :tenantId
              AND e.statusCode IS NOT NULL
              AND e.createdAt >= :since
              AND e.createdAt < :until
            GROUP BY FLOOR(e.statusCode / 100) * 100
            ORDER BY FLOOR(e.statusCode / 100) * 100
            """)
    List<Object[]> countByStatusCodeBucketInRange(
            @Param("tenantId") Long tenantId,
            @Param("since") Instant since,
            @Param("until") Instant until);

    @Query("""
            SELECT e.endpoint, COUNT(e)
            FROM SecurityEvent e
            WHERE e.tenant.id = :tenantId
              AND e.endpoint IS NOT NULL
              AND e.createdAt >= :since
              AND e.createdAt < :until
            GROUP BY e.endpoint
            ORDER BY COUNT(e) DESC
            """)
    List<Object[]> findTopEndpointsInRange(
            @Param("tenantId") Long tenantId,
            @Param("since") Instant since,
            @Param("until") Instant until,
            Pageable pageable);

    @Query("""
            SELECT e.ipAddress, COUNT(e)
            FROM SecurityEvent e
            WHERE e.tenant.id = :tenantId
              AND e.eventType IN :types
              AND e.createdAt >= :since
              AND e.createdAt < :until
            GROUP BY e.ipAddress
            ORDER BY COUNT(e) DESC
            """)
    List<Object[]> findTopBlockedIpsInRange(
            @Param("tenantId") Long tenantId,
            @Param("types") Collection<EventType> types,
            @Param("since") Instant since,
            @Param("until") Instant until,
            Pageable pageable);
}
