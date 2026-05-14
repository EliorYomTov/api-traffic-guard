package com.trafficguard.service;

import com.trafficguard.domain.ApiKey;
import com.trafficguard.domain.Tenant;
import com.trafficguard.repository.ApiKeyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ApiKeyService {

    private static final String KEY_PREFIX = "atg_live_sk_";
    private static final int    KEY_RANDOM_BYTES = 32;

    private final ApiKeyRepository apiKeyRepository;
    private final SecureRandom     secureRandom = new SecureRandom();

    /**
     * Generates a new API key for the given tenant.
     * The plaintext key is returned exactly once — it is never stored.
     * Only the SHA-256 hash and a short prefix are persisted.
     *
     * @return PlaintextApiKey — contains the full plaintext + the saved entity id
     */
    @Transactional
    public PlaintextApiKey generateKey(Tenant tenant, String keyName) {
        String plaintext = generatePlaintext();
        String hash      = sha256Hex(plaintext);
        String prefix    = plaintext.substring(0, 16);

        ApiKey apiKey = ApiKey.builder()
                .tenant(tenant)
                .keyHash(hash)
                .keyPrefix(prefix)
                .name(keyName)
                .build();

        ApiKey saved = apiKeyRepository.save(apiKey);
        log.info("API key created for tenant={} keyPrefix={}", tenant.getId(), prefix);

        return new PlaintextApiKey(saved.getId(), plaintext);
    }

    /**
     * Lists all active (non-revoked) API keys for a tenant.
     * Never returns the plaintext or hash — only metadata.
     */
    @Transactional(readOnly = true)
    public List<ApiKey> listKeys(Long tenantId) {
        return apiKeyRepository.findAllByTenantIdOrderByCreatedAtDesc(tenantId);
    }

    /**
     * Revokes an API key by setting revoked_at.
     * Does not delete — preserves audit trail.
     *
     * @throws ApiKeyNotFoundException if key does not belong to this tenant
     */
    @Transactional
    public void revokeKey(Long keyId, Long tenantId) {
        ApiKey apiKey = apiKeyRepository.findById(keyId)
                .filter(k -> k.getTenant().getId().equals(tenantId))
                .orElseThrow(() -> new ApiKeyNotFoundException(keyId));

        if (!apiKey.isActive()) {
            log.warn("Attempted to revoke already-revoked key id={}", keyId);
            return;
        }

        apiKey.setRevokedAt(Instant.now());
        log.info("API key revoked id={} tenantId={}", keyId, tenantId);
    }

    /**
     * Looks up a tenant by raw API key string.
     * Used by ApiKeyAuthFilter on every inbound request.
     * Returns empty if the key is not found or is revoked.
     */
    @Transactional
    public java.util.Optional<ApiKey> validateKey(String plaintext) {
        String hash = sha256Hex(plaintext);
        return apiKeyRepository.findByKeyHashAndRevokedAtIsNull(hash)
                .map(key -> {
                    key.setLastUsedAt(Instant.now());
                    return key;
                });
    }

    // ------------------------------------------------------------------
    // Private helpers
    // ------------------------------------------------------------------

    private String generatePlaintext() {
        byte[] bytes = new byte[KEY_RANDOM_BYTES];
        secureRandom.nextBytes(bytes);
        // URL-safe Base64, no padding — gives ~43 chars of random suffix
        String random = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        return KEY_PREFIX + random;
    }

    private static String sha256Hex(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            // SHA-256 is guaranteed by the JVM spec — this can never happen
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }

    // ------------------------------------------------------------------
    // Value object — returned once at key creation, never persisted
    // ------------------------------------------------------------------

    public record PlaintextApiKey(Long keyId, String plaintext) {}

    // ------------------------------------------------------------------
    // Exception
    // ------------------------------------------------------------------

    public static class ApiKeyNotFoundException extends RuntimeException {
        public ApiKeyNotFoundException(Long keyId) {
            super("API key not found or does not belong to this tenant: " + keyId);
        }
    }
}