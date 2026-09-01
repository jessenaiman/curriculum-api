-- PostgreSQL init: roles for curriculum API
-- The two roles the API (readonly) and migrations (owner) use.

CREATE ROLE curriculum_owner LOGIN PASSWORD 'curriculum_owner_pw';
CREATE ROLE curriculum_readonly LOGIN PASSWORD 'curriculum_readonly_pw';

GRANT CONNECT ON DATABASE curriculum TO curriculum_owner, curriculum_readonly;
GRANT USAGE ON SCHEMA public TO curriculum_owner, curriculum_readonly;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO curriculum_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO curriculum_owner;
