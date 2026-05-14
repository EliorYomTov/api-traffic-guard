package com.trafficguard.security;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * Principal set in the SecurityContext for API key authenticated requests.
 * Stores only the values needed from Tenant to avoid LazyInitializationException
 * outside the JPA session.
 */
@Getter
@RequiredArgsConstructor
public class TenantPrincipal {

    private final Long tenantId;
    private final int  rateLimitPerMinute;

    @Override
    public String toString() {
        return "TenantPrincipal{tenantId=" + tenantId + "}";
    }
}