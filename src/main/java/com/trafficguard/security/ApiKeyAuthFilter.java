package com.trafficguard.security;

import com.trafficguard.domain.ApiKey;
import com.trafficguard.service.ApiKeyService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

@Slf4j
@Component
@RequiredArgsConstructor
public class ApiKeyAuthFilter extends OncePerRequestFilter {

    private static final String API_KEY_PREFIX = "atg_";

    private final ApiKeyService apiKeyService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        String authHeader = request.getHeader("Authorization");
        // Only intercept API key requests — JWT requests are handled by JwtAuthenticationFilter
        if (authHeader == null || !authHeader.startsWith("Bearer ") || !authHeader.substring(7).startsWith(API_KEY_PREFIX)) {
            filterChain.doFilter(request, response);
            return;
        }
        String plaintext = authHeader.substring(7);
        Optional<ApiKey> apiKey = apiKeyService.validateKey(plaintext);
        if (apiKey.isEmpty()) {
            log.warn("Invalid or revoked API key attempt from ip={}", request.getRemoteAddr());
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\": \"Invalid or revoked API key\"}");
            return;
        }
        ApiKey key = apiKey.get();
        // Set tenant as principal so downstream filters and controllers can identify the tenant
        TenantPrincipal principal = new TenantPrincipal(key.getTenant().getId(), key.getTenant().getRateLimitPerMinute());
        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                principal, null, List.of(new SimpleGrantedAuthority("ROLE_API_CLIENT")));
        SecurityContextHolder.getContext().setAuthentication(authentication);
        log.debug("API key authenticated tenantId={} keyPrefix={}", key.getTenant().getId(), key.getKeyPrefix());
        filterChain.doFilter(request, response);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        // Only run on protected API paths, not on auth or actuator
        String path = request.getRequestURI();
        return path.startsWith("/api/auth") || path.startsWith("/actuator");
    }
}