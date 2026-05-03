-- Placeholder migration. Real schema will be added in Issue #3.
-- This file ensures Flyway has something to run on first startup.

CREATE TABLE IF NOT EXISTS _flyway_init_marker (
   id SERIAL PRIMARY KEY,
   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);