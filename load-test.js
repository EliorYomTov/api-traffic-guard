import http from 'k6/http';
import { sleep, check } from 'k6';
import { Counter } from 'k6/metrics';

// Custom metrics
const rateLimitedRequests = new Counter('rate_limited_requests');
const blockedRequests = new Counter('blocked_requests');
const successfulRequests = new Counter('successful_requests');

const BASE_URL = 'http://localhost:8080';
const USER_COUNT = 20;

export const options = {
    stages: [
        { duration: '30s', target: 5 },
        { duration: '60s', target: 20 },
        { duration: '30s', target: 0 },
    ],
    thresholds: {
        http_req_duration: ['p(95)<500'],
        successful_requests: ['count>100'],
        rate_limited_requests: ['count>0'],
    },
};

export function setup() {
    const tokens = [];

    for (let i = 0; i < USER_COUNT; i++) {
        const username = `loaduser_${i}`;
        const password = 'Test1234!';
        const email = `loaduser_${i}@test.com`;

        http.post(`${BASE_URL}/api/auth/register`,
            JSON.stringify({ username, password, email }),
            { headers: { 'Content-Type': 'application/json' } }
        );

        const res = http.post(`${BASE_URL}/api/auth/login`,
            JSON.stringify({ username, password }),
            { headers: { 'Content-Type': 'application/json' } }
        );

        const token = res.json('token');
        if (!token) {
            console.error(`Failed to get token for ${username}`);
        }
        tokens.push(token);
    }

    console.log(`Setup complete: ${tokens.filter(t => t).length}/${USER_COUNT} tokens acquired`);
    return { tokens };
}

export default function (data) {
    // Each VU gets its own dedicated user — no sharing
    const vuIndex = (__VU - 1) % USER_COUNT;
    const token = data.tokens[vuIndex];

    if (!token) {
        console.error(`VU ${__VU} has no token at index ${vuIndex}`);
        return;
    }

    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
    };

    const res = http.get(`${BASE_URL}/api/users/me`, { headers });

    if (res.status === 200) {
        successfulRequests.add(1);
    } else if (res.status === 429) {
        rateLimitedRequests.add(1);
    } else if (res.status === 403) {
        blockedRequests.add(1);
    }

    check(res, {
        'status is 200, 429, or 403': (r) => [200, 429, 403].includes(r.status),
        'response time < 500ms': (r) => r.timings.duration < 500,
    });

    // Human-like pacing — 1 request per second per user
    sleep(1);
}

export function handleSummary(data) {
    const total = data.metrics.http_reqs.values.count;
    const successful = data.metrics.successful_requests?.values.count || 0;
    const rateLimited = data.metrics.rate_limited_requests?.values.count || 0;
    const blocked = data.metrics.blocked_requests?.values.count || 0;

    console.log('\n========== Traffic Guard Summary ==========');
    console.log(`Total requests:      ${total}`);
    console.log(`Successful (200):    ${successful} (${((successful / total) * 100).toFixed(1)}%)`);
    console.log(`Rate limited (429):  ${rateLimited} (${((rateLimited / total) * 100).toFixed(1)}%)`);
    console.log(`IP blocked (403):    ${blocked} (${((blocked / total) * 100).toFixed(1)}%)`);
    console.log(`Avg response time:   ${data.metrics.http_req_duration.values.avg.toFixed(0)}ms`);
    console.log(`p95 response time:   ${data.metrics.http_req_duration.values['p(95)'].toFixed(0)}ms`);
    console.log('===========================================\n');

    return {};
}