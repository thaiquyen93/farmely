-- Add identity and demo state without changing historical harvests or diaries.
CREATE TABLE IF NOT EXISTS demo_cultivation_state (
  rental_id integer NOT NULL REFERENCES rentals(rental_id),
  season_key varchar(100) NOT NULL,
  current_day integer NOT NULL DEFAULT 1,
  total_days integer NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (rental_id, season_key)
);
ALTER TABLE care_tasks ADD COLUMN IF NOT EXISTS demo_completed boolean NOT NULL DEFAULT false;
ALTER TABLE harvest_results ADD COLUMN IF NOT EXISTS season_key varchar(100);
ALTER TABLE harvest_results ADD COLUMN IF NOT EXISTS harvest_task_id integer;
ALTER TABLE farm_diaries ADD COLUMN IF NOT EXISTS harvest_id integer;
CREATE UNIQUE INDEX IF NOT EXISTS harvest_results_one_per_task
  ON harvest_results(rental_id, season_key, harvest_task_id)
  WHERE harvest_task_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS farm_diaries_one_per_harvest
  ON farm_diaries(harvest_id) WHERE harvest_id IS NOT NULL;
