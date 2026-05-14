package com.trafficguard.controller;

import com.trafficguard.domain.Tenant;
import com.trafficguard.dto.request.CreateApiKeyRequest;
import com.trafficguard.dto.response.ApiKeyResponse;
import com.trafficguard.repository.TenantRepository;
import com.trafficguard.repository.UserRepository;
import com.trafficguard.security.TenantPrincipal;
import com.trafficguard.service.ApiKeyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/api-keys")
@RequiredArgsConstructor
public class ApiKeyController {

    private final ApiKeyService apiKeyService;
    private final UserRepository userRepository;
    private final TenantRepository tenantRepository;

    @PostMapping
    public ResponseEntity<ApiKeyResponse> createKey(@Valid @RequestBody CreateApiKeyRequest request) {
        Tenant tenant = resolveTenant();
        ApiKeyService.PlaintextApiKey result = apiKeyService.generateKey(tenant, request.name());
        ApiKeyResponse response = ApiKeyResponse.withPlaintext(
                apiKeyService.listKeys(tenant.getId())
                        .stream()
                        .filter(k -> k.getId().equals(result.keyId()))
                        .findFirst()
                        .orElseThrow(),
                result.plaintext()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<ApiKeyResponse>> listKeys() {
        Tenant tenant = resolveTenant();
        List<ApiKeyResponse> keys = apiKeyService.listKeys(tenant.getId())
                .stream()
                .map(ApiKeyResponse::from)
                .toList();
        return ResponseEntity.ok(keys);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> revokeKey(@PathVariable Long id) {
        Tenant tenant = resolveTenant();
        apiKeyService.revokeKey(id, tenant.getId());
        return ResponseEntity.noContent().build();
    }

    // ------------------------------------------------------------------
    // Private helpers
    // ------------------------------------------------------------------
    private Tenant resolveTenant() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication.getPrincipal() instanceof TenantPrincipal tenantPrincipal) {
            return tenantRepository.getReferenceById(tenantPrincipal.getTenantId());
        }
        if (authentication.getPrincipal() instanceof UserDetails userDetails) {
            return userRepository.findByUsername(userDetails.getUsername())
                    .orElseThrow(() -> new UsernameNotFoundException(
                            "User not found: " + userDetails.getUsername()))
                    .getTenant();
        }
        throw new IllegalStateException("Unknown principal type");
    }
}