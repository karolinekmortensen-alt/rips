-- Kjør denne i Supabase SQL Editor
-- Lar brukere opprette nye team-workspacer (ikke personlige)

CREATE OR REPLACE FUNCTION create_team_org(org_name text)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  new_org_id uuid;
  slug       text;
BEGIN
  slug := lower(regexp_replace(org_name, '[^a-z0-9]+', '-', 'g'))
       || '-' || substr(md5(random()::text), 1, 6);

  INSERT INTO organizations (name, slug, is_personal)
  VALUES (org_name, slug, false)
  RETURNING id INTO new_org_id;

  INSERT INTO memberships (org_id, user_id, role)
  VALUES (new_org_id, auth.uid(), 'owner');

  RETURN new_org_id;
END;
$$;
