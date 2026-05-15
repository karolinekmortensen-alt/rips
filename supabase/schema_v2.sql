-- ═══════════════════════════════════════════════════════════════
-- RIPS — Database schema v2 (multi-tenant SaaS)
--
-- Kjør hele denne filen i Supabase SQL Editor.
-- ═══════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────
-- TABELLER (opprettes først, før funksjoner og policies)
-- ───────────────────────────────────────────────────────────────

CREATE TABLE organizations (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 text NOT NULL,
  slug                 text UNIQUE NOT NULL,
  plan                 text NOT NULL DEFAULT 'starter',
    CONSTRAINT plan_values CHECK (plan IN ('starter', 'team', 'enterprise')),
  max_members          int,
  stripe_customer_id   text,
  subscription_status  text,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE memberships (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id)   ON DELETE CASCADE,
  role        text NOT NULL DEFAULT 'editor',
    CONSTRAINT role_values CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
  invited_by  uuid REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, user_id)
);

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS current_org_id uuid REFERENCES organizations(id);

CREATE TABLE collections (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name         text NOT NULL,
  description  text,
  owner_name   text,
  owner_id     uuid REFERENCES auth.users(id),
  period       text,
  scale        int NOT NULL DEFAULT 5
    CONSTRAINT scale_range CHECK (scale BETWEEN 2 AND 10),
  sort_order   int NOT NULL DEFAULT 0,
  created_by   uuid REFERENCES auth.users(id),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE tags (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name       text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, name)
);

