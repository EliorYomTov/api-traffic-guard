package com.trafficguard.controller;

import com.trafficguard.domain.Tenant;
import com.trafficguard.domain.User;
import com.trafficguard.dto.request.CreateApiKeyRequest;
import com.trafficguard.dto.response.ApiKeyResponse;
import com.trafficguard.repository.UserRepository;
import com.trafficguard.service.ApiKeyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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

    /**
     * Creates a new API key for the authenticated user's tenant.
     * The plaintext key is returned exactly once in the response.
     */
    @PostMapping
    public ResponseEntity<ApiKeyResponse> createKey(@AuthenticationPrincipal UserDetails principal, @Valid @RequestBody CreateApiKeyRequest request) {
        Tenant tenant = resolveTenant(principal);
        ApiKeyService.PlaintextApiKey result = apiKeyService.generateKey(tenant, request.name());
        ApiKeyResponse response = ApiKeyResponse.withPlaintext(
                apiKeyService.listKeys(tenant.getId())
                        .stream()
                        .filter(k -> k.getId().equals(result.keyId()))
                        .findFirst()
                        .orElseThrow(),
                result.plaintext());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Lists all API keys for the authenticated user's tenant.
     * Never returns plaintext.
     */
    @GetMapping
    public ResponseEntity<List<ApiKeyResponse>> listKeys(@AuthenticationPrincipal UserDetails principal) {
        Tenant tenant = resolveTenant(principal);
        List<ApiKeyResponse> keys = apiKeyService.listKeys(tenant.getId())
                .stream()
                .map(ApiKeyResponse::from)
                .toList();
        return ResponseEntity.ok(keys);
    }

    /**
     * Revokes an API key by id.
     * The key must belong to the authenticated user's tenant.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> revokeKey(@AuthenticationPrincipal UserDetails principal, @PathVariable Long id) {
        Tenant tenant = resolveTenant(principal);
        apiKeyService.revokeKey(id, tenant.getId());
        return ResponseEntity.noContent().build();
    }

    // ------------------------------------------------------------------
    // Private helpers
    // ------------------------------------------------------------------
    private Tenant resolveTenant(UserDetails principal) {
        User user = userRepository.findByUsername(principal.getUsername())
                .orElseThrow(() -> new UsernameNotFoundException(
                        "User not found: " + principal.getUsername()));
        return user.getTenant();
    }
}