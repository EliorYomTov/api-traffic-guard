import {useQuery} from '@tanstack/react-query';
import {fetchRateLimitUsage} from '../api/metrics';

export function useMetricsRateLimitUsage() {
    return useQuery({
        queryKey: ['metrics', 'rate-limit-usage'],
        queryFn: fetchRateLimitUsage,
        refetchInterval: 30_000,
    });
}