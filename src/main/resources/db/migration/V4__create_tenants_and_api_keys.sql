-- ============================================================
-- V4: Multi-tenancy foundation
-- Creates tenants & api_keys, links users and security_events
-- to a default tenant for backward compatibility.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Tenants table
-- ------------------------------------------------------------
CREATE TABLE tenants (
                         id                    BIGSERIAL    PRIMARY KEY,
                         name                  VARCHAR(100) NOT NULL,
                         plan                  VARCHAR(20)  NOT NULL DEFAULT 'FREE',
                         rate_limit_per_minute INTEGER      NOT NULL DEFAULT 60,
                         created_at            TIMESTAMP    NOT NULL DEFAULT NOW(),
                         updated_at            TIMESTAMP    NOT NULL DEFAULT NOW(),

                         CONSTRAINT chk_tenant_plan       CHECK (plan IN ('FREE', 'PRO', 'ENTERPRISE')),
                         CONSTRAINT chk_tenant_rate_limit CHECK (rate_limit_per_minute > 0)
);

CREATE INDEX idx_tenants_plan ON tenants(plan);

-- ------------------------------------------------------------
-- 2. API Keys table
-- Stores only SHA-256 hash + prefix. Plaintext is never persisted.
-- ------------------------------------------------------------
CREATE TABLE api_keys (
                          id           BIGSERIAL    PRIMARY KEY,
                          tenant_id    BIGINT       NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
                          key_hash     VARCHAR(64)  NOT NULL UNIQUE,
                          key_prefix   VARCHAR(20)  NOT NULL,
                          name         VARCHAR(100) NOT NULL,
                          last_used_at TIMESTAMP,
                          revoked_at   TIMESTAMP,
                          created_at   TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_api_keys_tenant ON api_keys(tenant_id);
CREATE INDEX idx_api_keys_hash   ON api_keys(key_hash) WHERE revoked_at IS NULL;
CREATE INDEX idx_api_keys_prefix ON api_keys(key_prefix);

-- ------------------------------------------------------------
-- 3. Default tenant for existing data
-- ------------------------------------------------------------
INSERT INTO tenants (id, name, plan, rate_limit_per_minute)
VALUES (1, 'Default Tenant', 'PRO', 1000);

SELECT setval('tenants_id_seq', 1, true);

-- ------------------------------------------------------------
-- 4. Add tenant_id and tenant_role to users
-- Existing role column (USER/ADMIN) is unchanged.
-- tenant_role reflects the user's role within their tenant.
-- ------------------------------------------------------------
ALTER TABLE users
    ADD COLUMN tenant_id   BIGINT      REFERENCES tenants(id),
    ADD COLUMN tenant_role VARCHAR(20) NOT NULL DEFAULT 'OWNER'
        CONSTRAINT chk_user_tenant_role CHECK (tenant_role IN ('OWNER', 'MEMBER'));

UPDATE users SET tenant_id = 1 WHERE tenant_id IS NULL;

ALTER TABLE users
    ALTER COLUMN tenant_id SET NOT NULL;

CREATE INDEX idx_users_tenant ON users(tenant_id);

-- ------------------------------------------------------------
-- 5. Add tenant_id to security_events
-- ------------------------------------------------------------
ALTER TABLE security_events
    ADD COLUMN tenant_id BIGINT REFERENCES tenants(id);

UPDATE security_events SET tenant_id = 1 WHERE tenant_id IS NULL;

ALTER TABLE security_events
    ALTER COLUMN tenant_id SET NOT NULL;

CREATE INDEX idx_events_tenant_created
    ON security_events(tenant_id, created_at DESC);