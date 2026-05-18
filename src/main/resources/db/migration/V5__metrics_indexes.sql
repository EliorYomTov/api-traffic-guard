-- Composite index for tenant-scoped time-range queries.
-- All metrics endpoints filter by tenant_id and order/filter by created_at,
-- so this index supports the entire /api/v1/metrics/* family.
CREATE INDEX IF NOT EXISTS idx_security_events_tenant_created
    ON security_events (tenant_id, created_at DESC);

-- Index for status-code aggregations and threat composition queries
-- that GROUP BY event_type within a tenant + time range.
CREATE INDEX IF NOT EXISTS idx_security_events_tenant_type_created
    ON security_events (tenant_id, event_type, created_at DESC);

-- Index for endpoint and IP aggregations.
-- Partial index — only index rows where endpoint/ip is present.
CREATE INDEX IF NOT EXISTS idx_security_events_tenant_endpoint
    ON security_events (tenant_id, endpoint)
    WHERE endpoint IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_security_events_tenant_ip
    ON security_events (tenant_id, ip_address)
    WHERE ip_address IS NOT NULL;