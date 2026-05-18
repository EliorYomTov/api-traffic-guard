package com.trafficguard.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

@Slf4j
@Component
public class JwtService {

    @Value("${app.jwt.secret}")
    private String secretKey;

    @Value("${app.jwt.expiration}")
    private long expiration;

    /**
     * Generates a JWT with userId, tenantId, and rateLimitPerMinute as claims.
     * tenantId is required so JwtAuthenticationFilter can reconstruct
     * a TenantPrincipal without a DB call on every request.
     */
    public String generateToken(Long userId, String username, Long tenantId, int rateLimitPerMinute) {
        return Jwts.builder()
                .subject(username)
                .claim("userId",             userId)
                .claim("tenantId",           tenantId)
                .claim("rateLimitPerMinute", rateLimitPerMinute)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSigningKey())
                .compact();
    }

    public String extractUsername(String token) {
        return extractClaims(token).getSubject();
    }

    public Long extractUserId(String token) {
        return extractClaims(token).get("userId", Long.class);
    }

    public Long extractTenantId(String token) {
        return extractClaims(token).get("tenantId", Long.class);
    }

    public int extractRateLimitPerMinute(String token) {
        Integer value = extractClaims(token).get("rateLimitPerMinute", Integer.class);
        return value != null ? value : 60; // safe fallback
    }

    public boolean isTokenValid(String token) {
        try {
            extractClaims(token);
            return true;
        } catch (Exception e) {
            log.warn("Invalid JWT token: {}", e.getMessage());
            return false;
        }
    }

    private Claims extractClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
