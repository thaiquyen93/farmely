-- =============================================================================
-- FARMELY - SEED DATA: LANDS (NÔNG TRẠI) & PLOTS (THỬA ĐẤT)
-- Script độc lập dùng để nạp / khôi phục dữ liệu Nông trại và Thửa đất với tọa độ GPS thực tế
-- =============================================================================

-- 1. Đảm bảo các cột mở rộng GeoJSON và mô tả đã tồn tại
ALTER TABLE lands ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE lands ADD COLUMN IF NOT EXISTS boundary_geojson TEXT;

ALTER TABLE plots ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE plots ADD COLUMN IF NOT EXISTS boundary_geojson TEXT;
ALTER TABLE plots ADD COLUMN IF NOT EXISTS center_point TEXT;
ALTER TABLE plots ADD COLUMN IF NOT EXISTS polygon_coords TEXT;

-- 2. Dữ liệu NÔNG TRẠI (lands)
INSERT INTO lands (land_id, land_name, address, description, boundary_geojson, created_at, updated_at)
VALUES
(1, 'Trang trại Happy Valley Củ Chi', 'Đường Nhuận Đức, Xã Nhuận Đức, Huyện Củ Chi, TP. Hồ Chí Minh', 
 'Nông trại sinh thái Củ Chi với hệ sinh thái công nghệ cao, trạm cảm biến IoT và quy trình canh tác VietGAP hữu cơ chuẩn hóa.', 
 '{"type":"Polygon","coordinates":[[[106.342, 10.686], [106.352, 10.686], [106.352, 10.696], [106.342, 10.696], [106.342, 10.686]]]}', 
 NOW(), NOW()),
(2, 'Trang trại Cao nguyên Mộc Châu', 'Tiểu khu Mía Đường, Thị trấn Nông trường Mộc Châu, Sơn La', 
 'Khu canh tác chuyên canh ôn đới cao nguyên với khí hậu quanh năm mát mẻ, thích hợp dâu tây và rau ôn đới.', 
 NULL, NOW(), NOW()),
(3, 'Trang trại Thung lũng Sinh thái Đà Lạt', 'Xã Tà Nung, TP. Đà Lạt, Tỉnh Lâm Đồng', 
 'Thung lũng sinh thái xanh mát tại Đà Lạt, đất đỏ bazan giàu dinh dưỡng và nguồn nước suối tự nhiên.', 
 NULL, NOW(), NOW())
ON CONFLICT (land_id) DO UPDATE SET
  land_name = EXCLUDED.land_name,
  address = EXCLUDED.address,
  description = EXCLUDED.description,
  boundary_geojson = EXCLUDED.boundary_geojson,
  updated_at = NOW();

-- Cập nhật sequence của bảng lands
SELECT setval('lands_land_id_seq', (SELECT GREATEST(MAX(land_id), 1) FROM lands));

-- 3. Dữ liệu THỬA ĐẤT (plots) - 16 thửa đất với ranh giới GeoJSON GPS thực tế tại Happy Valley Củ Chi
INSERT INTO plots (plot_id, land_id, plot_code, area, image_url, price_per_period, status, is_published, center_point, polygon_coords, boundary_geojson, created_at, updated_at)
VALUES
(1, 1, 'P-01', 150.00, 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80', 1200000.00, 'RENT', true, 
 '[106.344998, 10.689116]', 
 '[[[106.343813, 10.689452], [106.345118, 10.690545], [106.346782, 10.688616], [106.345463, 10.687517], [106.343813, 10.689452]]]', 
 '{"type":"Polygon","coordinates":[[[106.343813, 10.689452], [106.345118, 10.690545], [106.346782, 10.688616], [106.345463, 10.687517], [106.343813, 10.689452]]]}', NOW(), NOW()),

(2, 1, 'P-02', 180.00, 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&w=800&q=80', 1450000.00, 'RENT', true, 
 '[106.346448, 10.690328]', 
 '[[[106.345257, 10.690661], [106.346562, 10.691754], [106.348241, 10.689832], [106.346922, 10.688733], [106.345257, 10.690661]]]', 
 '{"type":"Polygon","coordinates":[[[106.345257, 10.690661], [106.346562, 10.691754], [106.348241, 10.689832], [106.346922, 10.688733], [106.345257, 10.690661]]]}', NOW(), NOW()),

(3, 1, 'P-03', 200.00, 'https://images.unsplash.com/photo-1628352081506-83c43123ed6d?auto=format&fit=crop&w=800&q=80', 1700000.00, 'RENT', true, 
 '[106.347897, 10.69154]', 
 '[[[106.3467, 10.69187], [106.348006, 10.692963], [106.3497, 10.691048], [106.348381, 10.689948], [106.3467, 10.69187]]]', 
 '{"type":"Polygon","coordinates":[[[106.3467, 10.69187], [106.348006, 10.692963], [106.3497, 10.691048], [106.348381, 10.689948], [106.3467, 10.69187]]]}', NOW(), NOW()),

