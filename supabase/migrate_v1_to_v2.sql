-- ═══════════════════════════════════════════════════════════════
-- RIPS — Migrasjonsscript: v1 (JSONB) → v2 (relasjonell)
--
-- Kjør ETTER schema_v2.sql.
-- Leser eksisterende data fra workspaces-tabellen og skriver
-- dem inn i det nye skjemaet.
--
-- VIKTIG: Kjør i en transaksjon og verifiser tellingene
-- på bunnen før du committer.
-- ═══════════════════════════════════════════════════════════════

BEGIN;

-- ── STEG 1: Opprett én org per eksisterende bruker ──────────────
-- Hver bruker får sin egen org. Brukeren blir owner.
-- Org-navn hentes fra profiles.full_name, fallback til e-post.

INSERT INTO organizations (id, name, slug, plan)
SELECT
  gen_random_uuid(),
  COALESCE(p.full_name, split_part(u.email, '@', 1), 'Min konto'),
  -- slug: lowercase, mellomrom → bindestrek, unik ved å legge til 4 hex-tegn
  lower(regexp_replace(
    COALESCE(p.full_name, split_part(u.email, '@', 1), 'konto'),
    '[^a-z0-9]+', '-', 'g'
  )) || '-' || substr(md5(u.id::text), 1, 4),
  'starter'
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
-- Kun brukere som faktisk har workspace-data
WHERE EXISTS (SELECT 1 FROM workspaces w WHERE w.id = u.id);

-- ── STEG 2: Lag memberships (owner) for alle ────────────────────
-- Bruker en hjelpetabell for å holde koblingen user_id → org_id

CREATE TEMP TABLE _user_org_map AS
SELECT
  u.id AS user_id,
  o.id AS org_id
FROM auth.users u
JOIN organizations o ON o.slug LIKE '%' || substr(md5(u.id::text), 1, 4)
WHERE EXISTS (SELECT 1 FROM workspaces w WHERE w.id = u.id);

INSERT INTO memberships (org_id, user_id, role)
SELECT org_id, user_id, 'owner'
FROM _user_org_map;

-- Koble profiler til sin org
UPDATE profiles p
SET current_org_id = m.org_id
FROM _user_org_map m
WHERE p.id = m.user_id;

-- ── STEG 3: Migrer tagger ───────────────────────────────────────

INSERT INTO tags (org_id, name)
SELECT DISTINCT
  m.org_id,
  tag_value
FROM workspaces w
JOIN _user_org_map m ON m.user_id = w.id
CROSS JOIN jsonb_array_elements_text(COALESCE(w.tags, '[]'::jsonb)) AS tag_value
ON CONFLICT (org_id, name) DO NOTHING;

-- ── STEG 4: Migrer samlinger ────────────────────────────────────

-- Hjelpetabell: gammel collection-id (tekst) → ny uuid
CREATE TEMP TABLE _collection_id_map (
  old_id text PRIMARY KEY,
  new_id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL
);

INSERT INTO _collection_id_map (old_id, org_id)
SELECT
  col->>'id',
  m.org_id
FROM workspaces w
JOIN _user_org_map m ON m.user_id = w.id
CROSS JOIN jsonb_array_elements(COALESCE(w.collections, '[]'::jsonb)) AS col;

INSERT INTO collections (id, org_id, name, description, owner_name, period, scale, sort_order)
SELECT
  cm.new_id,
  cm.org_id,
  col->>'name',
  col->>'description',
  col->>'owner',
  col->>'period',
  COALESCE((col->>'scale')::int, 5),
  row_number() OVER (PARTITION BY cm.org_id ORDER BY col->>'name') - 1
FROM workspaces w
JOIN _user_org_map m ON m.user_id = w.id
CROSS JOIN jsonb_array_elements(COALESCE(w.collections, '[]'::jsonb)) AS col
JOIN _collection_id_map cm ON cm.old_id = col->>'id' AND cm.org_id = m.org_id;

-- ── STEG 5: Migrer risikoer ─────────────────────────────────────

CREATE TEMP TABLE _risk_id_map (
  old_id text PRIMARY KEY,
  new_id uuid NOT NULL DEFAULT gen_random_uuid()
);

INSERT INTO _risk_id_map (old_id)
SELECT DISTINCT risk->>'id'
FROM workspaces w
CROSS JOIN jsonb_array_elements(COALESCE(w.collections, '[]'::jsonb)) AS col
CROSS JOIN jsonb_array_elements(COALESCE(col->'risks', '[]'::jsonb)) AS risk;

INSERT INTO risks (id, collection_id, title, description, owner_name, probability, consequence, sort_order)
SELECT
  rm.new_id,
  cm.new_id,
  risk->>'title',
  risk->>'description',
  risk->>'owner',
  COALESCE((risk->>'p')::int, 1),
  COALESCE((risk->>'c')::int, 1),
  row_number() OVER (PARTITION BY cm.new_id) - 1
