package com.trafficguard.service;

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
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private SecurityEventService securityEventService;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private JwtService jwtService;

    @InjectMocks
    private UserService userService;

    @Test
    void register_shouldSucceed_whenUsernameAndEmailAreNew() {
        when(userRepository.existsByUsername("elior")).thenReturn(false);
        when(userRepository.existsByEmail("elior@test.com")).thenReturn(false);
        when(passwordEncoder.encode("Secret123!")).thenReturn("hashed");
        when(jwtService.generateToken(any(), any())).thenReturn("token123");
        User saved = new User();
        saved.setId(1L);
        saved.setUsername("elior");
        saved.setStatus(Status.ACTIVE);
        when(userRepository.save(any())).thenReturn(saved);
        RegisterRequest request = new RegisterRequest("elior", "elior@test.com", "Secret123!");
        AuthResponse response = userService.register(request, "127.0.0.1");
        assertThat(response.username()).isEqualTo("elior");
        assertThat(response.token()).isEqualTo("token123");
    }

    @Test
    void register_shouldThrow_whenUsernameExists() {
        when(userRepository.existsByUsername("elior")).thenReturn(true);
        RegisterRequest request = new RegisterRequest("elior", "elior@test.com", "Secret123!");
        assertThatThrownBy(() -> userService.register(request, "127.0.0.1"))
                .isInstanceOf(UsernameAlreadyExistsException.class);
    }

    @Test
    void register_shouldThrow_whenEmailExists() {
        when(userRepository.existsByUsername("elior")).thenReturn(false);
        when(userRepository.existsByEmail("elior@test.com")).thenReturn(true);
        RegisterRequest request = new RegisterRequest("elior", "elior@test.com", "Secret123!");
        assertThatThrownBy(() -> userService.register(request, "127.0.0.1")).isInstanceOf(EmailAlreadyExistsException.class);
    }

    @Test
    void login_shouldSucceed_withCorrectCredentials() {
        User user = new User();
        user.setId(1L);
        user.setUsername("elior");
        user.setPasswordHash("hashed");
        when(userRepository.findByUsername("elior")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("Secret123!", "hashed")).thenReturn(true);
        when(jwtService.generateToken(1L, "elior")).thenReturn("token123");
        LoginRequest request = new LoginRequest("elior", "Secret123!");
        AuthResponse response = userService.login(request, "127.0.0.1", "/api/auth/login");
        assertThat(response.username()).isEqualTo("elior");
        assertThat(response.token()).isEqualTo("token123");
    }

    @Test
    void login_shouldThrow_whenUserNotFound() {
        when(userRepository.findByUsername("unknown")).thenReturn(Optional.empty());
        LoginRequest request = new LoginRequest("unknown", "Secret123!");
        assertThatThrownBy(() -> userService.login(request, "127.0.0.1", "/api/auth/login")).isInstanceOf(InvalidCredentialsException.class);
    }

    @Test
    void login_shouldThrow_whenPasswordWrong() {
        User user = new User();
        user.setId(1L);
        user.setUsername("elior");
        user.setPasswordHash("hashed");
        when(userRepository.findByUsername("elior")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", "hashed")).thenReturn(false);
        LoginRequest request = new LoginRequest("elior", "wrong");
        assertThatThrownBy(() -> userService.login(request, "127.0.0.1", "/api/auth/login")).isInstanceOf(InvalidCredentialsException.class);
    }
}