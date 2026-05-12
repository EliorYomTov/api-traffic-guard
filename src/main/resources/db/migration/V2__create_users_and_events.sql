-- Users table: stores user accounts with hashed passwords.
-- Status column allows soft-disabling accounts (active, locked, deleted).
CREATE TABLE users (
                       id              BIGSERIAL PRIMARY KEY,
                       username        VARCHAR(50)  NOT NULL UNIQUE,
                       email           VARCHAR(255) NOT NULL UNIQUE,
                       password_hash   VARCHAR(255) NOT NULL,
                       status          VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
                       created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
                       updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

                       CONSTRAINT users_status_check CHECK (status IN ('ACTIVE', 'LOCKED', 'DELETED')));

CREATE INDEX idx_users_username ON users (username);
CREATE INDEX idx_users_email    ON users (email);

-- Security events: append-only audit log of every relevant security event.
-- user_id nullable because some events (e.g. anonymous abuse) have no user.
CREATE TABLE security_events (
                                 id              BIGSERIAL PRIMARY KEY,
                                 user_id         BIGINT       NULL REFERENCES users(id) ON DELETE SET NULL,
                                 event_type      VARCHAR(50)  NOT NULL,
                                 ip_address      VARCHAR(45)  NOT NULL,  -- 45 chars supports IPv6
                                 endpoint        VARCHAR(255) NULL,
                                 status_code     INTEGER      NULL,
                                 created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

                                 CONSTRAINT events_type_check CHECK (event_type IN (
                                    'LOGIN_SUCCESS', 'LOGIN_FAILURE', 'USER_BLOCKED',
                                    'USER_UNBLOCKED', 'IP_BLOCKED', 'RATE_LIMIT_EXCEEDED')));

CREATE INDEX idx_events_user_id    ON security_events (user_id);
CREATE INDEX idx_events_ip_address ON security_events (ip_address);
CREATE INDEX idx_events_created_at ON security_events (created_at DESC);
CREATE INDEX idx_events_event_type ON security_events (event_type);