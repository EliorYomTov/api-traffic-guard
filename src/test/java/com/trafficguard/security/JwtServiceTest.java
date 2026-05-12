package com.trafficguard.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;

class JwtServiceTest {

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secretKey",
                "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970");
        ReflectionTestUtils.setField(jwtService, "expiration", 86400000L);
    }

    @Test
    void generateToken_shouldContainUsername() {
        String token = jwtService.generateToken(1L, "elior");
        assertThat(jwtService.extractUsername(token)).isEqualTo("elior");
    }

    @Test
    void generateToken_shouldContainUserId() {
        String token = jwtService.generateToken(1L, "elior");
        assertThat(jwtService.extractUserId(token)).isEqualTo(1L);
    }

    @Test
    void isTokenValid_shouldReturnTrue_forValidToken() {
        String token = jwtService.generateToken(1L, "elior");
        assertThat(jwtService.isTokenValid(token)).isTrue();
    }

    @Test
    void isTokenValid_shouldReturnFalse_forTamperedToken() {
        String token = jwtService.generateToken(1L, "elior");
        String tampered = token.substring(0, token.length() - 5) + "XXXXX";
        assertThat(jwtService.isTokenValid(tampered)).isFalse();
    }

    @Test
    void isTokenValid_shouldReturnFalse_forExpiredToken() {
        ReflectionTestUtils.setField(jwtService, "expiration", -1000L);
        String token = jwtService.generateToken(1L, "elior");
        assertThat(jwtService.isTokenValid(token)).isFalse();
    }
}