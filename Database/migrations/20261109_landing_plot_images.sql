-- Add a dedicated representative image URL to farm records.
ALTER TABLE lands
    ADD COLUMN IF NOT EXISTS image_url TEXT;

UPDATE lands
SET image_url = COALESCE(image_url, '/images/plots/p-01-cover.jpg')
WHERE land_id = 1;
