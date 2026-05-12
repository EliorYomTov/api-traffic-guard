package com.trafficguard.dto.response;

public record AuthResponse(String message, String username, Long userId) {
    /**
     * Convenience factory for success responses without a user context
     * (e.g. registration confirmation).
     */
    public static AuthResponse success(String message) {
        return new AuthResponse(message, null, null);
    }

    /**
     * Convenience factory for successful authentication.
     */
    public static AuthResponse authenticated(String username, Long userId) {
        return new AuthResponse("Authentication successful", username, userId);
    }
}