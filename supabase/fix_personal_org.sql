-- Kjør denne i Supabase SQL Editor
--
-- Fikser create_my_org slik at den kun ser etter brukerens EGNE org
-- (der de er owner og ikke ble invitert), ikke team-orger de er invitert inn i.

CREATE OR REPLACE FUNCTION create_my_org(org_name text, org_slug text)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  existing_org_id uuid;
  new_org_id      uuid;
BEGIN
  -- Finn eksisterende PERSONLIG org: eier-rolle og ikke invitert av noen
  SELECT org_id INTO existing_org_id
  FROM memberships
  WHERE user_id = auth.uid()
    AND role = 'owner'
    AND invited_by IS NULL
  LIMIT 1;

  IF existing_org_id IS NOT NULL THEN
    RETURN existing_org_id;
  END IF;

  -- Opprett ny personlig org
  INSERT INTO organizations (name, slug)
  VALUES (org_name, org_slug)
  RETURNING id INTO new_org_id;

  INSERT INTO memberships (org_id, user_id, role)
  VALUES (new_org_id, auth.uid(), 'owner');

  RETURN new_org_id;
END;
$$;