(4, 1, 'P-04', 160.00, 'https://images.unsplash.com/photo-1592417817098-8f3d69103632?auto=format&fit=crop&w=800&q=80', 1300000.00, 'AVAIL', true, 
 '[106.349347, 10.692751]', 
 '[[[106.348144, 10.693079], [106.34945, 10.694172], [106.351159, 10.692263], [106.34984, 10.691164], [106.348144, 10.693079]]]', 
 '{"type":"Polygon","coordinates":[[[106.348144, 10.693079], [106.34945, 10.694172], [106.351159, 10.692263], [106.34984, 10.691164], [106.348144, 10.693079]]]}', NOW(), NOW()),

(5, 1, 'P-05', 175.00, 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80', 1350000.00, 'AVAIL', true, 
 '[106.346829, 10.686978]', 
 '[[[106.345638, 10.687311], [106.346959, 10.688411], [106.348622, 10.686482], [106.347288, 10.685376], [106.345638, 10.687311]]]', 
 '{"type":"Polygon","coordinates":[[[106.345638, 10.687311], [106.346959, 10.688411], [106.348622, 10.686482], [106.347288, 10.685376], [106.345638, 10.687311]]]}', NOW(), NOW()),

(6, 1, 'P-06', 190.00, 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=800&q=80', 1500000.00, 'MAINT', true, 
 '[106.348296, 10.688198]', 
 '[[[106.347099, 10.688528], [106.348419, 10.689628], [106.350098, 10.687705], [106.348764, 10.686599], [106.347099, 10.688528]]]', 
 '{"type":"Polygon","coordinates":[[[106.347099, 10.688528], [106.348419, 10.689628], [106.350098, 10.687705], [106.348764, 10.686599], [106.347099, 10.688528]]]}', NOW(), NOW()),

(13, 1, 'P-07', 155.00, 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80', 1250000.00, 'RENT', true, 
 '[106.349763, 10.689417]', 
 '[[[106.34856, 10.689744], [106.34988, 10.690844], [106.351575, 10.688929], [106.35024, 10.687823], [106.34856, 10.689744]]]', 
 '{"type":"Polygon","coordinates":[[[106.34856, 10.689744], [106.34988, 10.690844], [106.351575, 10.688929], [106.35024, 10.687823], [106.34856, 10.689744]]]}', NOW(), NOW()),

(14, 1, 'P-08', 165.00, 'https://images.unsplash.com/photo-1592417817098-8f3d6910985c?auto=format&fit=crop&w=800&q=80', 1300000.00, 'AVAIL', true, 
 '[106.35123, 10.690636]', 
 '[[[106.35002, 10.690961], [106.351341, 10.692061], [106.353051, 10.690153], [106.351716, 10.689046], [106.35002, 10.690961]]]', 
 '{"type":"Polygon","coordinates":[[[106.35002, 10.690961], [106.351341, 10.692061], [106.353051, 10.690153], [106.351716, 10.689046], [106.35002, 10.690961]]]}', NOW(), NOW()),

(15, 1, 'P-09', 170.00, 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80', 1400000.00, 'AVAIL', true, 
 '[106.34866, 10.68484]', 
 '[[[106.347463, 10.68517], [106.348799, 10.686277], [106.350463, 10.684348], [106.349113, 10.683234], [106.347463, 10.68517]]]', 
 '{"type":"Polygon","coordinates":[[[106.347463, 10.68517], [106.348799, 10.686277], [106.350463, 10.684348], [106.349113, 10.683234], [106.347463, 10.68517]]]}', NOW(), NOW()),

(16, 1, 'P-10', 175.00, 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=800&q=80', 1450000.00, 'AVAIL', true, 
 '[106.35016, 10.68594]', 
 '[[[106.348963, 10.68627], [106.350299, 10.687377], [106.351963, 10.685448], [106.350613, 10.684334], [106.348963, 10.68627]]]', 
 '{"type":"Polygon","coordinates":[[[106.348963, 10.68627], [106.350299, 10.687377], [106.351963, 10.685448], [106.350613, 10.684334], [106.348963, 10.68627]]]}', NOW(), NOW()),

(17, 1, 'P-11', 180.00, 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80', 1500000.00, 'AVAIL', true, 
 '[106.35166, 10.68704]', 
 '[[[106.350463, 10.68737], [106.351799, 10.688477], [106.353463, 10.686548], [106.352113, 10.685434], [106.350463, 10.68737]]]', 
 '{"type":"Polygon","coordinates":[[[106.350463, 10.68737], [106.351799, 10.688477], [106.353463, 10.686548], [106.352113, 10.685434], [106.350463, 10.68737]]]}', NOW(), NOW()),

