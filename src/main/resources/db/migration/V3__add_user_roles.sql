-- Add role column to users table.
-- ADMIN role grants access to /api/admin/** endpoints.
ALTER TABLE users ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'USER'
    CONSTRAINT users_role_check CHECK (role IN ('USER', 'ADMIN'));

-- Promote first user to ADMIN for testing.
UPDATE users SET role = 'ADMIN' WHERE id = 1;