-- Filet de sécurité idempotent. remember_me a été ajouté à la migration 018
-- APRÈS que celle-ci ait pu être appliquée une première fois (sans cette
-- colonne) sur certains environnements — le runner de migration ne rejoue
-- jamais un fichier déjà marqué appliqué, même modifié depuis. IF NOT EXISTS
-- rend cette migration sûre quel que soit l'historique réel de la base :
-- colonne déjà présente (018 appliqué après l'ajout) → no-op ; colonne
-- manquante (018 appliqué avant) → ajoutée ici.
ALTER TABLE refresh_tokens
  ADD COLUMN IF NOT EXISTS remember_me BOOLEAN NOT NULL DEFAULT true;
