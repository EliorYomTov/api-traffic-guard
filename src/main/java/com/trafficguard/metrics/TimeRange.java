package com.trafficguard.metrics;

import lombok.Getter;

import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

public enum TimeRange {
    HOURS_24(Duration.ofHours(24), "24h", 24, ChronoUnit.HOURS),
    DAYS_7  (Duration.ofDays(7),   "7d",   7, ChronoUnit.DAYS),
    DAYS_30 (Duration.ofDays(30),  "30d", 30, ChronoUnit.DAYS);

    private final Duration   duration;
    @Getter private final String     code;
    @Getter private final int        steps;
    @Getter private final ChronoUnit unit;

    TimeRange(Duration duration, String code, int steps, ChronoUnit unit) {
        this.duration = duration;
        this.code     = code;
        this.steps    = steps;
        this.unit     = unit;
    }

    public Instant since(Instant now) {
        return now.minus(duration);
    }

    public static TimeRange fromCode(String code) {
        if (code == null || code.isBlank()) return DAYS_7;
        for (TimeRange r : values()) {
            if (r.code.equalsIgnoreCase(code)) return r;
        }
        return DAYS_7;
    }
}