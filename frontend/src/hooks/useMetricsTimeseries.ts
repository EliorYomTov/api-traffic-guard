import { useQuery } from '@tanstack/react-query';
import { fetchTimeseries } from '../api/metrics';
import type { TimeRangeCode } from '../api/types';

export function useMetricsTimeseries(range: TimeRangeCode = '7d') {
    return useQuery({
        queryKey: ['metrics', 'timeseries', range],
        queryFn: () => fetchTimeseries(range),
    });
}