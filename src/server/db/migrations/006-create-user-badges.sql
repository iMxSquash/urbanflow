CREATE TABLE user_badges (
  user_id     UUID        NOT NULL REFERENCES users  (id) ON DELETE CASCADE,
  badge_id    UUID        NOT NULL REFERENCES badges (id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, badge_id)
);

CREATE INDEX idx_user_badges_user_id ON user_badges (user_id);
