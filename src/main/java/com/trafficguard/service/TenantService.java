package com.trafficguard.service;

import com.trafficguard.domain.Plan;
import com.trafficguard.domain.Tenant;
import com.trafficguard.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class TenantService {

    private static final int FREE_RATE_LIMIT  = 60;
    private static final int PRO_RATE_LIMIT   = 1000;

    private final TenantRepository tenantRepository;

    @Transactional
    public Tenant createTenant(String name, Plan plan) {
        int rateLimit = switch (plan) {
            case FREE        -> FREE_RATE_LIMIT;
            case PRO         -> PRO_RATE_LIMIT;
            case ENTERPRISE  -> PRO_RATE_LIMIT; // overridden manually per contract
        };

        Tenant tenant = Tenant.builder()
                .name(name)
                .plan(plan)
                .rateLimitPerMinute(rateLimit)
                .build();

        Tenant saved = tenantRepository.save(tenant);
        log.info("Tenant created id={} name={} plan={}", saved.getId(), name, plan);
        return saved;
    }

    @Transactional(readOnly = true)
    public Tenant getById(Long tenantId) {
        return tenantRepository.findById(tenantId)
                .orElseThrow(() -> new TenantNotFoundException(tenantId));
    }

    public static class TenantNotFoundException extends RuntimeException {
        public TenantNotFoundException(Long tenantId) {
            super("Tenant not found: " + tenantId);
        }
    }
}