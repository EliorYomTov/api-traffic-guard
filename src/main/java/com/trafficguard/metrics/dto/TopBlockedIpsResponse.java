package com.trafficguard.metrics.dto;

import java.util.List;

/**
 * Most frequently blocked IP addresses.
 */
public record TopBlockedIpsResponse(String range, List<BlockedIpEntry> ips) {
    /**
     * @param ipAddress  the blocked IP
     * @param attempts   number of block events recorded
     * @param eventType  most recent block reason (IP_BLOCKED or USER_BLOCKED)
     */
    public record BlockedIpEntry(
            String ipAddress,
            long attempts,
            String eventType
    ) {}
}