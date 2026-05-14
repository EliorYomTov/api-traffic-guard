package com.trafficguard.service;

import com.trafficguard.domain.SecurityEvent;
import com.trafficguard.domain.SecurityEvent.EventType;
import com.trafficguard.domain.Tenant;
import com.trafficguard.repository.SecurityEventRepository;
import com.trafficguard.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SecurityEventService {

    private static final long DEFAULT_TENANT_ID = 1L;

    private final SecurityEventRepository securityEventRepository;
    private final TenantRepository        tenantRepository;

    /**
     * Records a security event scoped to a specific tenant.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordEvent(Tenant tenant, Long userId, EventType eventType,
                            String ipAddress, String endpoint, int statusCode) {
        SecurityEvent event = SecurityEvent.builder()
                .tenant(tenant)
                .userId(userId)
                .eventType(eventType)
                .ipAddress(ipAddress)
                .endpoint(endpoint)
                .statusCode(statusCode)
                .build();
        securityEventRepository.save(event);
    }

    /**
     * Records a platform-level event (from filters, before tenant is known).
     * Falls back to default tenant.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordEvent(Long userId, EventType eventType,
                            String ipAddress, String endpoint, int statusCode) {
        Tenant defaultTenant = tenantRepository.getReferenceById(DEFAULT_TENANT_ID);
        recordEvent(defaultTenant, userId, eventType, ipAddress, endpoint, statusCode);
    }
}