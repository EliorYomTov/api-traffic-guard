package com.trafficguard.service;

import com.trafficguard.domain.Plan;
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
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock private UserRepository       userRepository;
    @Mock private SecurityEventService securityEventService;
    @Mock private PasswordEncoder      passwordEncoder;
    @Mock private JwtService           jwtService;
    @Mock private TenantService        tenantService;

    @InjectMocks
    private UserService userService;

    // ── helpers ──────────────────────────────────────────────────────────────

    private Tenant tenant(long id) {
        Tenant t = new Tenant();
        t.setId(id);
        t.setName("Test Tenant");
        t.setPlan(Plan.FREE);
        t.setRateLimitPerMinute(60);
        return t;
    }

    private User user(long id, String username, Tenant t) {
        User u = new User();
        u.setId(id);
        u.setUsername(username);
        u.setPasswordHash("hashed");
        u.setStatus(Status.ACTIVE);
        u.setTenant(t);
        return u;
    }

    // ── register ─────────────────────────────────────────────────────────────

    @Test
    void register_shouldSucceed_whenUsernameAndEmailAreNew() {
        Tenant t = tenant(2L);
        when(userRepository.existsByUsername("elior")).thenReturn(false);
        when(userRepository.existsByEmail("elior@test.com")).thenReturn(false);
        when(tenantService.createTenant(anyString(), any())).thenReturn(t);
        when(passwordEncoder.encode("Secret123!")).thenReturn("hashed");
        when(userRepository.save(any())).thenReturn(user(1L, "elior", t));
        when(jwtService.generateToken(anyLong(), anyString(), anyLong(), anyInt())).thenReturn("token123");

        AuthResponse response = userService.register(
                new RegisterRequest("elior", "elior@test.com", "Secret123!"), "127.0.0.1");

        assertThat(response.username()).isEqualTo("elior");
        assertThat(response.token()).isEqualTo("token123");
    }

    @Test
    void register_shouldThrow_whenUsernameExists() {
        when(userRepository.existsByUsername("elior")).thenReturn(true);
        assertThatThrownBy(() -> userService.register(
                new RegisterRequest("elior", "elior@test.com", "Secret123!"), "127.0.0.1"))
                .isInstanceOf(UsernameAlreadyExistsException.class);
    }

    @Test
    void register_shouldThrow_whenEmailExists() {
        when(userRepository.existsByUsername("elior")).thenReturn(false);
        when(userRepository.existsByEmail("elior@test.com")).thenReturn(true);
        assertThatThrownBy(() -> userService.register(
                new RegisterRequest("elior", "elior@test.com", "Secret123!"), "127.0.0.1"))
                .isInstanceOf(EmailAlreadyExistsException.class);
    }

    // ── login ────────────────────────────────────────────────────────────────

    @Test
    void login_shouldSucceed_withCorrectCredentials() {
        Tenant t = tenant(2L);
        User u = user(1L, "elior", t);
        when(userRepository.findByUsername("elior")).thenReturn(Optional.of(u));
        when(passwordEncoder.matches("Secret123!", "hashed")).thenReturn(true);
        when(jwtService.generateToken(anyLong(), anyString(), anyLong(), anyInt())).thenReturn("token123");

        AuthResponse response = userService.login(
                new LoginRequest("elior", "Secret123!"), "127.0.0.1", "/api/auth/login");

        assertThat(response.username()).isEqualTo("elior");
        assertThat(response.token()).isEqualTo("token123");
    }

    @Test
    void login_shouldThrow_whenUserNotFound() {
        when(userRepository.findByUsername("unknown")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> userService.login(
                new LoginRequest("unknown", "Secret123!"), "127.0.0.1", "/api/auth/login"))
                .isInstanceOf(InvalidCredentialsException.class);
    }

    @Test
    void login_shouldThrow_whenPasswordWrong() {
        Tenant t = tenant(2L);
        User u = user(1L, "elior", t);
        when(userRepository.findByUsername("elior")).thenReturn(Optional.of(u));
        when(passwordEncoder.matches("wrong", "hashed")).thenReturn(false);
        assertThatThrownBy(() -> userService.login(
                new LoginRequest("elior", "wrong"), "127.0.0.1", "/api/auth/login"))
                .isInstanceOf(InvalidCredentialsException.class);
    }
}