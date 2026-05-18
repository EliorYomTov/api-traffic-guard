import { useQuery } from '@tanstack/react-query';
import { fetchTopEndpoints } from '../api/metrics';
import type { TimeRangeCode } from '../api/types';

export function useMetricsTopEndpoints(range: TimeRangeCode = '7d') {
    return useQuery({
        queryKey: ['metrics', 'top-endpoints', range],
        queryFn: () => fetchTopEndpoints(range),
    });
}