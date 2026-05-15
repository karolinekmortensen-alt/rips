-- ═══════════════════════════════════════════════════════════════
-- RIPS — Full reset (tømmer alt og starter på nytt)
--
-- 1. Kjør dette scriptet i SQL Editor
-- 2. Slett brukere manuelt: Authentication → Users → velg alle → Delete
-- 3. Kjør schema_v2.sql
-- ═══════════════════════════════════════════════════════════════

-- Fjern v2-tabeller hvis de ble delvis opprettet
DROP TABLE IF EXISTS risk_log        CASCADE;
DROP TABLE IF EXISTS comments        CASCADE;
DROP TABLE IF EXISTS mitigations     CASCADE;
DROP TABLE IF EXISTS risk_tags       CASCADE;
DROP TABLE IF EXISTS risks           CASCADE;
DROP TABLE IF EXISTS tags            CASCADE;
DROP TABLE IF EXISTS collections     CASCADE;
DROP TABLE IF EXISTS memberships     CASCADE;
DROP TABLE IF EXISTS organizations   CASCADE;

-- Fjern v2-funksjoner
DROP FUNCTION IF EXISTS get_my_role(uuid);
DROP FUNCTION IF EXISTS is_member(uuid);
DROP FUNCTION IF EXISTS can_edit(uuid);

-- Fjern views
DROP VIEW IF EXISTS collection_summary;
DROP VIEW IF EXISTS org_summary;

-- Tøm gammel workspaces-tabell
DROP TABLE IF EXISTS workspaces CASCADE;

-- Tøm profiles (brukere slettes separat via dashbordet)
TRUNCATE TABLE profiles RESTART IDENTITY CASCADE;
