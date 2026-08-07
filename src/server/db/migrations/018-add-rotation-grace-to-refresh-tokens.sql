-- Rotation à usage unique du refresh token avec fenêtre de grâce anti-course
-- (StrictMode, double onglet, retry réseau — cf. docs/TODO.md, bug 401 sur
-- /api/auth/refresh malgré une session valide) : l'ancien jti n'est plus
-- supprimé mais marqué rotated_at/replaced_by, ce qui permet de retrouver la
-- session active au lieu de refuser une requête concurrente perdante.
--
-- remember_me persiste le choix « Rester connecté » du login à travers toutes
-- les rotations d'une même session, pour que /api/auth/refresh sache quel
-- type de cookie reposer (persistant vs session) sans dépendre du client.
ALTER TABLE refresh_tokens
  ADD COLUMN rotated_at TIMESTAMPTZ,
  ADD COLUMN replaced_by UUID REFERENCES refresh_tokens(id) ON DELETE SET NULL,
  ADD COLUMN remember_me BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX idx_refresh_tokens_replaced_by ON refresh_tokens (replaced_by);
