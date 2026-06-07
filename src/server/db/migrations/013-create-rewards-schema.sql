CREATE TYPE reward_type AS ENUM ('discount_code', 'museum_ticket');

CREATE TABLE rewards (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT        NOT NULL UNIQUE,
  description  TEXT        NOT NULL,
  reward_type  reward_type NOT NULL,
  points_cost  INTEGER     NOT NULL CHECK (points_cost > 0),
  partner_name TEXT        NOT NULL,
  active       BOOLEAN     NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE reward_redemptions (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  reward_id    UUID        NOT NULL REFERENCES rewards (id) ON DELETE RESTRICT,
  code         TEXT        NOT NULL UNIQUE,
  points_spent INTEGER     NOT NULL,
  redeemed_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reward_redemptions_user_id ON reward_redemptions (user_id);
