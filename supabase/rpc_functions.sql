-- ═══════════════════════════════════════════════════════════════
-- Kjør denne etter schema_v2.sql
--
-- 1. RPC-funksjon for å opprette org for ny bruker (omgår RLS)
-- 2. Tilleggs-policies som manglet i schema_v2.sql
-- ═══════════════════════════════════════════════════════════════

-- Atomisk org-opprettelse: brukes av klienten ved første innlogging.
-- SECURITY DEFINER lar funksjonen kjøre med eierens rettigheter
-- og omgå RLS for INSERT på organizations + memberships.
CREATE OR REPLACE FUNCTION create_my_org(org_name text, org_slug text)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  existing_org_id uuid;
  new_org_id      uuid;
BEGIN
  -- Returner eksisterende org hvis brukeren allerede har en
  SELECT org_id INTO existing_org_id
  FROM memberships WHERE user_id = auth.uid() LIMIT 1;
  IF existing_org_id IS NOT NULL THEN
    RETURN existing_org_id;
  END IF;

  -- Opprett ny org
  INSERT INTO organizations (name, slug)
  VALUES (org_name, org_slug)
  RETURNING id INTO new_org_id;

  -- Opprett eier-medlemskap
  INSERT INTO memberships (org_id, user_id, role)
  VALUES (new_org_id, auth.uid(), 'owner');

  RETURN new_org_id;
END;
$$;

-- Tillat innloggede brukere å lese sin egen rad i memberships
-- (nødvendig for å sjekke om org allerede finnes)
CREATE POLICY "bruker kan lese egne memberships"
  ON memberships FOR SELECT
  USING (user_id = auth.uid());
