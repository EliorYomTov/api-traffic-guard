package com.trafficguard.controller;

import com.trafficguard.domain.Tenant;
import com.trafficguard.repository.TenantRepository;
import com.trafficguard.security.TenantPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/tenant")
@RequiredArgsConstructor
public class TenantController {

    private final TenantRepository tenantRepository;

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getMyTenant(@AuthenticationPrincipal TenantPrincipal principal) {
        Tenant tenant = tenantRepository.findById(principal.getTenantId())
                .orElseThrow(() -> new RuntimeException("Tenant not found: " + principal.getTenantId()));
        return ResponseEntity.ok(Map.of("id", tenant.getId(), "name", tenant.getName(),"plan", tenant.getPlan().name(), "rateLimitPerMinute", tenant.getRateLimitPerMinute()));
    }
}