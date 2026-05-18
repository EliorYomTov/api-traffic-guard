import { useQuery } from '@tanstack/react-query';
import { fetchThreatComposition } from '../api/metrics';
import type { TimeRangeCode } from '../api/types';

export function useMetricsThreatComposition(range: TimeRangeCode = '7d') {
    return useQuery({
        queryKey: ['metrics', 'threat-composition', range],
        queryFn: () => fetchThreatComposition(range),
    });
}