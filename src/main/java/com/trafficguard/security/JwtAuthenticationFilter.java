package com.trafficguard.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Slf4j
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    public JwtAuthenticationFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);
        if (!jwtService.isTokenValid(token)) {
            filterChain.doFilter(request, response);
            return;
        }

        // Only set authentication if not already set (ApiKeyAuthFilter may have run first)
        if (SecurityContextHolder.getContext().getAuthentication() != null) {
            filterChain.doFilter(request, response);
            return;
        }

        Long tenantId = jwtService.extractTenantId(token);
        if (tenantId == null) {
            // Token predates Option B — no tenantId claim. Reject gracefully.
            log.warn("JWT missing tenantId claim — token must be re-issued. Path: {}", request.getRequestURI());
            filterChain.doFilter(request, response);
            return;
        }

        int rateLimit = jwtService.extractRateLimitPerMinute(token);

        // Build a TenantPrincipal — same type that ApiKeyAuthFilter uses.
        // This means controllers only need to handle one principal type.
        TenantPrincipal principal = new TenantPrincipal(tenantId, rateLimit);

        // Keep ROLE_USER authority so Spring Security's role checks still work.
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(principal, null, List.of(new SimpleGrantedAuthority("ROLE_USER")));
        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(authentication);
        filterChain.doFilter(request, response);
    }
}
