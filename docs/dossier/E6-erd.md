# E6, Schéma relationnel complet (ERD)


```mermaid
erDiagram
    users {
        UUID id PK "DEFAULT gen_random_uuid()"
        TEXT email "UNIQUE NOT NULL"
        TEXT password_hash "NOT NULL"
        TIMESTAMPTZ rgpd_consent_at ""
        INTEGER total_points "NOT NULL DEFAULT 0"
        TIMESTAMPTZ created_at "NOT NULL DEFAULT now()"
    }

    mobility_profiles {
        UUID user_id PK "FK users.id ON DELETE CASCADE"
        TEXT_ARRAY preferred_modes "NOT NULL DEFAULT {}"
        INTEGER max_walk_minutes "NOT NULL DEFAULT 15"
        preference_mode preference "ENUM eco|fast|balanced DEFAULT balanced"
        BOOLEAN pmr_accessibility "NOT NULL DEFAULT false"
        TIMESTAMPTZ updated_at "NOT NULL DEFAULT now()"
    }

    trips {
        UUID id PK "DEFAULT gen_random_uuid()"
        UUID user_id "FK users.id ON DELETE CASCADE · INDEX"
        GEOGRAPHY origin "POINT 4326 NOT NULL · GiST"
        GEOGRAPHY destination "POINT 4326 NOT NULL · GiST"
        TEXT_ARRAY modes_used "NOT NULL DEFAULT {}"
        TEXT primary_mode "NOT NULL DEFAULT walk · INDEX"
        INTEGER co2_saved_grams "NOT NULL DEFAULT 0"
        INTEGER points_earned "NOT NULL DEFAULT 0"
        TIMESTAMPTZ created_at "NOT NULL DEFAULT now() · INDEX"
    }

    badges {
        UUID id PK "DEFAULT gen_random_uuid()"
        TEXT name "UNIQUE NOT NULL"
        TEXT description "NOT NULL"
        threshold_type threshold_type "ENUM total_trips|co2_saved|total_points|streak_days"
        INTEGER threshold_value "NOT NULL"
    }

    user_badges {
        UUID user_id PK "FK users.id ON DELETE CASCADE · INDEX"
        UUID badge_id PK "FK badges.id ON DELETE CASCADE"
        TIMESTAMPTZ unlocked_at "NOT NULL DEFAULT now()"
    }

    rewards {
        UUID id PK "DEFAULT gen_random_uuid()"
        TEXT name "UNIQUE NOT NULL"
        TEXT description "NOT NULL"
        reward_type reward_type "ENUM discount_code|museum_ticket"
        INTEGER points_cost "NOT NULL CHECK > 0"
        TEXT partner_name "NOT NULL"
        BOOLEAN active "NOT NULL DEFAULT true"
        TIMESTAMPTZ created_at "NOT NULL DEFAULT now()"
    }

    reward_redemptions {
        UUID id PK "DEFAULT gen_random_uuid()"
        UUID user_id "FK users.id ON DELETE CASCADE · INDEX"
        UUID reward_id "FK rewards.id ON DELETE RESTRICT"
        TEXT code "UNIQUE NOT NULL"
        INTEGER points_spent "NOT NULL"
        TIMESTAMPTZ redeemed_at "NOT NULL DEFAULT now()"
    }

    users ||--o| mobility_profiles : "1-to-1 ON DELETE CASCADE"
    users ||--o{ trips : "1-to-N ON DELETE CASCADE"
    users ||--o{ user_badges : "1-to-N ON DELETE CASCADE"
    users ||--o{ reward_redemptions : "1-to-N ON DELETE CASCADE"
    badges ||--o{ user_badges : "1-to-N ON DELETE CASCADE"
    rewards ||--o{ reward_redemptions : "1-to-N ON DELETE RESTRICT"
```

![Schéma relationnel complet](exports/E6-erd.png)

## Index

| Table | Colonne(s) | Type | Migration |
|---|---|---|---|
| `users` | `email` | B-tree UNIQUE | 002 |
| `trips` | `user_id` | B-tree | 004 |
| `trips` | `origin` | GiST PostGIS | 004 |
| `trips` | `destination` | GiST PostGIS | 004 |
| `trips` | `created_at` | B-tree | 004 |
| `trips` | `(user_id, primary_mode, created_at)` | B-tree composé | 012 |
| `user_badges` | `user_id` | B-tree | 006 |
| `reward_redemptions` | `user_id` | B-tree | 013 |

## Description du modèle

Le schéma s'organise autour de quatre entités racines. `users` porte l'identité et le solde de points cumulé (`total_points`), dénormalisé pour éviter un recalcul par agrégation à chaque affichage du tableau de bord. `mobility_profiles` est en relation 1-1 avec `users` : chaque utilisateur possède exactement un profil de mobilité, supprimé en cascade avec son compte.

`trips` enregistre chaque itinéraire effectué, avec les coordonnées d'origine et de destination en `GEOGRAPHY(POINT, 4326)` pour permettre des requêtes géospatiales (distance, recherche par rayon) via les index GiST. Seuls les indicateurs de synthèse utiles à la gamification et au tableau de bord sont persistés (`co2_saved_grams`, `points_earned`) : la durée, la distance et le score détaillés d'un itinéraire restent des valeurs calculées à la volée par le moteur de scoring, jamais stockées.

`badges` et `user_badges` modélisent la progression de gamification : `badges` définit un catalogue de paliers (nombre de trajets, CO2 économisé, points totaux, séquence de jours consécutifs) et `user_badges` matérialise le déverrouillage d'un badge par un utilisateur, avec une clé primaire composée `(user_id, badge_id)` qui interdit nativement le déverrouillage en double.

`rewards` et `reward_redemptions` modélisent la boutique de récompenses : `rewards` catalogue les récompenses disponibles auprès de partenaires (coût en points, type), et `reward_redemptions` trace chaque échange avec un code unique généré à l'échange. La suppression d'une récompense est bloquée (`ON DELETE RESTRICT`) tant que des échanges y font référence, ce qui préserve l'intégrité de l'historique.
