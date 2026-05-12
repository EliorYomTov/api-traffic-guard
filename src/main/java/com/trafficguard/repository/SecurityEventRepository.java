package com.trafficguard.repository;

import com.trafficguard.domain.SecurityEvent;
import com.trafficguard.domain.SecurityEvent.EventType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface SecurityEventRepository extends JpaRepository<SecurityEvent, Long> {

    List<SecurityEvent> findByIpAddress(String ipAddress);

    List<SecurityEvent> findByUserId(Long userId);

    List<SecurityEvent> findByEventType(EventType eventType);

    long countByUserIdAndEventTypeAndCreatedAtAfter(Long userId, EventType eventType, Instant after);

    long countByIpAddressAndEventTypeAndCreatedAtAfter(String ipAddress, EventType eventType, Instant after);
}