-- Use selected local image assets for each demo plot and reuse the strongest
-- vegetable-growing image as the Happy Valley landing-page cover.
ALTER TABLE lands
    ADD COLUMN IF NOT EXISTS image_url TEXT;

UPDATE lands
SET image_url = '/images/plots/p-01-cover.jpg'
WHERE land_id = 1;

UPDATE plots AS p
SET image_url = cover.image_url
FROM (VALUES
    ('P-01', '/images/plots/p-01-cover.jpg'),
    ('P-02', '/images/plots/p-02-cover.jpg'),
    ('P-03', '/images/plots/p-03-cover.jpg'),
    ('P-04', '/images/plots/p-04-cover.jpg'),
    ('P-05', '/images/plots/p-05-cover.jpg'),
    ('P-06', '/images/plots/p-06-cover.jpg'),
    ('P-07', '/images/plots/p-07-cover.jpg'),
    ('P-08', '/images/plots/p-08-cover.jpg'),
    ('P-09', '/images/plots/p-09-cover.jpg'),
    ('P-10', '/images/plots/p-10-cover.jpg'),
    ('P-11', '/images/plots/p-11-cover.jpg'),
    ('P-12', '/images/plots/p-12-cover.jpg'),
    ('P-13', '/images/plots/p-13-cover.jpg'),
    ('P-14', '/images/plots/p-14-cover.jpg'),
    ('P-15', '/images/plots/p-15-cover.jpg'),
    ('P-16', '/images/plots/p-16-cover.jpg'),
    ('P-17', '/images/plots/p-17-cover.jpg'),
    ('P-20', '/images/plots/p-20-cover.jpg')
) AS cover(plot_code, image_url)
WHERE p.plot_code = cover.plot_code;
