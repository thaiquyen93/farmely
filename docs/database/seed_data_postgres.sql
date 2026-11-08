-- SEED DATA CHO POSTGRESQL (FARMELY)
SET client_encoding = 'UTF8';

-- 1. Users
INSERT INTO users (role_id, email, password_hash, full_name, phone_number, address, status) VALUES
(4, 'admin@farmely.vn', '$2a$10$XqQv4Q5H1n9v0m1wzK8EeeYv7o9h0c2r1l8b5m6n7p8q9r0s1t2u3', 'Nguyen Van Admin', '0901234567', 'Ha Noi', 'ACTIVE'),
(2, 'expert.nam@farmely.vn', '$2a$10$XqQv4Q5H1n9v0m1wzK8EeeYv7o9h0c2r1l8b5m6n7p8q9r0s1t2u3', 'TS. Le Hoang Nam', '0912345678', 'Nghe An', 'ACTIVE'),
(3, 'staff.thang@farmely.vn', '$2a$10$XqQv4Q5H1n9v0m1wzK8EeeYv7o9h0c2r1l8b5m6n7p8q9r0s1t2u3', 'Tran Van Thang', '0923456789', 'Nghe An', 'ACTIVE'),
(1, 'customer.khoi@gmail.com', '$2a$10$XqQv4Q5H1n9v0m1wzK8EeeYv7o9h0c2r1l8b5m6n7p8q9r0s1t2u3', 'Ta Nguyen Khoi Nguyen', '0934567890', 'TP. Ho Chi Minh', 'ACTIVE'),
(1, 'customer.linh@gmail.com', '$2a$10$XqQv4Q5H1n9v0m1wzK8EeeYv7o9h0c2r1l8b5m6n7p8q9r0s1t2u3', 'Nguyen Thi Linh', '0945678901', 'Da Nang', 'ACTIVE')
ON CONFLICT (email) DO NOTHING;

-- 2. Lands
INSERT INTO lands (land_name, address) VALUES
('Trang trai Happy Valley', 'Xa Muong Noc, Huyen Que Phong, Tinh Nghe An')
ON CONFLICT DO NOTHING;

-- 3. Crops & Varieties
INSERT INTO crops (crop_name) VALUES
('Rau cai'), ('Xa lach'), ('Ca chua bi'), ('Dua leo')
ON CONFLICT (crop_name) DO NOTHING;

INSERT INTO varieties (crop_id, variety_name, expected_duration, buffer_time) VALUES
(1, 'Cai ngot bong F1', 35, 4),
(2, 'Xa lach xoan Lollo Bionda', 45, 4),
(3, 'Ca chua bi cherry', 75, 4),
(4, 'Dua leo Baby', 50, 4)
ON CONFLICT DO NOTHING;

-- 4. Plots (16 plots)
INSERT INTO plots (land_id, plot_code, area, price_per_period, status, is_published) VALUES
(1, 'P-01', 100.00, 1200000.00, 'AVAIL', true),
(1, 'P-02', 150.00, 1800000.00, 'AVAIL', true),
(1, 'P-03', 120.00, 1500000.00, 'AVAIL', true),
(1, 'P-04', 200.00, 2400000.00, 'AVAIL', true),
(1, 'P-05', 100.00, 1200000.00, 'AVAIL', true),
(1, 'P-06', 150.00, 1800000.00, 'AVAIL', true),
(1, 'P-07', 120.00, 1500000.00, 'AVAIL', true),
(1, 'P-08', 200.00, 2400000.00, 'AVAIL', true),
(1, 'P-09', 100.00, 1200000.00, 'AVAIL', true),
(1, 'P-10', 150.00, 1800000.00, 'AVAIL', true),
(1, 'P-11', 120.00, 1500000.00, 'AVAIL', true),
(1, 'P-12', 200.00, 2400000.00, 'AVAIL', true),
(1, 'P-13', 100.00, 1200000.00, 'AVAIL', true),
(1, 'P-14', 150.00, 1800000.00, 'AVAIL', true),
(1, 'P-15', 120.00, 1500000.00, 'AVAIL', true),
(1, 'P-16', 200.00, 2400000.00, 'AVAIL', true)
ON CONFLICT (plot_code) DO NOTHING;
