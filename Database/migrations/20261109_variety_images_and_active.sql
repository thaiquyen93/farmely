-- Preserve variety history while presenting only the five approved demo varieties.
ALTER TABLE varieties
    ADD COLUMN IF NOT EXISTS image_url TEXT,
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

UPDATE varieties
SET is_active = variety_id IN (1, 2, 3, 4, 5),
    image_url = CASE variety_id
        WHEN 1 THEN '/images/varieties/rau-muong-la-tre.png'
        WHEN 2 THEN '/images/varieties/cai-ngot-bong.png'
        WHEN 3 THEN '/images/varieties/xa-lach-romaine.png'
        WHEN 4 THEN '/images/varieties/ca-chua-bi-do.png'
        WHEN 5 THEN '/images/varieties/dua-leo-baby.png'
        ELSE image_url
    END;

-- Archived varieties remain available to existing rentals and templates, but are
-- no longer presented as planting options for any plot.
DELETE FROM plot_variety_compatibility
WHERE variety_id NOT IN (1, 2, 3, 4, 5);
