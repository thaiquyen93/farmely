-- Keep the selected process version on each rental. Existing rentals remain unbound.
ALTER TABLE process_templates ADD COLUMN IF NOT EXISTS name VARCHAR(200);
ALTER TABLE process_templates ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE process_templates ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS template_id INTEGER REFERENCES process_templates(template_id);
ALTER TABLE template_steps ADD COLUMN IF NOT EXISTS water_regime TEXT;
ALTER TABLE template_steps ADD COLUMN IF NOT EXISTS nutrition_regime TEXT;
ALTER TABLE template_steps ADD COLUMN IF NOT EXISTS pest_warning TEXT;
ALTER TABLE template_steps ADD COLUMN IF NOT EXISTS evidence_requirement TEXT;
ALTER TABLE template_steps ADD COLUMN IF NOT EXISTS inspection_criteria TEXT;
CREATE INDEX IF NOT EXISTS idx_rentals_template_id ON rentals(template_id);
