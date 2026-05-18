import {useQuery} from '@tanstack/react-query';
import {fetchTopBlockedIps} from '../api/metrics';
import type {TimeRangeCode} from '../api/types';

export function useMetricsTopBlockedIps(range: TimeRangeCode = '7d') {
    return useQuery({
        queryKey: ['metrics', 'top-blocked-ips', range],
        queryFn: () => fetchTopBlockedIps(range),
    });
}