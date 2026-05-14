package com.trafficguard.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateApiKeyRequest(

        @NotBlank(message = "Key name is required")
        @Size(max = 100, message = "Key name must be 100 characters or less")
        String name) {
}