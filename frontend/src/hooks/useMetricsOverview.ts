import { useQuery } from '@tanstack/react-query';
import { fetchOverview } from '../api/metrics';
import type { TimeRangeCode } from '../api/types';

export function useMetricsOverview(range: TimeRangeCode = '7d') {
    return useQuery({
        queryKey: ['metrics', 'overview', range],
        queryFn: () => fetchOverview(range),
    });
}