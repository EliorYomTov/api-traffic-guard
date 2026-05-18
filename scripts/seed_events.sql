-- Seed script: realistic security events for elior (tenant_id=2)
-- Run with:
-- docker exec -i $(docker ps -q --filter "name=postgres") psql -U trafficguard -d trafficguard < seed_events.sql

DO $$
DECLARE
    tid BIGINT := 2;  -- elior's tenant_id
BEGIN

-- ── Last 7 days — mixed events ───────────────────────────────────────────────

-- LOGIN_FAILURE bursts (brute force simulation)
INSERT INTO security_events (tenant_id, user_id, event_type, ip_address, endpoint, status_code, created_at) VALUES
(tid, 104, 'LOGIN_FAILURE', '192.168.1.42', '/api/auth/login', 401, NOW() - INTERVAL '2 minutes'),
(tid, 104, 'LOGIN_FAILURE', '192.168.1.42', '/api/auth/login', 401, NOW() - INTERVAL '3 minutes'),
(tid, 104, 'LOGIN_FAILURE', '192.168.1.42', '/api/auth/login', 401, NOW() - INTERVAL '4 minutes'),
(tid, 104, 'LOGIN_FAILURE', '192.168.1.42', '/api/auth/login', 401, NOW() - INTERVAL '5 minutes'),
(tid, NULL, 'LOGIN_FAILURE', '10.0.0.115',   '/api/auth/login', 401, NOW() - INTERVAL '8 minutes'),
(tid, NULL, 'LOGIN_FAILURE', '10.0.0.115',   '/api/auth/login', 401, NOW() - INTERVAL '9 minutes'),
(tid, NULL, 'LOGIN_FAILURE', '10.0.0.115',   '/api/auth/login', 401, NOW() - INTERVAL '10 minutes'),

-- IP_BLOCKED
(tid, NULL, 'IP_BLOCKED',         '10.0.0.115',   '/api/auth/login', 403, NOW() - INTERVAL '12 minutes'),
(tid, NULL, 'IP_BLOCKED',         '172.16.8.99',  '/api/v1/api-keys', 403, NOW() - INTERVAL '1 hour'),
(tid, NULL, 'IP_BLOCKED',         '203.0.113.5',  '/api/v1/events',   403, NOW() - INTERVAL '3 hours'),

-- RATE_LIMIT_EXCEEDED
(tid, 104, 'RATE_LIMIT_EXCEEDED', '192.168.1.42', '/api/auth/login',   429, NOW() - INTERVAL '25 minutes'),
(tid, 104, 'RATE_LIMIT_EXCEEDED', '192.168.1.42', '/api/v1/api-keys',  429, NOW() - INTERVAL '45 minutes'),
(tid, NULL, 'RATE_LIMIT_EXCEEDED','10.0.0.115',   '/api/v1/events',    429, NOW() - INTERVAL '2 hours'),
(tid, NULL, 'RATE_LIMIT_EXCEEDED','198.51.100.7', '/api/auth/login',   429, NOW() - INTERVAL '4 hours'),
(tid, NULL, 'RATE_LIMIT_EXCEEDED','198.51.100.7', '/api/auth/login',   429, NOW() - INTERVAL '4 hours 5 minutes'),

-- LOGIN_SUCCESS
(tid, 104, 'LOGIN_SUCCESS', '82.166.10.55',  '/api/auth/login', 200, NOW() - INTERVAL '30 minutes'),
(tid, 104, 'LOGIN_SUCCESS', '82.166.10.55',  '/api/auth/login', 200, NOW() - INTERVAL '2 hours'),
(tid, 104, 'LOGIN_SUCCESS', '82.166.10.55',  '/api/auth/login', 200, NOW() - INTERVAL '5 hours'),
(tid, 104, 'LOGIN_SUCCESS', '82.166.10.55',  '/api/auth/login', 200, NOW() - INTERVAL '1 day'),
(tid, 104, 'LOGIN_SUCCESS', '82.166.10.55',  '/api/auth/login', 200, NOW() - INTERVAL '2 days'),

-- USER_BLOCKED / USER_UNBLOCKED
(tid, 104, 'USER_BLOCKED',   '0:0:0:0:0:0:0:1', '/api/admin/users/block',   403, NOW() - INTERVAL '6 hours'),
(tid, 104, 'USER_UNBLOCKED', '0:0:0:0:0:0:0:1', '/api/admin/users/unblock', 200, NOW() - INTERVAL '5 hours 30 minutes'),

