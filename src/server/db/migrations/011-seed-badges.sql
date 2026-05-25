ALTER TABLE badges ADD COLUMN IF NOT EXISTS mode_filter TEXT;

INSERT INTO badges (name, description, threshold_type, threshold_value, mode_filter) VALUES
  ('premier-trajet',  'Premier trajet enregistré',                  'total_trips',          1,     NULL),
  ('explorateur',     '5 trajets enregistrés',                      'total_trips',          5,     NULL),
  ('habitue',         '20 trajets enregistrés',                     'total_trips',          20,    NULL),
  ('cycliste',        '10 trajets à vélo',                          'total_trips',          10,    'bike'),
  ('eco-citoyen',     '100 g de CO₂ économisés vs voiture',         'total_co2_saved_grams', 100,  NULL),
  ('militant-vert',   '1 kg de CO₂ économisés vs voiture',          'total_co2_saved_grams', 1000, NULL),
  ('champion-co2',    '10 kg de CO₂ économisés vs voiture',         'total_co2_saved_grams', 10000,NULL)
ON CONFLICT (name) DO NOTHING;
