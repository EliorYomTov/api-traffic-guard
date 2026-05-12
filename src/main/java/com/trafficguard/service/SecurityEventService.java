package com.trafficguard.service;

import com.trafficguard.domain.SecurityEvent;
import com.trafficguard.domain.SecurityEvent.EventType;
import com.trafficguard.repository.SecurityEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SecurityEventService {

    private final SecurityEventRepository securityEventRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordEvent(Long userId, EventType eventType, String ipAddress, String endpoint, int statusCode) {
        SecurityEvent event = new SecurityEvent();
        event.setUserId(userId);
        event.setEventType(eventType);
        event.setIpAddress(ipAddress);
        event.setEndpoint(endpoint);
        event.setStatusCode(statusCode);
        securityEventRepository.save(event);
    }
}