package com.trafficguard.metrics;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

class MetricsServiceTest {

    @Test
    void percentDelta_returnsNull_whenPreviousIsZero() {
        assertThat(MetricsService.percentDelta(50, 0)).isNull();
        assertThat(MetricsService.percentDelta(0, 0)).isNull();
    }

    @Test
    void percentDelta_positiveChange() {
        assertThat(MetricsService.percentDelta(110, 100)).isEqualTo(10.0);
        assertThat(MetricsService.percentDelta(150, 100)).isEqualTo(50.0);
    }

    @Test
    void percentDelta_negativeChange() {
        assertThat(MetricsService.percentDelta(80, 100)).isEqualTo(-20.0);
    }

    @Test
    void percentDelta_roundsToOneDecimal() {
        // 33/100 = 33.0% → 33.0
        assertThat(MetricsService.percentDelta(133, 100)).isEqualTo(33.0);
        // 1/3 = 33.333...% → 33.3
        assertThat(MetricsService.percentDelta(4, 3)).isEqualTo(33.3);
    }
}