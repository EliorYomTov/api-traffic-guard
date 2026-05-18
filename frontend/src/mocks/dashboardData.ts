export const kpiData = {
    totalRequests:  { value: 60847, delta: 12.6,  trend: [5200,7100,6400,9800,11200,8900,12100] },
    blocked:        { value: 1247,  delta: 8.2,   trend: [120,180,210,190,280,310,287] },
    rateLimitHits:  { value: 432,   delta: -4.1,  trend: [80,75,68,65,62,58,61] },
    avgLatencyMs:   { value: 42,    delta: -6.8,  trend: [44,42,45,41,40,42,42] },
}

export const requestVolumeData = [
    { month: 'JAN', allowed: 22000, blocked: 8000  },
    { month: 'FEB', allowed: 31000, blocked: 12000 },
    { month: 'MAR', allowed: 38000, blocked: 9000  },
    { month: 'APR', allowed: 28000, blocked: 14000 },
    { month: 'MAY', allowed: 35000, blocked: 11000 },
    { month: 'JUN', allowed: 43000, blocked: 13000 },
    { month: 'JUL', allowed: 49000, blocked: 10000 },
    { month: 'AUG', allowed: 44000, blocked: 16000 },
    { month: 'SEP', allowed: 36000, blocked: 12000 },
    { month: 'OCT', allowed: 42000, blocked: 9000  },
    { month: 'NOV', allowed: 50000, blocked: 14000 },
    { month: 'DEC', allowed: 60000, blocked: 11000 },
]

export const statusCodeData = [
    { label: '2xx', value: 47432, pct: 78, color: '#22c55e' },
    { label: '3xx', value: 2433,  pct: 4,  color: '#3b82f6' },
    { label: '4xx', value: 8522,  pct: 14, color: '#f59e0b' },
    { label: '5xx', value: 2433,  pct: 4,  color: '#ef4444' },
]

export const trafficByDayData = [
    { day: 'MON', allowed: 14800, blocked: 16200 },
    { day: 'TUE', allowed: 19200, blocked: 14800 },
    { day: 'WED', allowed: 16500, blocked: 18400 },
    { day: 'THU', allowed: 10200, blocked: 15800 },
    { day: 'FRI', allowed: 13800, blocked: 6200  },
    { day: 'SAT', allowed: 18600, blocked: 12400 },
    { day: 'SUN', allowed: 7200,  blocked: 9100  },
]

export const rateLimitUsage = {
    pct: 78,
    used: 46800,
    remaining: 13200,
    resetsInSec: 23,
    quota: 60000,
}

export const topEndpoints = [
    { path: '/auth/login',   count: 18200 },
    { path: '/users',        count: 12400 },
    { path: '/products',     count: 9100  },
    { path: '/orders',       count: 6800  },
    { path: '/search',       count: 4200  },
    { path: '/health',       count: 2100  },
]

export const threatData = [
    { day: 'Mon', bruteForce: 120, rateLimit: 80,  badKey: 40 },
    { day: 'Tue', bruteForce: 180, rateLimit: 95,  badKey: 30 },
    { day: 'Wed', bruteForce: 150, rateLimit: 110, badKey: 55 },
    { day: 'Thu', bruteForce: 220, rateLimit: 90,  badKey: 45 },
    { day: 'Fri', bruteForce: 280, rateLimit: 140, badKey: 60 },
    { day: 'Sat', bruteForce: 190, rateLimit: 75,  badKey: 25 },
    { day: 'Sun', bruteForce: 210, rateLimit: 85,  badKey: 35 },
]

export const blockedIPs = [
    { ip: '192.168.1.42', type: 'Brute force', country: 'IL', attempts: 847, color: '#ef4444' },
    { ip: '10.0.0.115',   type: 'Rate limit',  country: 'US', attempts: 521, color: '#f59e0b' },
    { ip: '172.16.8.99',  type: 'Brute force', country: 'RU', attempts: 312, color: '#ef4444' },
    { ip: '203.0.113.5',  type: 'Bad key',     country: 'CN', attempts: 198, color: '#a78bfa' },
]

export const securityEvents = [
    { time: '2 min ago',  event: 'Rate limit exceeded',  ip: '192.168.1.42', endpoint: '/auth/login', apiKey: 'prod_xkv...', severity: 'WARNING'  },
    { time: '5 min ago',  event: 'Brute force detected', ip: '10.0.0.115',   endpoint: '/auth/login', apiKey: '—',           severity: 'CRITICAL' },
    { time: '12 min ago', event: 'IP blocked',           ip: '172.16.8.99',  endpoint: '/users',      apiKey: 'dev_4kj...', severity: 'CRITICAL' },
    { time: '28 min ago', event: 'Invalid API key',      ip: '203.0.113.5',  endpoint: '/products',   apiKey: 'invalid',    severity: 'INFO'     },
    { time: '1h ago',     event: 'New API key created',  ip: '—',            endpoint: '/api-keys',   apiKey: 'prod_xkv...', severity: 'SUCCESS'  },
]