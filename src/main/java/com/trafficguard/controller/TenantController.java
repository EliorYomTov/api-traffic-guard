package com.trafficguard.controller;

import com.trafficguard.domain.Tenant;
import com.trafficguard.repository.UserRepository;
import com.trafficguard.security.TenantPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/tenant")
@RequiredArgsConstructor
public class TenantController {

    private final UserRepository userRepository;

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getMyTenant() {
        Tenant tenant = resolveTenant();
        return ResponseEntity.ok(Map.of(
                "id", tenant.getId(),
                "name", tenant.getName(),
                "plan", tenant.getPlan().name(),
                "rateLimitPerMinute", tenant.getRateLimitPerMinute()
        ));
    }

    private Tenant resolveTenant() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication.getPrincipal() instanceof TenantPrincipal tenantPrincipal) {
            // API key auth — we only have tenantId, need to load tenant
            return userRepository.findFirstByTenantId(tenantPrincipal.getTenantId())
                    .orElseThrow(() -> new RuntimeException("Tenant not found"))
                    .getTenant();
        }

        if (authentication.getPrincipal() instanceof UserDetails userDetails) {
            return userRepository.findByUsername(userDetails.getUsername())
                    .orElseThrow(() -> new UsernameNotFoundException("User not found"))
                    .getTenant();
        }

        throw new IllegalStateException("Unknown principal type");
    }
}