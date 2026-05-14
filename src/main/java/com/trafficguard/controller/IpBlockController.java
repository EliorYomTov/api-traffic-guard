package com.trafficguard.controller;

import com.trafficguard.service.IpBlockService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/admin/ip-block")
@RequiredArgsConstructor
public class IpBlockController {

    private final IpBlockService ipBlockService;

    // GET /api/admin/ip-block
    @GetMapping
    public ResponseEntity<Set<String>> getAllBlockedIps() {
        return ResponseEntity.ok(ipBlockService.getAllBlockedIps());
    }

    // POST /api/admin/ip-block
    // Body: {"ip": "1.2.3.4"}
    @PostMapping
    public ResponseEntity<Map<String, String>> blockIp(@RequestBody Map<String, String> body) {
        String ip = body.get("ip");
        ipBlockService.blockIp(ip);
        return ResponseEntity.ok(Map.of("message", "IP blocked", "ip", ip));
    }

    // POST /api/admin/ip-block/temporary
    // Body: {"ip": "1.2.3.4", "minutes": "30"}
    @PostMapping("/temporary")
    public ResponseEntity<Map<String, String>> blockIpTemporarily(@RequestBody Map<String, String> body) {
        String ip = body.get("ip");
        int minutes = Integer.parseInt(body.get("minutes"));
        ipBlockService.blockIpTemporarily(ip, Duration.ofMinutes(minutes));
        return ResponseEntity.ok(Map.of("message", "IP blocked temporarily", "ip", ip, "minutes", String.valueOf(minutes)));
    }

    // DELETE /api/admin/ip-block/{ip}
    @DeleteMapping("/{ip}")
    public ResponseEntity<Map<String, String>> unblockIp(@PathVariable String ip) {
        ipBlockService.unblockIp(ip);
        return ResponseEntity.ok(Map.of("message", "IP unblocked", "ip", ip));
    }
}