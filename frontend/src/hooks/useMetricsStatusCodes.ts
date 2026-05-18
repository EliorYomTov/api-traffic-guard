import { useQuery } from '@tanstack/react-query';
import { fetchStatusCodes } from '../api/metrics';
import type { TimeRangeCode } from '../api/types';

export function useMetricsStatusCodes(range: TimeRangeCode = '7d') {
    return useQuery({
        queryKey: ['metrics', 'status-codes', range],
        queryFn: () => fetchStatusCodes(range),
    });
}