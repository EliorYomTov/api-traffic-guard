package com.trafficguard.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class IpBlockService {

    private static final String BLOCK_KEY_PREFIX = "ip_block:";
    private static final String BLOCK_SET_KEY = "ip_block:all";

    private final StringRedisTemplate redis;

    public void blockIp(String ip) {
        redis.opsForValue().set(BLOCK_KEY_PREFIX + ip, "blocked");
        redis.opsForSet().add(BLOCK_SET_KEY, ip);
    }

    public void blockIpTemporarily(String ip, Duration duration) {
        redis.opsForValue().set(BLOCK_KEY_PREFIX + ip, "blocked", duration);
        redis.opsForSet().add(BLOCK_SET_KEY, ip);
    }

    public void unblockIp(String ip) {
        redis.delete(BLOCK_KEY_PREFIX + ip);
        redis.opsForSet().remove(BLOCK_SET_KEY, ip);
    }

    public boolean isBlocked(String ip) {
        return Boolean.TRUE.equals(redis.hasKey(BLOCK_KEY_PREFIX + ip));
    }

    public Set<String> getAllBlockedIps() {
        Set<String> ips = redis.opsForSet().members(BLOCK_SET_KEY);
        if (ips == null) return Set.of();
        return ips.stream()
                .filter(ip -> Boolean.TRUE.equals(redis.hasKey(BLOCK_KEY_PREFIX + ip)))
                .collect(Collectors.toSet());
    }
}