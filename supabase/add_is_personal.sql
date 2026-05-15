-- Kjør denne i Supabase SQL Editor
-- Legger til is_personal-flagg på organizations og fikser create_my_org.

-- 1. Ny kolonne
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS is_personal boolean NOT NULL DEFAULT false;

-- 2. Marker eksisterende enkeltmanns-orger som personlige
--    (kun én eier, ikke invitert av noen → opprettet av brukeren selv som sin første org)
UPDATE organizations o
SET is_personal = true
WHERE NOT o.is_personal
  AND (SELECT COUNT(*) FROM memberships m WHERE m.org_id = o.id) = 1
  AND EXISTS (
    SELECT 1 FROM memberships m2
    WHERE m2.org_id = o.id
      AND m2.role = 'owner'
      AND m2.invited_by IS NULL
  );

-- 3. Oppdater create_my_org til å bruke is_personal-flagget
CREATE OR REPLACE FUNCTION create_my_org(org_name text, org_slug text)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  existing_org_id uuid;
  new_org_id      uuid;
BEGIN
  -- Finn eksisterende personlig org via flagget
  SELECT o.id INTO existing_org_id
  FROM memberships m
  JOIN organizations o ON o.id = m.org_id
  WHERE m.user_id = auth.uid()
    AND o.is_personal = true
  LIMIT 1;

  IF existing_org_id IS NOT NULL THEN
    RETURN existing_org_id;
  END IF;

  -- Opprett ny personlig org
  INSERT INTO organizations (name, slug, is_personal)
  VALUES (org_name, org_slug, true)
  RETURNING id INTO new_org_id;

  INSERT INTO memberships (org_id, user_id, role)
  VALUES (new_org_id, auth.uid(), 'owner');

  RETURN new_org_id;
END;
$$;
