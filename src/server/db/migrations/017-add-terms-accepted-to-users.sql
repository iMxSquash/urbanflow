-- Trace serveur de l'acceptation des CGU à l'inscription (accountabilité
-- RGPD, sur le même principe que rgpd_consent_at pour le consentement géoloc).
ALTER TABLE users ADD COLUMN terms_accepted_at TIMESTAMPTZ;
