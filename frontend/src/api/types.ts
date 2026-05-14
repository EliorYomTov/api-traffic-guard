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

export interface SecurityEvent {
    id: number;
    eventType: string;
    ipAddress: string;
    endpoint?: string;
    statusCode?: number;
    createdAt: string;
}

export interface TenantInfo {
    id: number;
    name: string;
    plan: 'FREE' | 'PRO' | 'ENTERPRISE';
    rateLimitPerMinute: number;
}