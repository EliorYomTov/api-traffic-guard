import client from './client';
import type {
    OverviewResponse,
    RateLimitUsageResponse,
    StatusCodesResponse,
    ThreatCompositionResponse,
    TimeRangeCode,
    TimeseriesResponse,
    TopBlockedIpsResponse,
    TopEndpointsResponse
} from './types';

export async function fetchOverview(range: TimeRangeCode = '7d'): Promise<OverviewResponse> {
    const {data} = await client.get<OverviewResponse>('/api/v1/metrics/overview', {params: {range},});
    return data;
}

export async function fetchTimeseries(range: TimeRangeCode = '7d'): Promise<TimeseriesResponse> {
    const {data} = await client.get<TimeseriesResponse>('/api/v1/metrics/timeseries', {params: {range},});
    return data;
}

export async function fetchStatusCodes(range: TimeRangeCode = '7d'): Promise<StatusCodesResponse> {
    const {data} = await client.get<StatusCodesResponse>('/api/v1/metrics/status-codes', {params: {range},});
    return data;
}

export async function fetchTopEndpoints(range: TimeRangeCode = '7d'): Promise<TopEndpointsResponse> {
    const {data} = await client.get<TopEndpointsResponse>('/api/v1/metrics/top-endpoints', {params: {range},});
    return data;
}

export async function fetchThreatComposition(range: TimeRangeCode = '7d'): Promise<ThreatCompositionResponse> {
    const {data} = await client.get<ThreatCompositionResponse>('/api/v1/metrics/threat-composition', {params: {range},});
    return data;
}

export async function fetchTopBlockedIps(range: TimeRangeCode = '7d'): Promise<TopBlockedIpsResponse> {
    const {data} = await client.get<TopBlockedIpsResponse>('/api/v1/metrics/top-blocked-ips', {params: {range},});
    return data;
}

export async function fetchRateLimitUsage(): Promise<RateLimitUsageResponse> {
    const {data} = await client.get<RateLimitUsageResponse>('/api/v1/metrics/rate-limit-usage');
    return data;
}