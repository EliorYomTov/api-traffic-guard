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
