export interface AuthResponse {
    token: string;
    username: string;
    userId: number;
    message: string;
}

export interface ApiKey {
    id: number;
    prefix: string;
    name: string;
    plaintext?: string;
    active: boolean;
    lastUsedAt?: string;
    createdAt: string;
}

// Legacy type — kept for backward compat if used elsewhere
export interface SecurityEvent {
    id: number;
    eventType: string;
    ipAddress: string;
    endpoint?: string;
    statusCode?: number;
    createdAt: string;
}

// New — matches SecurityEventResponse.java
export interface SecurityEventResponse {
    id: number;
    createdAt: string;           // ISO-8601 from Instant
    eventType: string;           // LOGIN_FAILURE | IP_BLOCKED | ...
    severity: 'CRITICAL' | 'WARNING' | 'SUCCESS' | 'INFO';
    ipAddress: string;
    endpoint: string | null;
    statusCode: number | null;
}

// New — matches PagedEventsResponse.java
export interface PagedEventsResponse {
    content:       SecurityEventResponse[];
    page:          number;
    size:          number;
    totalElements: number;
    totalPages:    number;
    last:          boolean;
}

export interface TenantInfo {
    id: number;
    name: string;
    plan: 'FREE' | 'PRO' | 'ENTERPRISE';
    rateLimitPerMinute: number;
}

// Query params for GET /api/v1/events
export interface EventsQueryParams {
    page?:      number;
    size?:      number;
    severity?:  'CRITICAL' | 'WARNING' | 'SUCCESS' | 'INFO';
    eventType?: string;
}

export type TimeRangeCode = '24h' | '7d' | '30d';

export interface OverviewResponse {
    totalRequests: number;
    totalRequestsDelta: number | null;
    blockedRequests: number;
    blockedRequestsDelta: number | null;
    rateLimitHits: number;
    rateLimitHitsDelta: number | null;
    avgResponseTimeMs: number | null;
    range: TimeRangeCode;
}

export interface TimeseriesDataPoint {
    label: string;
    allowed: number;
    blocked: number;
}

export interface TimeseriesResponse {
    range: TimeRangeCode;
    points: TimeseriesDataPoint[];
}

export interface StatusCodeBucket {
    label: string;
    count: number;
    pct: number;
    color: string;
}

export interface StatusCodesResponse {
    range: TimeRangeCode;
    total: number;
    buckets: StatusCodeBucket[];
}

export interface TopEndpointEntry {
    path: string;
    count: number;
}

export interface TopEndpointsResponse {
    range: TimeRangeCode;
    endpoints: TopEndpointEntry[];
}

export interface ThreatDataPoint {
    label: string;
    bruteForce: number;
    rateLimit: number;
    badKey: number;
}

export interface ThreatCompositionResponse {
    range: TimeRangeCode;
    points: ThreatDataPoint[];
}

export interface BlockedIpEntry {
    ipAddress: string;
    attempts: number;
}

export interface TopBlockedIpsResponse {
    range: TimeRangeCode;
    ips: BlockedIpEntry[];
}

export interface BlockedIpEntry {
    ipAddress: string;
    attempts: number;
    eventType: string;
}

export interface RateLimitUsageResponse {
    used: number;
    limit: number;
    remaining: number;
    pct: number;
    resetsInSec: number;
}