FROM workspaces w
JOIN _user_org_map m ON m.user_id = w.id
CROSS JOIN jsonb_array_elements(COALESCE(w.collections, '[]'::jsonb)) AS col
JOIN _collection_id_map cm ON cm.old_id = col->>'id' AND cm.org_id = m.org_id
CROSS JOIN jsonb_array_elements(COALESCE(col->'risks', '[]'::jsonb)) AS risk
JOIN _risk_id_map rm ON rm.old_id = risk->>'id';

-- ── STEG 6: Migrer risk_tags ────────────────────────────────────

INSERT INTO risk_tags (risk_id, tag_id)
SELECT DISTINCT rm.new_id, t.id
FROM workspaces w
JOIN _user_org_map m ON m.user_id = w.id
CROSS JOIN jsonb_array_elements(COALESCE(w.collections, '[]'::jsonb)) AS col
JOIN _collection_id_map cm ON cm.old_id = col->>'id' AND cm.org_id = m.org_id
CROSS JOIN jsonb_array_elements(COALESCE(col->'risks', '[]'::jsonb)) AS risk
JOIN _risk_id_map rm ON rm.old_id = risk->>'id'
CROSS JOIN jsonb_array_elements_text(COALESCE(risk->'tags', '[]'::jsonb)) AS tag_name
JOIN tags t ON t.org_id = m.org_id AND t.name = tag_name
ON CONFLICT DO NOTHING;

-- ── STEG 7: Migrer tiltak ───────────────────────────────────────

INSERT INTO mitigations (risk_id, label, owner_name, due_date, done, delta_p, delta_c, sort_order)
SELECT
  rm.new_id,
  mit->>'label',
  mit->>'owner',
  CASE
    WHEN mit->>'due' ~ '^\d{4}-\d{2}-\d{2}$' THEN (mit->>'due')::date
    ELSE NULL  -- "DD.MM"-format uten år ignoreres ved migrering
  END,
  COALESCE((mit->>'done')::boolean, false),
  COALESCE((mit->>'deltaP')::int, 0),
  COALESCE((mit->>'deltaC')::int, 0),
  row_number() OVER (PARTITION BY rm.new_id) - 1
FROM workspaces w
JOIN _user_org_map m ON m.user_id = w.id
CROSS JOIN jsonb_array_elements(COALESCE(w.collections, '[]'::jsonb)) AS col
JOIN _collection_id_map cm ON cm.old_id = col->>'id' AND cm.org_id = m.org_id
CROSS JOIN jsonb_array_elements(COALESCE(col->'risks', '[]'::jsonb)) AS risk
JOIN _risk_id_map rm ON rm.old_id = risk->>'id'
CROSS JOIN jsonb_array_elements(COALESCE(risk->'mitigations', '[]'::jsonb)) AS mit;

-- ── STEG 8: Migrer endringslogg ─────────────────────────────────

INSERT INTO risk_log (risk_id, user_name, prev_p, prev_c, new_p, new_c, entry_text, created_at)
SELECT
  rm.new_id,
  COALESCE(entry->>'user', 'Ukjent'),
  (entry->>'prevP')::int,
  (entry->>'prevC')::int,
  (entry->>'newP')::int,
  (entry->>'newC')::int,
  entry->>'text',
  to_timestamp(COALESCE((entry->>'ts')::bigint, 0) / 1000.0)
FROM workspaces w
JOIN _user_org_map m ON m.user_id = w.id
CROSS JOIN jsonb_array_elements(COALESCE(w.collections, '[]'::jsonb)) AS col
JOIN _collection_id_map cm ON cm.old_id = col->>'id' AND cm.org_id = m.org_id
CROSS JOIN jsonb_array_elements(COALESCE(col->'risks', '[]'::jsonb)) AS risk
JOIN _risk_id_map rm ON rm.old_id = risk->>'id'
CROSS JOIN jsonb_array_elements(COALESCE(risk->'log', '[]'::jsonb)) AS entry
WHERE entry->>'text' IS NOT NULL;

-- ── VERIFISERING ────────────────────────────────────────────────
-- Sjekk at tallene ser rimelige ut før du kjører COMMIT.
-- Kjør ROLLBACK hvis noe ser galt ut.

SELECT 'organizations' AS tabell, COUNT(*) FROM organizations
UNION ALL SELECT 'memberships',   COUNT(*) FROM memberships
UNION ALL SELECT 'collections',   COUNT(*) FROM collections
UNION ALL SELECT 'tags',          COUNT(*) FROM tags
UNION ALL SELECT 'risks',         COUNT(*) FROM risks
UNION ALL SELECT 'risk_tags',     COUNT(*) FROM risk_tags
UNION ALL SELECT 'mitigations',   COUNT(*) FROM mitigations
UNION ALL SELECT 'risk_log',      COUNT(*) FROM risk_log;

-- Bekreft at tellingene stemmer, og kjør deretter:
-- COMMIT;
--
-- Angre ved feil:
-- ROLLBACK;
