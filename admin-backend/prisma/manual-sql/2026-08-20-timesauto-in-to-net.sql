-- Move the two stored contact addresses from timesauto.in to timesauto.net.
--
-- These are live: the website footer renders support_email and
-- contact_email, so the old domain is on every page today. Everything
-- else that mentioned timesauto.in was a code placeholder and is fixed
-- in the same commit; seo_meta was checked and holds none.
--
-- site_settings has exactly one row, and the WHERE keeps this to the two
-- values actually being changed. Confirm the count first:
--
--   SELECT id, support_email, contact_email FROM site_settings
--   WHERE support_email ILIKE '%timesauto.in' OR contact_email ILIKE '%timesauto.in';
--
-- Expected: 1 row (id 1, support@timesauto.in, contact@timesauto.in).

BEGIN;

UPDATE site_settings
   SET support_email = replace(support_email, '@timesauto.in', '@timesauto.net'),
       contact_email = replace(contact_email, '@timesauto.in', '@timesauto.net'),
       updated_at    = now()
 WHERE support_email ILIKE '%timesauto.in'
    OR contact_email ILIKE '%timesauto.in';

COMMIT;
