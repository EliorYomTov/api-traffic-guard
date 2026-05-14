package com.trafficguard.controller;

import com.trafficguard.domain.SecurityEvent;
import com.trafficguard.domain.SecurityEvent.EventType;
import com.trafficguard.repository.SecurityEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/events")
@RequiredArgsConstructor
public class SecurityEventController {

    private final SecurityEventRepository securityEventRepository;

    // GET /api/admin/events?limit=20
    @GetMapping
    public ResponseEntity<List<SecurityEvent>> getRecentEvents(@RequestParam(defaultValue = "20") int limit) {
        return ResponseEntity.ok(securityEventRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(0, limit)));
    }

    // GET /api/admin/events/type/RATE_LIMIT_EXCEEDED
    @GetMapping("/type/{eventType}")
    public ResponseEntity<List<SecurityEvent>> getByType(@PathVariable EventType eventType) {
        return ResponseEntity.ok(securityEventRepository.findByEventType(eventType));
    }

    // GET /api/admin/events/ip/1.2.3.4
    @GetMapping("/ip/{ip}")
    public ResponseEntity<List<SecurityEvent>> getByIp(@PathVariable String ip) {
        return ResponseEntity.ok(securityEventRepository.findByIpAddress(ip));
    }

    // GET /api/admin/events/user/1
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<SecurityEvent>> getByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(securityEventRepository.findByUserId(userId));
    }
}