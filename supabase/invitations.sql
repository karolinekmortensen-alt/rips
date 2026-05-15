-- Kjør denne i Supabase SQL Editor

-- ── Invitations-tabell ──────────────────────────────────────────
CREATE TABLE invitations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email       text NOT NULL,
  role        text NOT NULL DEFAULT 'editor',
    CONSTRAINT inv_role CHECK (role IN ('admin', 'editor', 'viewer')),
  invited_by  uuid REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, email)
);

ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members can see invitations"
  ON invitations FOR SELECT USING (is_member(org_id));

CREATE POLICY "owner/admin can insert invitations"
  ON invitations FOR INSERT WITH CHECK (get_my_role(org_id) IN ('owner', 'admin'));

CREATE POLICY "owner/admin can delete invitations"
  ON invitations FOR DELETE USING (get_my_role(org_id) IN ('owner', 'admin'));


-- ── Aksepter ventende invitasjoner ──────────────────────────────
-- Kalles av klienten rett etter innlogging.
-- Ser om innlogget brukers e-post har ventende invitasjoner
-- og oppretter memberships automatisk.
CREATE OR REPLACE FUNCTION accept_pending_invitations()
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  user_email text;
BEGIN
  SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();

  INSERT INTO memberships (org_id, user_id, role, invited_by)
  SELECT org_id, auth.uid(), role, invited_by
  FROM   invitations
  WHERE  lower(email) = lower(user_email)
  ON CONFLICT (org_id, user_id) DO NOTHING;

  DELETE FROM invitations WHERE lower(email) = lower(user_email);
END;
$$;


-- ── Profiles: tillat brukere å oppdatere eget navn ─────────────
CREATE POLICY "users can update own profile"
  ON profiles FOR UPDATE USING (id = auth.uid());


-- ── Legg til owner/admin som kan invitere via direkte oppslag ──
-- Tillater owner/admin å lese andre profilers e-post for å sjekke
-- om de allerede er registrert (brukes i invite-flyten).
CREATE POLICY "authenticated can read profiles"
  ON profiles FOR SELECT USING (auth.uid() IS NOT NULL);
