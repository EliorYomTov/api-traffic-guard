package com.trafficguard.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.trafficguard.domain.SecurityEvent;
import com.trafficguard.service.IpBlockService;
import com.trafficguard.service.RateLimitService;
import com.trafficguard.service.SecurityEventService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;

@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private final RateLimitService rateLimitService;
    private final ObjectMapper objectMapper;
    private final SecurityEventService securityEventService;
    private final IpBlockService ipBlockService;

    public RateLimitFilter(RateLimitService rateLimitService, ObjectMapper objectMapper,
                           SecurityEventService securityEventService, IpBlockService ipBlockService) {
        this.rateLimitService = rateLimitService;
        this.objectMapper = objectMapper;
        this.securityEventService = securityEventService;
        this.ipBlockService = ipBlockService;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response, @NonNull FilterChain filterChain) throws ServletException, IOException {
        String ip = resolveIp(request);
        if (ipBlockService.isBlocked(ip)) {
            securityEventService.recordEvent(null, SecurityEvent.EventType.IP_BLOCKED, ip, request.getRequestURI(), 403);
            response.setStatus(HttpStatus.FORBIDDEN.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            objectMapper.writeValue(response.getWriter(), Map.of("status", 403, "error", "Forbidden", "message", "Your IP has been blocked."));
            return;
        }
        String clientId = resolveClientId(request);
        int limit = resolveLimit();
        long currentCount = rateLimitService.getRequestCount(clientId);
        response.setHeader("X-RateLimit-Limit", String.valueOf(limit));
        response.setHeader("X-RateLimit-Remaining", String.valueOf(Math.max(0, limit - currentCount - 1)));
        if (!rateLimitService.isAllowed(clientId, limit)) {
            securityEventService.recordEvent(null, SecurityEvent.EventType.RATE_LIMIT_EXCEEDED, ip, request.getRequestURI(), 429);
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            objectMapper.writeValue(response.getWriter(),
                    Map.of("status", 429, "error", "Too Many Requests", "message", "Rate limit exceeded. Try again in " + rateLimitService.getWindowSeconds() + " seconds."));
            return;
        }
        filterChain.doFilter(request, response);
    }

    /**
     * Returns per-tenant rate limit if the request is authenticated via API key,
     * otherwise falls back to the global default.
     */
    private int resolveLimit() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof TenantPrincipal tenantPrincipal) {
            return tenantPrincipal.getRateLimitPerMinute();
        }
        return rateLimitService.getLimit();
    }

    /**
     * Client identity: tenant > authenticated username > X-Forwarded-For > remote IP
     */
    private String resolveClientId(HttpServletRequest request) {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof TenantPrincipal tenantPrincipal) {
            return "tenant:" + tenantPrincipal.getTenantId();
        }
        String username = request.getUserPrincipal() != null ? request.getUserPrincipal().getName() : null;
        if (username != null) return "user:" + username;
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return "ip:" + forwarded.split(",")[0].trim();
        }
        return "ip:" + request.getRemoteAddr();
    }

    /**
     * Extracts the client IP, respecting X-Forwarded-For for proxy setups.
     */
    private String resolveIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.startsWith("/actuator") || path.startsWith("/api/auth") || path.startsWith("/api/admin");
    }
}