(18, 1, 'P-12', 160.00, 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80', 1350000.00, 'AVAIL', true, 
 '[106.35316, 10.68814]', 
 '[[[106.351963, 10.68847], [106.353299, 10.689577], [106.354963, 10.687648], [106.353613, 10.686534], [106.351963, 10.68847]]]', 
 '{"type":"Polygon","coordinates":[[[106.351963, 10.68847], [106.353299, 10.689577], [106.354963, 10.687648], [106.353613, 10.686534], [106.351963, 10.68847]]]}', NOW(), NOW()),

(19, 1, 'P-13', 165.00, 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80', 1350000.00, 'RENT', true, 
 '[106.350491, 10.682701]', 
 '[[[106.349288, 10.683029], [106.350639, 10.684143], [106.352303, 10.682213], [106.350938, 10.681093], [106.349288, 10.683029]]]', 
 '{"type":"Polygon","coordinates":[[[106.349288, 10.683029], [106.350639, 10.684143], [106.352303, 10.682213], [106.350938, 10.681093], [106.349288, 10.683029]]]}', NOW(), NOW()),

(20, 1, 'P-14', 175.00, 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=800&q=80', 1550000.00, 'AVAIL', true, 
 '[106.351992, 10.683936]', 
 '[[[106.350783, 10.684261], [106.352134, 10.685375], [106.353813, 10.683453], [106.352448, 10.682332], [106.350783, 10.684261]]]', 
 '{"type":"Polygon","coordinates":[[[106.350783, 10.684261], [106.352134, 10.685375], [106.353813, 10.683453], [106.352448, 10.682332], [106.350783, 10.684261]]]}', NOW(), NOW()),

(21, 1, 'P-15', 180.00, 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80', 1650000.00, 'AVAIL', true, 
 '[106.353493, 10.685171]', 
 '[[[106.352278, 10.685493], [106.353629, 10.686607], [106.355323, 10.684692], [106.353958, 10.683572], [106.352278, 10.685493]]]', 
 '{"type":"Polygon","coordinates":[[[106.352278, 10.685493], [106.353629, 10.686607], [106.355323, 10.684692], [106.353958, 10.683572], [106.352278, 10.685493]]]}', NOW(), NOW()),

(22, 1, 'P-16', 150.00, 'https://images.unsplash.com/photo-1592417817098-8f3d6910985c?auto=format&fit=crop&w=800&q=80', 1200000.00, 'RENT', true, 
 '[106.354994, 10.686406]', 
 '[[[106.353773, 10.686725], [106.355124, 10.687839], [106.356834, 10.685931], [106.355468, 10.684811], [106.353773, 10.686725]]]', 
 '{"type":"Polygon","coordinates":[[[106.353773, 10.686725], [106.355124, 10.687839], [106.356834, 10.685931], [106.355468, 10.684811], [106.353773, 10.686725]]]}', NOW(), NOW())
ON CONFLICT (plot_id) DO UPDATE SET
  land_id = EXCLUDED.land_id,
  plot_code = EXCLUDED.plot_code,
  area = EXCLUDED.area,
  image_url = EXCLUDED.image_url,
  price_per_period = EXCLUDED.price_per_period,
  status = EXCLUDED.status,
  is_published = EXCLUDED.is_published,
  center_point = EXCLUDED.center_point,
  polygon_coords = EXCLUDED.polygon_coords,
  boundary_geojson = EXCLUDED.boundary_geojson,
  updated_at = NOW();

-- Cập nhật sequence của bảng plots
SELECT setval('plots_plot_id_seq', (SELECT GREATEST(MAX(plot_id), 1) FROM plots));

-- 4. Dữ liệu TƯƠNG THÍCH GIỐNG CÂY (plot_variety_compatibility) cho 16 thửa đất
INSERT INTO plot_variety_compatibility (plot_id, variety_id) VALUES
(1, 1), (1, 2), (1, 3), (1, 4), (1, 8), (1, 10),
(2, 1), (2, 2), (2, 3), (2, 6), (2, 8), (2, 10),
(3, 4), (3, 5), (3, 6), (3, 7),
(4, 3), (4, 4), (4, 6), (4, 9),
(5, 1), (5, 5), (5, 7), (5, 8), (5, 9),
(6, 1), (6, 2), (6, 8), (6, 10),
(13, 1), (13, 2), (13, 3), (13, 10),
(14, 2), (14, 3), (14, 8), (14, 10),
(15, 4), (15, 5), (15, 6), (15, 7),
(16, 3), (16, 4), (16, 9),
(17, 1), (17, 3), (17, 5), (17, 8),
(18, 2), (18, 3), (18, 6), (18, 10),
(19, 1), (19, 4), (19, 7), (19, 9),
(20, 4), (20, 5), (20, 6), (20, 7),
(21, 1), (21, 2), (21, 3), (21, 5), (21, 8),
(22, 2), (22, 3), (22, 8), (22, 10)
ON CONFLICT (plot_id, variety_id) DO NOTHING;

-- Kiểm tra kết quả
SELECT COUNT(*) AS total_lands FROM lands;
SELECT COUNT(*) AS total_plots FROM plots;
SELECT COUNT(*) AS total_compatibilities FROM plot_variety_compatibility;