CREATE TABLE risks (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id   uuid NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  title           text NOT NULL,
  description     text,
  owner_name      text,
  owner_id        uuid REFERENCES auth.users(id),
  probability     int NOT NULL DEFAULT 1
    CONSTRAINT prob_positive CHECK (probability >= 1),
  consequence     int NOT NULL DEFAULT 1
    CONSTRAINT cons_positive CHECK (consequence >= 1),
  sort_order      int NOT NULL DEFAULT 0,
  created_by      uuid REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX risks_collection_sort ON risks (collection_id, sort_order);

CREATE TABLE risk_tags (
  risk_id  uuid NOT NULL REFERENCES risks(id) ON DELETE CASCADE,
  tag_id   uuid NOT NULL REFERENCES tags(id)  ON DELETE CASCADE,
  PRIMARY KEY (risk_id, tag_id)
);

CREATE TABLE mitigations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  risk_id     uuid NOT NULL REFERENCES risks(id) ON DELETE CASCADE,
  label       text NOT NULL,
  owner_name  text,
  owner_id    uuid REFERENCES auth.users(id),
  due_date    date,
  done        boolean NOT NULL DEFAULT false,
  delta_p     int NOT NULL DEFAULT 0,
  delta_c     int NOT NULL DEFAULT 0,
  sort_order  int NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE comments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  risk_id         uuid REFERENCES risks(id)       ON DELETE CASCADE,
  mitigation_id   uuid REFERENCES mitigations(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES auth.users(id),
  text            text NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT exactly_one_parent CHECK (
    (risk_id IS NOT NULL AND mitigation_id IS NULL) OR
    (risk_id IS NULL AND mitigation_id IS NOT NULL)
  )
);

CREATE TABLE risk_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  risk_id     uuid NOT NULL REFERENCES risks(id) ON DELETE CASCADE,
  user_id     uuid REFERENCES auth.users(id),
  user_name   text NOT NULL,
  prev_p      int,
  prev_c      int,
  new_p       int,
  new_c       int,
  entry_text  text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX risk_log_risk_id ON risk_log (risk_id, created_at DESC);


-- ───────────────────────────────────────────────────────────────
-- HJELPEFUNKSJONER (etter tabellene er opprettet)
-- ───────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_my_role(p_org_id uuid)
RETURNS text
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT role FROM memberships
  WHERE org_id = p_org_id AND user_id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION is_member(p_org_id uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM memberships
    WHERE org_id = p_org_id AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION can_edit(p_org_id uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM memberships
    WHERE org_id = p_org_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin', 'editor')
  );
$$;


-- ═══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE organizations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships    ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections    ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags           ENABLE ROW LEVEL SECURITY;
ALTER TABLE risks          ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_tags      ENABLE ROW LEVEL SECURITY;
ALTER TABLE mitigations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_log       ENABLE ROW LEVEL SECURITY;

-- organizations
CREATE POLICY "medlemmer kan lese sin org"
  ON organizations FOR SELECT USING (is_member(id));
CREATE POLICY "owner/admin kan oppdatere org"
  ON organizations FOR UPDATE USING (get_my_role(id) IN ('owner', 'admin'));

-- memberships
CREATE POLICY "medlemmer kan se andre i sin org"
  ON memberships FOR SELECT USING (is_member(org_id));
CREATE POLICY "owner/admin kan legge til medlemmer"
  ON memberships FOR INSERT WITH CHECK (get_my_role(org_id) IN ('owner', 'admin'));
CREATE POLICY "owner/admin kan fjerne medlemmer"
  ON memberships FOR DELETE USING (get_my_role(org_id) IN ('owner', 'admin'));

-- collections
CREATE POLICY "medlemmer kan lese samlinger"
  ON collections FOR SELECT USING (is_member(org_id));
CREATE POLICY "editor+ kan opprette samlinger"
  ON collections FOR INSERT WITH CHECK (can_edit(org_id));
CREATE POLICY "editor+ kan oppdatere samlinger"
  ON collections FOR UPDATE USING (can_edit(org_id));
CREATE POLICY "admin+ kan slette samlinger"
  ON collections FOR DELETE USING (get_my_role(org_id) IN ('owner', 'admin'));

-- tags
CREATE POLICY "medlemmer kan lese tagger"
  ON tags FOR SELECT USING (is_member(org_id));
CREATE POLICY "editor+ kan opprette tagger"
  ON tags FOR INSERT WITH CHECK (can_edit(org_id));
CREATE POLICY "editor+ kan slette tagger"
  ON tags FOR DELETE USING (can_edit(org_id));

-- risks
CREATE POLICY "medlemmer kan lese risikoer"
  ON risks FOR SELECT
  USING (is_member((SELECT org_id FROM collections WHERE id = collection_id)));
CREATE POLICY "editor+ kan opprette risikoer"
  ON risks FOR INSERT
  WITH CHECK (can_edit((SELECT org_id FROM collections WHERE id = collection_id)));
CREATE POLICY "editor+ kan oppdatere risikoer"
  ON risks FOR UPDATE
  USING (can_edit((SELECT org_id FROM collections WHERE id = collection_id)));
CREATE POLICY "editor+ kan slette risikoer"
  ON risks FOR DELETE
  USING (can_edit((SELECT org_id FROM collections WHERE id = collection_id)));

-- risk_tags
CREATE POLICY "medlemmer kan lese risk_tags"
  ON risk_tags FOR SELECT
  USING (is_member((SELECT c.org_id FROM risks r JOIN collections c ON c.id = r.collection_id WHERE r.id = risk_id)));
CREATE POLICY "editor+ kan endre risk_tags"
  ON risk_tags FOR ALL
  USING (can_edit((SELECT c.org_id FROM risks r JOIN collections c ON c.id = r.collection_id WHERE r.id = risk_id)));

-- mitigations
CREATE POLICY "medlemmer kan lese tiltak"
  ON mitigations FOR SELECT
  USING (is_member((SELECT c.org_id FROM risks r JOIN collections c ON c.id = r.collection_id WHERE r.id = risk_id)));
CREATE POLICY "editor+ kan endre tiltak"
  ON mitigations FOR ALL
  USING (can_edit((SELECT c.org_id FROM risks r JOIN collections c ON c.id = r.collection_id WHERE r.id = risk_id)));

-- comments
CREATE POLICY "medlemmer kan lese kommentarer"
  ON comments FOR SELECT
  USING (
    CASE
      WHEN risk_id IS NOT NULL THEN
        is_member((SELECT c.org_id FROM risks r JOIN collections c ON c.id = r.collection_id WHERE r.id = risk_id))
      ELSE
        is_member((SELECT c.org_id FROM risks r JOIN collections c ON c.id = r.collection_id JOIN mitigations m ON m.risk_id = r.id WHERE m.id = mitigation_id))
    END
  );
CREATE POLICY "editor+ kan opprette kommentarer"
  ON comments FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "bruker kan slette egne kommentarer"
  ON comments FOR DELETE USING (user_id = auth.uid());

-- risk_log
CREATE POLICY "medlemmer kan lese logg"
  ON risk_log FOR SELECT
  USING (is_member((SELECT c.org_id FROM risks r JOIN collections c ON c.id = r.collection_id WHERE r.id = risk_id)));
CREATE POLICY "editor+ kan skrive logg"
  ON risk_log FOR INSERT
  WITH CHECK (can_edit((SELECT c.org_id FROM risks r JOIN collections c ON c.id = r.collection_id WHERE r.id = risk_id)));


-- ═══════════════════════════════════════════════════════════════
-- VIEWS
-- ═══════════════════════════════════════════════════════════════

CREATE VIEW collection_summary AS
SELECT
  c.id, c.org_id, c.name, c.owner_name, c.period, c.scale,
  COUNT(DISTINCT r.id)                            AS risk_count,
  COUNT(DISTINCT m.id)                            AS mitigation_count,
  COUNT(DISTINCT m.id) FILTER (WHERE m.done)      AS done_count
FROM collections c
LEFT JOIN risks r       ON r.collection_id = c.id
LEFT JOIN mitigations m ON m.risk_id = r.id
GROUP BY c.id;

CREATE VIEW org_summary AS
SELECT
  o.id, o.name, o.plan, o.subscription_status,
  COUNT(DISTINCT mb.user_id)   AS member_count,
  COUNT(DISTINCT c.id)         AS collection_count,
  COUNT(DISTINCT r.id)         AS risk_count,
  o.created_at
FROM organizations o
LEFT JOIN memberships  mb ON mb.org_id = o.id
LEFT JOIN collections  c  ON c.org_id  = o.id
LEFT JOIN risks        r  ON r.collection_id = c.id
GROUP BY o.id;
