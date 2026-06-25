-- Roll back the Securitatem Defensionis Guardian Tracker schema.
--
-- The pgcrypto and citext extensions are intentionally left installed because
-- extensions can be shared by other schemas in the same database.

BEGIN;

DROP SCHEMA IF EXISTS guardian CASCADE;

COMMIT;
