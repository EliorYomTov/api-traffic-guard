package com.trafficguard.service;

import com.trafficguard.domain.Plan;
import com.trafficguard.domain.SecurityEvent.EventType;
import com.trafficguard.domain.Tenant;
import com.trafficguard.domain.User;
import com.trafficguard.domain.User.Status;
import com.trafficguard.dto.request.LoginRequest;
import com.trafficguard.dto.request.RegisterRequest;
import com.trafficguard.dto.response.AuthResponse;
import com.trafficguard.exception.EmailAlreadyExistsException;
import com.trafficguard.exception.InvalidCredentialsException;
import com.trafficguard.exception.UsernameAlreadyExistsException;
import com.trafficguard.repository.UserRepository;
import com.trafficguard.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final SecurityEventService securityEventService;
    private final JwtService jwtService;
    private final TenantService tenantService;

    @Transactional
    public AuthResponse register(RegisterRequest request, String ipAddress) {
        if (userRepository.existsByUsername(request.username())) {
            throw new UsernameAlreadyExistsException(request.username());
        }
        if (userRepository.existsByEmail(request.email())) {
            throw new EmailAlreadyExistsException(request.email());
        }
        // Every new registration gets its own FREE tenant
        Tenant tenant = tenantService.createTenant(request.username(), Plan.FREE);
        User user = User.builder()
                .username(request.username())
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .status(Status.ACTIVE)
                .tenant(tenant)
                .tenantRole(User.TenantRole.OWNER)
                .build();
        User saved = userRepository.save(user);
        log.info("Registered new user: {} tenant: {}", saved.getUsername(), tenant.getId());
        String token = jwtService.generateToken(saved.getId(), saved.getUsername());
        return AuthResponse.authenticated(saved.getUsername(), saved.getId(), token);
    }

    @Transactional
    public AuthResponse login(LoginRequest request, String ipAddress, String endpoint) {
        User user = userRepository.findByUsername(request.username()).orElse(null);
        if (user == null || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            securityEventService.recordEvent(null, EventType.LOGIN_FAILURE, ipAddress, endpoint, 401);
            throw new InvalidCredentialsException();
        }
        securityEventService.recordEvent(user.getId(), EventType.LOGIN_SUCCESS, ipAddress, endpoint, 200);
        log.info("Successful login for user: {}", user.getUsername());
        String token = jwtService.generateToken(user.getId(), user.getUsername());
        return AuthResponse.authenticated(user.getUsername(), user.getId(), token);
    }
}