package com.trafficguard.metrics;

import com.trafficguard.metrics.dto.*;
import com.trafficguard.security.TenantPrincipal;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/metrics")
public class MetricsController {

    private final MetricsService metricsService;

    public MetricsController(MetricsService metricsService) {
        this.metricsService = metricsService;
    }

    @GetMapping("/overview")
    public OverviewResponse overview(@AuthenticationPrincipal TenantPrincipal principal, @RequestParam(value = "range", required = false) String range) {
        return metricsService.getOverview(principal.getTenantId(), TimeRange.fromCode(range));
    }

    @GetMapping("/timeseries")
    public TimeseriesResponse timeseries(@AuthenticationPrincipal TenantPrincipal principal, @RequestParam(value = "range", required = false) String range) {
        return metricsService.getTimeseries(principal.getTenantId(), TimeRange.fromCode(range));
    }

    @GetMapping("/status-codes")
    public StatusCodesResponse statusCodes(@AuthenticationPrincipal TenantPrincipal principal, @RequestParam(value = "range", required = false) String range) {
        return metricsService.getStatusCodes(
                principal.getTenantId(),
                TimeRange.fromCode(range));
    }

    @GetMapping("/top-endpoints")
    public TopEndpointsResponse topEndpoints(@AuthenticationPrincipal TenantPrincipal principal, @RequestParam(value = "range", required = false) String range) {
        return metricsService.getTopEndpoints(
                principal.getTenantId(),
                TimeRange.fromCode(range));
    }

    @GetMapping("/threat-composition")
    public ThreatCompositionResponse threatComposition(@AuthenticationPrincipal TenantPrincipal principal, @RequestParam(value = "range", required = false) String range) {
        return metricsService.getThreatComposition(
                principal.getTenantId(),
                TimeRange.fromCode(range));
    }

    @GetMapping("/top-blocked-ips")
    public TopBlockedIpsResponse topBlockedIps(@AuthenticationPrincipal TenantPrincipal principal, @RequestParam(value = "range", required = false) String range) {
        return metricsService.getTopBlockedIps(
                principal.getTenantId(),
                TimeRange.fromCode(range));
    }

    @GetMapping("/rate-limit-usage")
    public RateLimitUsageResponse rateLimitUsage(@AuthenticationPrincipal TenantPrincipal principal) {
        return metricsService.getRateLimitUsage(principal.getTenantId(), principal.getRateLimitPerMinute());
    }
}