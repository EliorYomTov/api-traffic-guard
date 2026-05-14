package com.trafficguard.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.trafficguard.domain.ApiKey;

import java.time.Instant;

/**
 * API key response DTO.
 * plaintext is only populated on creation — null on all subsequent reads.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiKeyResponse(
        Long id,
        String prefix,
        String name,
        String plaintext,
        boolean active,
        Instant lastUsedAt,
        Instant createdAt
) {
    public static ApiKeyResponse withPlaintext(ApiKey key, String plaintext) {
        return new ApiKeyResponse(
                key.getId(),
                key.getKeyPrefix(),
                key.getName(),
                plaintext,
                key.isActive(),
                key.getLastUsedAt(),
                key.getCreatedAt()
        );
    }

    public static ApiKeyResponse from(ApiKey key) {
        return new ApiKeyResponse(
                key.getId(),
                key.getKeyPrefix(),
                key.getName(),
                null,
                key.isActive(),
                key.getLastUsedAt(),
                key.getCreatedAt()
        );
    }
}