-- More LOGIN_FAILURE spread over last week
(tid, NULL, 'LOGIN_FAILURE', '185.220.101.3', '/api/auth/login', 401, NOW() - INTERVAL '1 day 2 hours'),
(tid, NULL, 'LOGIN_FAILURE', '185.220.101.3', '/api/auth/login', 401, NOW() - INTERVAL '1 day 2 hours 1 minute'),
(tid, NULL, 'LOGIN_FAILURE', '185.220.101.3', '/api/auth/login', 401, NOW() - INTERVAL '1 day 2 hours 2 minutes'),
(tid, NULL, 'LOGIN_FAILURE', '185.220.101.3', '/api/auth/login', 401, NOW() - INTERVAL '1 day 2 hours 3 minutes'),
(tid, NULL, 'IP_BLOCKED',    '185.220.101.3', '/api/auth/login', 403, NOW() - INTERVAL '1 day 2 hours 4 minutes'),

(tid, NULL, 'LOGIN_FAILURE', '91.108.4.200',  '/api/auth/login', 401, NOW() - INTERVAL '2 days 4 hours'),
(tid, NULL, 'LOGIN_FAILURE', '91.108.4.200',  '/api/auth/login', 401, NOW() - INTERVAL '2 days 4 hours 30 seconds'),
(tid, NULL, 'RATE_LIMIT_EXCEEDED', '91.108.4.200', '/api/auth/login', 429, NOW() - INTERVAL '2 days 5 hours'),

(tid, NULL, 'LOGIN_FAILURE', '77.88.55.88',   '/api/auth/login', 401, NOW() - INTERVAL '3 days 1 hour'),
(tid, NULL, 'LOGIN_FAILURE', '77.88.55.88',   '/api/auth/login', 401, NOW() - INTERVAL '3 days 1 hour 1 minute'),
(tid, NULL, 'IP_BLOCKED',    '77.88.55.88',   '/api/auth/login', 403, NOW() - INTERVAL '3 days 1 hour 2 minutes'),

(tid, 104, 'LOGIN_SUCCESS',  '82.166.10.55',  '/api/auth/login', 200, NOW() - INTERVAL '3 days'),
(tid, 104, 'LOGIN_SUCCESS',  '82.166.10.55',  '/api/auth/login', 200, NOW() - INTERVAL '4 days'),
(tid, 104, 'LOGIN_SUCCESS',  '82.166.10.55',  '/api/auth/login', 200, NOW() - INTERVAL '5 days'),
(tid, 104, 'LOGIN_SUCCESS',  '82.166.10.55',  '/api/auth/login', 200, NOW() - INTERVAL '6 days'),

(tid, NULL, 'RATE_LIMIT_EXCEEDED', '203.0.113.5',  '/api/v1/events',   429, NOW() - INTERVAL '4 days 3 hours'),
(tid, NULL, 'RATE_LIMIT_EXCEEDED', '198.51.100.22', '/api/auth/login', 429, NOW() - INTERVAL '5 days 2 hours'),
(tid, NULL, 'RATE_LIMIT_EXCEEDED', '198.51.100.22', '/api/v1/api-keys',429, NOW() - INTERVAL '5 days 2 hours 5 minutes'),
(tid, NULL, 'IP_BLOCKED',          '198.51.100.22', '/api/auth/login', 403, NOW() - INTERVAL '5 days 2 hours 10 minutes'),

(tid, NULL, 'LOGIN_FAILURE', '62.210.180.5',  '/api/auth/login', 401, NOW() - INTERVAL '6 days 5 hours'),
(tid, NULL, 'LOGIN_FAILURE', '62.210.180.5',  '/api/auth/login', 401, NOW() - INTERVAL '6 days 5 hours 1 minute'),
(tid, NULL, 'LOGIN_FAILURE', '62.210.180.5',  '/api/auth/login', 401, NOW() - INTERVAL '6 days 5 hours 2 minutes'),
(tid, NULL, 'IP_BLOCKED',    '62.210.180.5',  '/api/auth/login', 403, NOW() - INTERVAL '6 days 5 hours 3 minutes');

RAISE NOTICE 'Seeded % security events for tenant_id=%',
    (SELECT COUNT(*) FROM security_events WHERE tenant_id = tid), tid;

END $$;