-- ============================================================================
-- FARMELY - QUY TRÌNH KỸ THUẬT CANH TÁC CHUẨN HÓA 10 LOẠI RAU VIETGAP
-- Chuẩn hóa theo Tiêu chuẩn Quốc gia TCVN 11892-1:2017 & Thông tư 25/2024/TT-BNNPTNT
-- Nguồn tham chiếu: Quy_Trinh_Canh_Tac_10_Loai_Rau_An_Toan.docx
-- ============================================================================

-- 1. BỔ SUNG CÁC CỘT CHUYÊN MÔN NÔNG HỌC & ĐỒNG BỘ SCHEMA CHO BẢNG TEMPLATE_STEPS
ALTER TABLE template_steps ADD COLUMN IF NOT EXISTS step_order INT DEFAULT 1;
ALTER TABLE template_steps ADD COLUMN IF NOT EXISTS task_type VARCHAR(50);
ALTER TABLE template_steps ADD COLUMN IF NOT EXISTS duration_days INT DEFAULT 1;
ALTER TABLE template_steps ADD COLUMN IF NOT EXISTS materials_needed TEXT;
ALTER TABLE template_steps ADD COLUMN IF NOT EXISTS min_temp DECIMAL(5,2);
ALTER TABLE template_steps ADD COLUMN IF NOT EXISTS max_temp DECIMAL(5,2);
ALTER TABLE template_steps ADD COLUMN IF NOT EXISTS min_humidity DECIMAL(5,2);
ALTER TABLE template_steps ADD COLUMN IF NOT EXISTS max_humidity DECIMAL(5,2);
ALTER TABLE template_steps ADD COLUMN IF NOT EXISTS water_regime TEXT;
ALTER TABLE template_steps ADD COLUMN IF NOT EXISTS nutrition_regime TEXT;
ALTER TABLE template_steps ADD COLUMN IF NOT EXISTS pest_warning TEXT;
ALTER TABLE template_steps ADD COLUMN IF NOT EXISTS evidence_requirement TEXT;
ALTER TABLE template_steps ADD COLUMN IF NOT EXISTS inspection_criteria TEXT;

COMMENT ON COLUMN template_steps.step_order IS 'Thứ tự thực hiện tác vụ trong quy trình canh tác';
COMMENT ON COLUMN template_steps.water_regime IS 'Định mức và kỹ thuật tưới nước chuẩn VietGAP (L/m2/ngày, thời điểm tưới)';
COMMENT ON COLUMN template_steps.nutrition_regime IS 'Chế độ phân bón hữu cơ vi sinh, nồng độ pha loãng và phương pháp bón';
COMMENT ON COLUMN template_steps.pest_warning IS 'Cảnh báo sâu bệnh sinh học, tên thuốc BVTV sinh học được phép & thời gian cách ly (PHI)';
COMMENT ON COLUMN template_steps.evidence_requirement IS 'Tiêu chuẩn ảnh chụp nghiệm thu hiện trường bắt buộc của nhân viên';
COMMENT ON COLUMN template_steps.inspection_criteria IS 'Tiêu chí nghiệm thu chất lượng VietGAP theo từng ngày tuổi';

-- 2. CẬP NHẬT RÀNG BUỘC KHÓA NGOẠI AN TOÀN CHO CARE_TASKS (ON DELETE SET NULL)
-- Giúp việc cập nhật quy trình không bị chặn bởi các tác vụ care_tasks đang chạy
ALTER TABLE care_tasks DROP CONSTRAINT IF EXISTS care_tasks_step_id_fkey;
ALTER TABLE care_tasks ADD CONSTRAINT care_tasks_step_id_fkey
    FOREIGN KEY (step_id) REFERENCES template_steps(step_id) ON DELETE SET NULL;

-- 3. TẠO BẢNG QUY TRÌNH NGHỈ ĐẤT VÀ VỆ SINH CANH TÁC (FALLOW PROTOCOLS)
CREATE TABLE IF NOT EXISTS fallow_protocols (
    fallow_id SERIAL PRIMARY KEY,
    protocol_code VARCHAR(50) NOT NULL UNIQUE,
    protocol_name VARCHAR(150) NOT NULL,
    standard_reference VARCHAR(100) DEFAULT 'TCVN 11892-1:2017',
    total_days INT NOT NULL DEFAULT 5,
    description TEXT
);

CREATE TABLE IF NOT EXISTS fallow_steps (
    step_id SERIAL PRIMARY KEY,
    fallow_id INT NOT NULL REFERENCES fallow_protocols(fallow_id) ON DELETE CASCADE,
    day_number INT NOT NULL,
    step_name VARCHAR(150) NOT NULL,
    task_type VARCHAR(50) NOT NULL DEFAULT 'SOIL_MAINTENANCE',
    description TEXT NOT NULL,
    materials_needed TEXT,
    evidence_requirement TEXT NOT NULL,
    target_criteria TEXT NOT NULL
);

-- 4. NẠP DỮ LIỆU QUY TRÌNH NGHỈ ĐẤT 5 NGÀY CHUẨN VIETGAP
INSERT INTO fallow_protocols (fallow_id, protocol_code, protocol_name, total_days, description) VALUES
(1, 'FALLOW-VIETGAP-5D', 'Quy trình nghỉ đất & vệ sinh canh tác chu kỳ 5 ngày VietGAP', 5, 'Phục hồi lý hóa tính đất, cân bằng vi sinh, triệt tiêu mầm nấm bệnh và trứng sâu hại trước khi xuống giống vụ mới.')
ON CONFLICT (fallow_id) DO UPDATE SET
    protocol_name = EXCLUDED.protocol_name,
    description = EXCLUDED.description;

DELETE FROM fallow_steps WHERE fallow_id = 1;
INSERT INTO fallow_steps (fallow_id, day_number, step_name, task_type, description, materials_needed, evidence_requirement, target_criteria) VALUES
(1, 1, 'Thu dọn tàn dư & Vệ sinh mặt đất', 'CLEANING', 'Cắt dây, nhổ toàn bộ gốc rễ vụ cũ chuyển về khu ủ phân vi sinh tập trung. Tháo gỡ màng phủ nông nghiệp, thu gom rác vô cơ và dọn sạch cỏ bờ rãnh.', 'Kéo cắt cành, bao tải thu gom phế phẩm hữu cơ', 'Ảnh toàn cảnh mặt thửa sạch rác và tàn dư cây cũ', '100% gốc rễ và tàn dư lá bệnh được thu gom sạch sẽ khỏi mặt đất'),
(1, 2, 'Rải vôi bột khử trùng & Cân bằng pH', 'SOIL_DISINFECTION', 'Rải đều vôi bột nông nghiệp (CaO/CaCO3) liều lượng 50 - 70g/m2 trên toàn bộ mặt luống và rãnh thoát nước để diệt khuẩn, hạ phèn và nâng pH lên ngưỡng 6.0 - 6.8.', 'Vôi bột nông nghiệp tinh khiết (5 - 7kg/100m2)', 'Ảnh bề mặt luống phủ một lớp vôi bột trắng mịn đều', 'Độ pH đất đạt ngưỡng 6.2 - 6.8, nấm khuẩn bề mặt bị ức chế'),
(1, 3, 'Cày xới sâu & Phơi ải diệt mầm bệnh', 'SOIL_SOLARIZATION', 'Dùng máy xới mini hoặc cuốc xới lật đất sâu 20 - 25cm làm vỡ tảng đất to. Phơi ải dưới ánh nắng trực tiếp tối thiểu 24 - 48 giờ để tia UV tiêu diệt trứng tuyến trùng và bảo tử nấm ngầm.', 'Máy xới đất mini hoặc cuốc xới chuyên dụng', 'Ảnh luống đất xới lật tơi sâu phơi nắng vàng óng', 'Đất tầng canh tác được thông khí, trứng sâu và tuyến trùng bị triệt tiêu'),
(1, 4, 'Bón lót vi sinh & Nấm đối kháng Trichoderma', 'BIO_CONDITIONING', 'Bón lót phân trùn quế hoai mục (1.5 - 2.0 kg/m2) phối trộn chế phẩm nấm đối kháng Trichoderma harzianum để tái thiết lập hệ vi sinh vật bản địa đối kháng nấm bệnh rễ.', 'Phân trùn quế hoai mục (150kg/100m2) + Chế phẩm Trichoderma (1kg/100m2)', 'Ảnh bao bì phân trùn quế, gói Trichoderma và luống sau rải', 'Mật độ bào tử vi sinh có ích đạt >= 10^8 CFU/g đất'),
(1, 5, 'Tưới ẩm cân bằng & Kiểm tra lý hóa tính', 'MOISTURE_BALANCE', 'Tưới phun sương nhẹ làm ẩm toàn bộ luống đất đạt độ ẩm 65 - 70%. Dùng máy đo pH và ẩm độ chuyên dụng kiểm tra lại các chỉ số an toàn trước khi bàn giao xuống giống.', 'Hệ thống béc phun sương, máy đo pH & ẩm độ đất 2 trong 1', 'Ảnh màn hình máy đo pH hiển thị 6.5 và độ ẩm đất 68%', 'Độ ẩm 65 - 70%, pH 6.0 - 6.8, đất tơi xốp sẵn sàng đón vụ mùa mới');

-- 5. CẬP NHẬT / GHI ĐÈ 88 BƯỚC CHI TIẾT (TEMPLATE STEPS) CHO 10 QUY TRÌNH RAU VIETGAP
-- Dùng ON CONFLICT (step_id) DO UPDATE để bảo toàn toàn bộ dữ liệu care_tasks hiện có

-- ============================================================================
-- TEMPLATE 1: Rau Muống Cạn (Water Spinach) (9 TASKS)
-- ============================================================================
INSERT INTO template_steps (step_id, template_id, step_order, step_name, task_type, duration_days, day_offset, description, water_regime, nutrition_regime, pest_warning, materials_needed, evidence_requirement, inspection_criteria, min_temp, max_temp, min_humidity, max_humidity) VALUES
(1, 1, 1, 'Làm đất & Bón lót', 'SOIL_PREP', 1, 0, 'Xới đất tơi xốp sâu 15cm, đánh luống cao 20cm. Bón lót phân trùn quế 1.5kg/m2 + vôi bột khử chua + nấm đối kháng Trichoderma. San phẳng mặt luống.', 'Tưới nước sạch duy trì độ ẩm ổn định, không để đọng úng.', 'Bón lót phân trùn quế hoai mục (1.2 - 2.0 kg/m²) phối trộn vôi khử khuẩn và nấm Trichoderma.', 'Theo dõi sâu bệnh thường xuyên; ưu tiên bắt thủ công hoặc bẫy dính vàng nếu mật độ thấp.', 'Phân trùn quế hoai mục, vôi bột nông nghiệp, nấm đối kháng Trichoderma.', 'Ảnh mặt luống phẳng & bao bì phân lót', 'Đất tơi xốp sâu >= 20cm, luống thẳng cao ráo thoát nước, phân lót san phẳng đều.', 20.0, 35.0, 60.0, 85.0),
(2, 1, 2, 'Gieo hạt & Tưới đẫm', 'PLANTING', 1, 0, 'Ngâm hạt nước ấm (2 sôi 3 lạnh) 3 giờ, ủ nứt nanh. Gieo theo rạch cách nhau 15cm, hạt cách 3cm. Phủ lớp rơm rạ mục mỏng và tưới đẫm nước.', 'Tưới phun sương nhẹ 2 lần/ngày (07:00 và 16:30), độ ẩm đạt 75-90%.', 'Không áp dụng phân bón ở bước này.', 'Theo dõi sâu bệnh thường xuyên; ưu tiên bắt thủ công hoặc bẫy dính vàng nếu mật độ thấp.', 'Hạt giống F1 đạt kiểm định VietGAP (hoặc cây con vỉ ươm 3-4 lá), dung dịch kích rễ nhẹ.', 'Ảnh rạch gieo hạt & luống sau tưới', 'Mật độ cấy đều, cây con thẳng đứng, không vỡ bầu đất, rễ được tưới ẩm tiếp xúc tốt.', 25.0, 35.0, 75.0, 90.0),
(3, 1, 3, 'Tưới giữ ẩm & Kiểm tra mầm', 'IRRIGATION', 1, 3, 'Tưới phun sương mịn ngày 2 lần (7h sáng và 16h chiều). Kiểm tra tỷ lệ nảy mầm, duy trì độ ẩm đất trên 70%.', 'Tưới phun sương nhẹ 2 lần/ngày (07:00 và 16:30), độ ẩm đạt 70-85%.', 'Không áp dụng phân bón ở bước này.', 'Theo dõi sâu bệnh thường xuyên; ưu tiên bắt thủ công hoặc bẫy dính vàng nếu mật độ thấp.', 'Dụng cụ làm vườn chuyên dụng.', 'Ảnh mầm nhú xanh đều trên hàng', 'Thực hiện đầy đủ kỹ thuật bước Tưới giữ ẩm & Kiểm tra mầm, đạt chỉ tiêu sinh trưởng theo ngày tuổi 3.', 22.0, 35.0, 70.0, 85.0),
(4, 1, 4, 'Tỉa dặm & Định mật độ', 'CARE', 1, 7, 'Cây đạt 2 lá mầm, nhổ bỏ cây còi cọc, tỉa khoảng cách cây trên hàng 4-5cm. Nhổ sạch cỏ dại phát sinh.', 'Tưới nước sạch duy trì độ ẩm ổn định, không để đọng úng.', 'Không áp dụng phân bón ở bước này.', 'Theo dõi sâu bệnh thường xuyên; ưu tiên bắt thủ công hoặc bẫy dính vàng nếu mật độ thấp.', 'Dụng cụ làm vườn chuyên dụng.', 'Ảnh mật độ cây sau khi tỉa dặm', 'Thực hiện đầy đủ kỹ thuật bước Tỉa dặm & Định mật độ, đạt chỉ tiêu sinh trưởng theo ngày tuổi 7.', 22.0, 35.0, 70.0, 80.0),
(5, 1, 5, 'Bón thúc đợt 1 (Đạm cá hữu cơ)', 'FERTILIZATION', 1, 10, 'Hòa đạm cá ủ men vi sinh (hoặc bánh dầu hoai mục) tỷ lệ 1:200 tưới đều gốc. Xới nhẹ váng đất bề mặt giúp rễ hô hấp tốt.', 'Tưới nước sạch duy trì độ ẩm ổn định, không để đọng úng.', 'Tưới đạm cá hữu cơ lên men vi sinh pha loãng tỷ lệ 1:200 hoặc Acid Humic kích thích bộ rễ ăn sâu.', 'Theo dõi sâu bệnh thường xuyên; ưu tiên bắt thủ công hoặc bẫy dính vàng nếu mật độ thấp.', 'Phân đạm cá vi sinh EM, chế phẩm Acid Humic loãng, thùng tưới ô doa.', 'Ảnh thùng phân hòa loãng & tưới luống', 'Thực hiện đầy đủ kỹ thuật bước Bón thúc đợt 1 (Đạm cá hữu cơ), đạt chỉ tiêu sinh trưởng theo ngày tuổi 10.', 22.0, 35.0, 70.0, 80.0),
(6, 1, 6, 'Kiểm tra sâu hại & Phun BT', 'PEST_CONTROL', 1, 15, 'Kiểm tra mặt dưới lá tìm sâu tơ, sâu xanh. Phun phòng trừ bằng vi khuẩn Bacillus thuringiensis (BT - Delfin WG 15g/16L) vào chiều mát.', 'Tưới nước sạch duy trì độ ẩm ổn định, không để đọng úng.', 'Không áp dụng phân bón ở bước này.', 'Sâu tơ, sâu xanh, sâu khoang: Phun vi khuẩn sinh học Bacillus thuringiensis (BT - Delfin WG 15g/16L). PHI: 2-3 ngày.', 'Chế phẩm vi khuẩn BT (Delfin WG), bình phun chuyên dụng.', 'Ảnh bình phun & nhãn thuốc BT', 'Thực hiện đầy đủ kỹ thuật bước Kiểm tra sâu hại & Phun BT, đạt chỉ tiêu sinh trưởng theo ngày tuổi 15.', 20.0, 32.0, 65.0, 80.0),
(7, 1, 7, 'Bón thúc đợt 2 (Dịch chuối Humic)', 'FERTILIZATION', 1, 18, 'Tưới bổ sung dịch chuối lên men giàu kali + Acid Humic giúp thân mập, bẹ lá dày, ngọn vươn nhanh.', 'Tưới phun sương nhẹ 2 lần/ngày (07:00 và 16:30), độ ẩm đạt 70-85%.', 'Bổ sung dịch chuối ủ men giàu Kali hữu cơ + Amino Acid giúp thân mập, bẹ nở to giòn ngọt.', 'Theo dõi sâu bệnh thường xuyên; ưu tiên bắt thủ công hoặc bẫy dính vàng nếu mật độ thấp.', 'Dịch chuối ủ Kali vi sinh, phân bón lá Amino Acid sinh học.', 'Ảnh rễ cây mọc khỏe & ngọn xanh bóng', 'Thực hiện đầy đủ kỹ thuật bước Bón thúc đợt 2 (Dịch chuối Humic), đạt chỉ tiêu sinh trưởng theo ngày tuổi 18.', 22.0, 35.0, 70.0, 85.0),
(8, 1, 8, 'Cách ly an toàn & Chỉ tưới nước', 'SAFETY_INTERVAL', 1, 23, 'Kiểm tra sâu bệnh lần cuối, tuyệt đối ngừng toàn bộ phân bón và thuốc BVTV. Chỉ duy trì tưới nước sạch đủ ẩm.', 'Ngừng tưới 24h trước thu hái để rau ráo nước, bảo quản tươi ngon lâu dài.', 'Không áp dụng phân bón ở bước này.', 'Giai đoạn cách ly an toàn (PHI): TUYỆT ĐỐI NGỪNG toàn bộ phân bón hóa học và thuốc BVTV. Chỉ tưới nước sạch.', 'Dụng cụ làm vườn chuyên dụng.', 'Ảnh luống rau đồng đều trước thu hoạch', 'Thực hiện đầy đủ kỹ thuật bước Cách ly an toàn & Chỉ tưới nước, đạt chỉ tiêu sinh trưởng theo ngày tuổi 23.', 22.0, 35.0, 70.0, 80.0),
(9, 1, 9, 'Thu hoạch & Nghiệm thu sản lượng', 'HARVEST', 1, 26, 'Cắt ngọn sát gốc chừa lại 3cm nách lá để tái sinh (hoặc nhổ tỉa cả gốc). Cân điện tử, đóng sọt giao khách/lưu kho.', 'Ngừng tưới 24h trước thu hái để rau ráo nước, bảo quản tươi ngon lâu dài.', 'Không áp dụng phân bón ở bước này.', 'Theo dõi sâu bệnh thường xuyên; ưu tiên bắt thủ công hoặc bẫy dính vàng nếu mật độ thấp.', 'Dụng cụ làm vườn chuyên dụng.', 'Ảnh cân điện tử hiển thị số kg & sọt rau', 'Đạt chỉ tiêu thu hái an toàn: không dư lượng BVTV (PHI >= 5 ngày), tươi giòn, đúng kích thước thương phẩm, cân điện tử ghi nhận chính xác.', 20.0, 32.0, 60.0, 75.0)
ON CONFLICT (step_id) DO UPDATE SET
    template_id          = EXCLUDED.template_id,
    step_order           = EXCLUDED.step_order,
    step_name            = EXCLUDED.step_name,
    task_type            = EXCLUDED.task_type,
    duration_days        = EXCLUDED.duration_days,
    day_offset           = EXCLUDED.day_offset,
    description          = EXCLUDED.description,
    water_regime         = EXCLUDED.water_regime,
    nutrition_regime     = EXCLUDED.nutrition_regime,
    pest_warning         = EXCLUDED.pest_warning,
    materials_needed     = EXCLUDED.materials_needed,
    evidence_requirement = EXCLUDED.evidence_requirement,
    inspection_criteria  = EXCLUDED.inspection_criteria,
    min_temp             = EXCLUDED.min_temp,
    max_temp             = EXCLUDED.max_temp,
    min_humidity         = EXCLUDED.min_humidity,
    max_humidity         = EXCLUDED.max_humidity;

-- ============================================================================
-- TEMPLATE 2: Cải Ngọt & Cải Ăn Lá (Mustard Greens) (8 TASKS)
-- ============================================================================
INSERT INTO template_steps (step_id, template_id, step_order, step_name, task_type, duration_days, day_offset, description, water_regime, nutrition_regime, pest_warning, materials_needed, evidence_requirement, inspection_criteria, min_temp, max_temp, min_humidity, max_humidity) VALUES
(10, 2, 1, 'Lên luống & Bón lót', 'SOIL_PREP', 1, 0, 'Lên luống cao 20cm rãnh rộng 30cm thoát nước. Bón lót phân trùn quế 1.2kg/m2 + vôi bột khử khuẩn + lân vi sinh. Cào phẳng.', 'Tưới nước sạch duy trì độ ẩm ổn định, không để đọng úng.', 'Bón lót phân trùn quế hoai mục (1.2 - 2.0 kg/m²) phối trộn vôi khử khuẩn và nấm Trichoderma.', 'Theo dõi sâu bệnh thường xuyên; ưu tiên bắt thủ công hoặc bẫy dính vàng nếu mật độ thấp.', 'Phân trùn quế hoai mục, vôi bột nông nghiệp, nấm đối kháng Trichoderma.', 'Ảnh luống cao ráo và phân bón lót', 'Đất tơi xốp sâu >= 20cm, luống thẳng cao ráo thoát nước, phân lót san phẳng đều.', 20.0, 32.0, 60.0, 75.0),
(11, 2, 2, 'Cấy cây con giống F1', 'PLANTING', 1, 1, 'Cấy cây con 10-12 ngày tuổi (3 lá thật) theo khoảng cách 15x15cm. Ấn nhẹ gốc, tưới đẫm nước bằng vòi sen mịn.', 'Tưới nước sạch duy trì độ ẩm ổn định, không để đọng úng.', 'Không áp dụng phân bón ở bước này.', 'Theo dõi sâu bệnh thường xuyên; ưu tiên bắt thủ công hoặc bẫy dính vàng nếu mật độ thấp.', 'Hạt giống F1 đạt kiểm định VietGAP (hoặc cây con vỉ ươm 3-4 lá), dung dịch kích rễ nhẹ.', 'Ảnh hàng cây sau cấy thẳng hàng', 'Mật độ cấy đều, cây con thẳng đứng, không vỡ bầu đất, rễ được tưới ẩm tiếp xúc tốt.', 22.0, 32.0, 70.0, 85.0),
(12, 2, 3, 'Tưới hồi xanh & Kích rễ', 'FERTILIZATION', 1, 5, 'Tưới phân bón lá kích rễ hữu cơ sinh học (Roots 2 hoặc Acid Humic loãng). Bù cây héo chết nếu có.', 'Tưới phun sương nhẹ 2 lần/ngày (07:00 và 16:30), độ ẩm đạt 65-75%.', 'Tưới bổ sung dịch trùn quế hoặc phân hữu cơ vi sinh cân đối N-P-K.', 'Theo dõi sâu bệnh thường xuyên; ưu tiên bắt thủ công hoặc bẫy dính vàng nếu mật độ thấp.', 'Phân hữu cơ sinh học đạt chuẩn VietGAP.', 'Ảnh đọt non nhú lá mới', 'Thực hiện đầy đủ kỹ thuật bước Tưới hồi xanh & Kích rễ, đạt chỉ tiêu sinh trưởng theo ngày tuổi 5.', 22.0, 32.0, 65.0, 75.0),
(13, 2, 4, 'Bón thúc đợt 1 & Xới xáo', 'FERTILIZATION', 1, 10, 'Tưới đạm hữu cơ vi sinh (phân đạm cá hoặc bánh dầu hoai). Xới nhẹ phá váng đất mặt, nhặt sạch cỏ dại.', 'Tưới phun sương nhẹ 2 lần/ngày (07:00 và 16:30), độ ẩm đạt 65-75%.', 'Tưới đạm cá hữu cơ lên men vi sinh pha loãng tỷ lệ 1:200 hoặc Acid Humic kích thích bộ rễ ăn sâu.', 'Theo dõi sâu bệnh thường xuyên; ưu tiên bắt thủ công hoặc bẫy dính vàng nếu mật độ thấp.', 'Phân đạm cá vi sinh EM, chế phẩm Acid Humic loãng, thùng tưới ô doa.', 'Ảnh gốc cải xanh và đất tơi xốp', 'Thực hiện đầy đủ kỹ thuật bước Bón thúc đợt 1 & Xới xáo, đạt chỉ tiêu sinh trưởng theo ngày tuổi 10.', 20.0, 32.0, 65.0, 75.0),
(14, 2, 5, 'Phòng trừ bọ nhảy sọc cong', 'PEST_CONTROL', 1, 15, 'Kiểm tra mật độ bọ nhảy. Phun thảo mộc Matrine (Wotac 5EC) hoặc nấm ký sinh Metarhizium (nấm xanh) lúc sáng sớm lúc bọ chưa bay.', 'Tưới nước sạch duy trì độ ẩm ổn định, không để đọng úng.', 'Không áp dụng phân bón ở bước này.', 'Bọ nhảy sọc cong: Phun thảo mộc Matrine (Wotac 5EC) hoặc nấm xanh Metarhizium sáng sớm. PHI: 3 ngày.', 'Chế phẩm thảo mộc Matrine (Wotac 5EC) / Nấm xanh Metarhizium, bình phun.', 'Ảnh thao tác phun kỹ mặt lá và đất', 'Thực hiện đầy đủ kỹ thuật bước Phòng trừ bọ nhảy sọc cong, đạt chỉ tiêu sinh trưởng theo ngày tuổi 15.', 20.0, 30.0, 60.0, 75.0),
(15, 2, 6, 'Bón thúc đợt 2 & Nuôi bẹ lá', 'FERTILIZATION', 1, 20, 'Tưới bổ sung dịch đạm Amino Acid + dịch rong biển giúp bẹ cải nở tròn, giòn dẻo, ngọt vị.', 'Tưới phun sương nhẹ 2 lần/ngày (07:00 và 16:30), độ ẩm đạt 65-75%.', 'Bổ sung dịch chuối ủ men giàu Kali hữu cơ + Amino Acid giúp thân mập, bẹ nở to giòn ngọt.', 'Theo dõi sâu bệnh thường xuyên; ưu tiên bắt thủ công hoặc bẫy dính vàng nếu mật độ thấp.', 'Dịch chuối ủ Kali vi sinh, phân bón lá Amino Acid sinh học.', 'Ảnh bẹ lá cải nở to đều', 'Thực hiện đầy đủ kỹ thuật bước Bón thúc đợt 2 & Nuôi bẹ lá, đạt chỉ tiêu sinh trưởng theo ngày tuổi 20.', 22.0, 32.0, 65.0, 75.0),
(16, 2, 7, 'Cách ly tuyệt đối & Phòng thối nhũn', 'SAFETY_INTERVAL', 1, 26, 'Ngừng toàn bộ phân bón. Nếu có vết đốm lá vi khuẩn phun nhẹ Kasugamycin (Kasumin 2SL), duy trì cách ly 5 ngày trước thu.', 'Ngừng tưới 24h trước thu hái để rau ráo nước, bảo quản tươi ngon lâu dài.', 'Không áp dụng phân bón ở bước này.', 'Giai đoạn cách ly an toàn (PHI): TUYỆT ĐỐI NGỪNG toàn bộ phân bón hóa học và thuốc BVTV. Chỉ tưới nước sạch.', 'Dụng cụ làm vườn chuyên dụng.', 'Ảnh luống cải tươi tốt không sâu bệnh', 'Thực hiện đầy đủ kỹ thuật bước Cách ly tuyệt đối & Phòng thối nhũn, đạt chỉ tiêu sinh trưởng theo ngày tuổi 26.', 20.0, 32.0, 60.0, 70.0),
(17, 2, 8, 'Thu hoạch & Nghiệm thu', 'HARVEST', 1, 32, 'Cắt sát gốc khi bẹ cải đẫy sức trước khi trổ hoa. Loại bỏ lá già sát đất, cân trọng lượng, chụp ảnh lưu kết quả thu hoạch.', 'Ngừng tưới 24h trước thu hái để rau ráo nước, bảo quản tươi ngon lâu dài.', 'Không áp dụng phân bón ở bước này.', 'Theo dõi sâu bệnh thường xuyên; ưu tiên bắt thủ công hoặc bẫy dính vàng nếu mật độ thấp.', 'Dụng cụ làm vườn chuyên dụng.', 'Ảnh cân ký sản lượng & sọt cải thành phẩm', 'Đạt chỉ tiêu thu hái an toàn: không dư lượng BVTV (PHI >= 5 ngày), tươi giòn, đúng kích thước thương phẩm, cân điện tử ghi nhận chính xác.', 20.0, 30.0, 60.0, 75.0)
ON CONFLICT (step_id) DO UPDATE SET
    template_id          = EXCLUDED.template_id,
    step_order           = EXCLUDED.step_order,
    step_name            = EXCLUDED.step_name,
    task_type            = EXCLUDED.task_type,
    duration_days        = EXCLUDED.duration_days,
    day_offset           = EXCLUDED.day_offset,
    description          = EXCLUDED.description,
    water_regime         = EXCLUDED.water_regime,
    nutrition_regime     = EXCLUDED.nutrition_regime,
    pest_warning         = EXCLUDED.pest_warning,
    materials_needed     = EXCLUDED.materials_needed,
    evidence_requirement = EXCLUDED.evidence_requirement,
    inspection_criteria  = EXCLUDED.inspection_criteria,
    min_temp             = EXCLUDED.min_temp,
    max_temp             = EXCLUDED.max_temp,
    min_humidity         = EXCLUDED.min_humidity,
    max_humidity         = EXCLUDED.max_humidity;

-- ============================================================================
-- TEMPLATE 3: Xà Lách Xoăn (Curly Lettuce) (8 TASKS)
-- ============================================================================
INSERT INTO template_steps (step_id, template_id, step_order, step_name, task_type, duration_days, day_offset, description, water_regime, nutrition_regime, pest_warning, materials_needed, evidence_requirement, inspection_criteria, min_temp, max_temp, min_humidity, max_humidity) VALUES
(18, 3, 1, 'Xử lý đất giá thể & Lên luống', 'SOIL_PREP', 1, 0, 'Đất phối trộn nhiều xơ dừa hoai, phân trùn quế, nấm Trichoderma. Lên luống cao 20cm đảm bảo thoát nước tối đa.', 'Tưới nước sạch duy trì độ ẩm ổn định, không để đọng úng.', 'Bón lót phân trùn quế (1.5kg/m²) + vôi bột khử khuẩn + lân vi sinh nung chảy.', 'Theo dõi sâu bệnh thường xuyên; ưu tiên bắt thủ công hoặc bẫy dính vàng nếu mật độ thấp.', 'Phân trùn quế, vôi bột, nấm Trichoderma, cuốc/cào san phẳng.', 'Ảnh luống đất tơi mịn, xốp', 'Đất tơi xốp sâu >= 20cm, luống thẳng cao ráo thoát nước, phân lót san phẳng đều.', 18.0, 28.0, 60.0, 70.0),
(19, 3, 2, 'Cấy cây giống từ vỉ ươm', 'PLANTING', 1, 1, 'Cấy cây con 12 ngày tuổi mật độ 20x20cm. Tưới phun sương nhẹ nhàng, che lưới đen giảm bức xạ nắng 2 ngày đầu.', 'Tưới phun sương nhẹ 2 lần/ngày (07:00 và 16:30), độ ẩm đạt 65-75%.', 'Không áp dụng phân bón ở bước này.', 'Theo dõi sâu bệnh thường xuyên; ưu tiên bắt thủ công hoặc bẫy dính vàng nếu mật độ thấp.', 'Hạt giống F1 đạt kiểm định VietGAP (hoặc cây con vỉ ươm 3-4 lá), dung dịch kích rễ nhẹ.', 'Ảnh luống cấy phủ lưới che mát', 'Mật độ cấy đều, cây con thẳng đứng, không vỡ bầu đất, rễ được tưới ẩm tiếp xúc tốt.', 18.0, 26.0, 65.0, 75.0),
(20, 3, 3, 'Bén rễ & Dỡ lưới che', 'CARE', 1, 6, 'Dỡ lưới che để cây đón nắng. Duy trì tưới phun sương 2 lần/ngày (8h sáng và 15h chiều). Nhặt lá chân úa.', 'Tưới nước sạch duy trì độ ẩm ổn định, không để đọng úng.', 'Không áp dụng phân bón ở bước này.', 'Theo dõi sâu bệnh thường xuyên; ưu tiên bắt thủ công hoặc bẫy dính vàng nếu mật độ thấp.', 'Dụng cụ làm vườn chuyên dụng.', 'Ảnh cây đứng thẳng bén rễ xanh', 'Thực hiện đầy đủ kỹ thuật bước Bén rễ & Dỡ lưới che, đạt chỉ tiêu sinh trưởng theo ngày tuổi 6.', 18.0, 28.0, 60.0, 70.0),
(21, 3, 4, 'Bón thúc đợt 1 & Bả ốc sên', 'FERTILIZATION', 1, 12, 'Tưới dịch trùn quế loãng kích thích xòe tán. Rải bả mồi sinh học Ferric Phosphate (Snail Kill) quanh mép luống trừ ốc sên.', 'Tưới phun sương nhẹ 2 lần/ngày (07:00 và 16:30), độ ẩm đạt 60-70%.', 'Tưới đạm cá hữu cơ lên men vi sinh pha loãng tỷ lệ 1:200 hoặc Acid Humic kích thích bộ rễ ăn sâu.', 'Theo dõi sâu bệnh thường xuyên; ưu tiên bắt thủ công hoặc bẫy dính vàng nếu mật độ thấp.', 'Phân đạm cá vi sinh EM, chế phẩm Acid Humic loãng, thùng tưới ô doa.', 'Ảnh bả ốc rải quanh mép & gốc rau', 'Thực hiện đầy đủ kỹ thuật bước Bón thúc đợt 1 & Bả ốc sên, đạt chỉ tiêu sinh trưởng theo ngày tuổi 12.', 18.0, 28.0, 60.0, 70.0),
(22, 3, 5, 'Kiểm tra rệp & Phun dầu khoáng', 'PEST_CONTROL', 1, 20, 'Vạch kẽ lá kiểm tra rệp muội. Phun dầu khoáng sinh học SK Enspray 99EC nồng độ 0.3% phủ đều 2 mặt lá.', 'Tưới nước sạch duy trì độ ẩm ổn định, không để đọng úng.', 'Không áp dụng phân bón ở bước này.', 'Bọ trĩ, rệp muội: Phun tinh dầu Neem hữu cơ hoặc dầu khoáng SK Enspray 99EC (0.3%). PHI: 2-3 ngày.', 'Tinh dầu Neem hữu cơ hoặc dầu khoáng SK Enspray 99EC, bẫy dính màu vàng.', 'Ảnh kiểm tra kẽ lá xà lách sạch sâu', 'Thực hiện đầy đủ kỹ thuật bước Kiểm tra rệp & Phun dầu khoáng, đạt chỉ tiêu sinh trưởng theo ngày tuổi 20.', 18.0, 26.0, 55.0, 70.0),
(23, 3, 6, 'Bón thúc đợt 2 & Phun Canxi-Bo', 'FERTILIZATION', 1, 28, 'Phun Canxi-Bo hữu cơ ngừa hiện tượng cháy bìa lá (Tip-burn). Tưới gốc bổ sung dịch bánh dầu hoai mục.', 'Tưới phun sương nhẹ 2 lần/ngày (07:00 và 16:30), độ ẩm đạt 60-70%.', 'Bổ sung dịch chuối ủ men giàu Kali hữu cơ + Amino Acid giúp thân mập, bẹ nở to giòn ngọt.', 'Theo dõi sâu bệnh thường xuyên; ưu tiên bắt thủ công hoặc bẫy dính vàng nếu mật độ thấp.', 'Dịch chuối ủ Kali vi sinh, phân bón lá Amino Acid sinh học.', 'Ảnh tán xà lách xoăn cuộn dày', 'Thực hiện đầy đủ kỹ thuật bước Bón thúc đợt 2 & Phun Canxi-Bo, đạt chỉ tiêu sinh trưởng theo ngày tuổi 28.', 18.0, 28.0, 60.0, 70.0),
(24, 3, 7, 'Cách ly phân thuốc & Tưới gốc', 'SAFETY_INTERVAL', 1, 36, 'Ngừng toàn bộ phân bón lá và thuốc. Chỉ tưới nước sạch trực tiếp vào gốc, tránh đọng nước trên bẹ lá sinh nấm.', 'Tưới phun sương nhẹ 2 lần/ngày (07:00 và 16:30), độ ẩm đạt 55-65%.', 'Không áp dụng phân bón ở bước này.', 'Giai đoạn cách ly an toàn (PHI): TUYỆT ĐỐI NGỪNG toàn bộ phân bón hóa học và thuốc BVTV. Chỉ tưới nước sạch.', 'Dụng cụ làm vườn chuyên dụng.', 'Ảnh bụi xà lách nở tròn đều', 'Thực hiện đầy đủ kỹ thuật bước Cách ly phân thuốc & Tưới gốc, đạt chỉ tiêu sinh trưởng theo ngày tuổi 36.', 18.0, 26.0, 55.0, 65.0),
(25, 3, 8, 'Thu hoạch & Đóng gói', 'HARVEST', 1, 42, 'Dùng dao cắt ngang gốc sáng sớm khi sương vừa tan. Xếp khay xốp bọc màng thực phẩm, cân ký nghiệm thu.', 'Ngừng tưới 24h trước thu hái để rau ráo nước, bảo quản tươi ngon lâu dài.', 'Không áp dụng phân bón ở bước này.', 'Theo dõi sâu bệnh thường xuyên; ưu tiên bắt thủ công hoặc bẫy dính vàng nếu mật độ thấp.', 'Dụng cụ làm vườn chuyên dụng.', 'Ảnh cân điện tử & cây xà lách tươi giòn', 'Đạt chỉ tiêu thu hái an toàn: không dư lượng BVTV (PHI >= 5 ngày), tươi giòn, đúng kích thước thương phẩm, cân điện tử ghi nhận chính xác.', 16.0, 25.0, 50.0, 65.0)
ON CONFLICT (step_id) DO UPDATE SET
    template_id          = EXCLUDED.template_id,
    step_order           = EXCLUDED.step_order,
    step_name            = EXCLUDED.step_name,
    task_type            = EXCLUDED.task_type,
    duration_days        = EXCLUDED.duration_days,
    day_offset           = EXCLUDED.day_offset,
    description          = EXCLUDED.description,
    water_regime         = EXCLUDED.water_regime,
    nutrition_regime     = EXCLUDED.nutrition_regime,
    pest_warning         = EXCLUDED.pest_warning,
    materials_needed     = EXCLUDED.materials_needed,
    evidence_requirement = EXCLUDED.evidence_requirement,
    inspection_criteria  = EXCLUDED.inspection_criteria,
    min_temp             = EXCLUDED.min_temp,
    max_temp             = EXCLUDED.max_temp,
    min_humidity         = EXCLUDED.min_humidity,
    max_humidity         = EXCLUDED.max_humidity;

-- ============================================================================
-- TEMPLATE 4: Cà Chua Bi / Cherry (Cherry Tomato) (11 TASKS)
-- ============================================================================
INSERT INTO template_steps (step_id, template_id, step_order, step_name, task_type, duration_days, day_offset, description, water_regime, nutrition_regime, pest_warning, materials_needed, evidence_requirement, inspection_criteria, min_temp, max_temp, min_humidity, max_humidity) VALUES
(26, 4, 1, 'Làm đất sâu & Bón lót đáy', 'SOIL_PREP', 1, 0, 'Đào hố sâu 25cm bón lót phân chuồng hoai 2kg/gốc + vôi bột khử chua + lân super + Trichoderma ngừa héo rũ gốc.', 'Tưới nước sạch duy trì độ ẩm ổn định, không để đọng úng.', 'Bón lót phân trùn quế hoai mục (1.2 - 2.0 kg/m²) phối trộn vôi khử khuẩn và nấm Trichoderma.', 'Sâu tơ, sâu xanh, sâu khoang: Phun vi khuẩn sinh học Bacillus thuringiensis (BT - Delfin WG 15g/16L). PHI: 2-3 ngày.', 'Chế phẩm vi khuẩn BT (Delfin WG), bình phun chuyên dụng.', 'Ảnh hố bón lót & rãnh luống sâu', 'Đất tơi xốp sâu >= 20cm, luống thẳng cao ráo thoát nước, phân lót san phẳng đều.', 20.0, 30.0, 60.0, 75.0),
(27, 4, 2, 'Cấy cây con & Định vị', 'PLANTING', 1, 1, 'Cấy cây con 4 lá thật mật độ 50x70cm. Cắm que tre nhỏ định vị thân mềm tránh gió lay đổ ngã. Tưới đẫm nước.', 'Tưới phun sương nhẹ 2 lần/ngày (07:00 và 16:30), độ ẩm đạt 65-75%.', 'Không áp dụng phân bón ở bước này.', 'Theo dõi sâu bệnh thường xuyên; ưu tiên bắt thủ công hoặc bẫy dính vàng nếu mật độ thấp.', 'Hạt giống F1 đạt kiểm định VietGAP (hoặc cây con vỉ ươm 3-4 lá), dung dịch kích rễ nhẹ.', 'Ảnh hàng cây con cắm que định vị', 'Mật độ cấy đều, cây con thẳng đứng, không vỡ bầu đất, rễ được tưới ẩm tiếp xúc tốt.', 20.0, 28.0, 65.0, 75.0),
(28, 4, 3, 'Bén rễ & Tưới kích rễ đợt 1', 'FERTILIZATION', 1, 10, 'Tưới phân kích rễ Humic + đạm cá loãng. Kiểm tra độ ẩm đất duy trì 65-75%.', 'Tưới phun sương nhẹ 2 lần/ngày (07:00 và 16:30), độ ẩm đạt 65-75%.', 'Tưới đạm cá hữu cơ lên men vi sinh pha loãng tỷ lệ 1:200 hoặc Acid Humic kích thích bộ rễ ăn sâu.', 'Theo dõi sâu bệnh thường xuyên; ưu tiên bắt thủ công hoặc bẫy dính vàng nếu mật độ thấp.', 'Phân đạm cá vi sinh EM, chế phẩm Acid Humic loãng, thùng tưới ô doa.', 'Ảnh rễ phát triển đọt non vươn cao', 'Thực hiện đầy đủ kỹ thuật bước Bén rễ & Tưới kích rễ đợt 1, đạt chỉ tiêu sinh trưởng theo ngày tuổi 10.', 20.0, 30.0, 65.0, 75.0),
(29, 4, 4, 'Cắm cọc giàn & Buộc dây treo', 'PRUNING', 1, 18, 'Cắm cọc tre cao 1.8m hoặc buộc dây treo trần nhà lưới. Quấn thân cà chua theo dây. Vặt bỏ các lá già sát đất.', 'Tưới nước sạch duy trì độ ẩm ổn định, không để đọng úng.', 'Không áp dụng phân bón ở bước này.', 'Theo dõi sâu bệnh thường xuyên; ưu tiên bắt thủ công hoặc bẫy dính vàng nếu mật độ thấp.', 'Kéo cắt cành chuyên dụng (đã khử trùng cồn 70°), cọc tre, dây đay hoặc lưới giàn cước.', 'Ảnh giàn cọc & thân cây quấn dây', 'Thực hiện đầy đủ kỹ thuật bước Cắm cọc giàn & Buộc dây treo, đạt chỉ tiêu sinh trưởng theo ngày tuổi 18.', 20.0, 30.0, 60.0, 70.0),
(30, 4, 5, 'Tỉa chồi nách & Bón thúc thân', 'PRUNING', 1, 28, 'Vặt sạch toàn bộ chồi phụ ở nách lá, chỉ giữ 1 thân chính duy nhất. Bón thúc NPK hữu cơ 20-20-15 quanh tán cây.', 'Tưới nước sạch duy trì độ ẩm ổn định, không để đọng úng.', 'Tưới bổ sung dịch trùn quế hoặc phân hữu cơ vi sinh cân đối N-P-K.', 'Theo dõi sâu bệnh thường xuyên; ưu tiên bắt thủ công hoặc bẫy dính vàng nếu mật độ thấp.', 'Phân hữu cơ sinh học đạt chuẩn VietGAP.', 'Ảnh nách lá sau khi vặt sạch chồi', 'Thực hiện đầy đủ kỹ thuật bước Tỉa chồi nách & Bón thúc thân, đạt chỉ tiêu sinh trưởng theo ngày tuổi 28.', 20.0, 30.0, 60.0, 75.0),
(31, 4, 6, 'Bón đón hoa & Phòng bọ trĩ', 'FERTILIZATION', 1, 40, 'Phun vi lượng Bo chống rụng hoa. Phun phòng bọ trĩ bằng tinh dầu Neem phối hợp Abamectin sinh học.', 'Tưới nước sạch duy trì độ ẩm ổn định, không để đọng úng.', 'Tưới bổ sung dịch trùn quế hoặc phân hữu cơ vi sinh cân đối N-P-K.', 'Bọ trĩ, rệp muội: Phun tinh dầu Neem hữu cơ hoặc dầu khoáng SK Enspray 99EC (0.3%). PHI: 2-3 ngày.', 'Tinh dầu Neem hữu cơ hoặc dầu khoáng SK Enspray 99EC, bẫy dính màu vàng.', 'Ảnh chùm nụ hoa đầu tiên xuất hiện', 'Thực hiện đầy đủ kỹ thuật bước Bón đón hoa & Phòng bọ trĩ, đạt chỉ tiêu sinh trưởng theo ngày tuổi 40.', 20.0, 28.0, 60.0, 70.0),
(32, 4, 7, 'Hỗ trợ thụ phấn & Phun Canxi-Bo', 'CARE', 1, 48, 'Rung nhẹ dây giàn lúc 8:30 sáng giúp phấn hoa bung đều. Phun Canxi-Bo sữa sinh học ngăn thối đít quả.', 'Tưới nước sạch duy trì độ ẩm ổn định, không để đọng úng.', 'Không áp dụng phân bón ở bước này.', 'Theo dõi sâu bệnh thường xuyên; ưu tiên bắt thủ công hoặc bẫy dính vàng nếu mật độ thấp.', 'Dụng cụ làm vườn chuyên dụng.', 'Ảnh chùm quả non xanh đậu đều', 'Thực hiện đầy đủ kỹ thuật bước Hỗ trợ thụ phấn & Phun Canxi-Bo, đạt chỉ tiêu sinh trưởng theo ngày tuổi 48.', 20.0, 28.0, 60.0, 70.0),
(33, 4, 8, 'Tỉa lá già & Bón thúc quả lớn', 'PRUNING', 1, 58, 'Cắt tỉa lá già vàng bên dưới chùm quả thứ nhất. Bón thúc Kali hữu cơ (dịch chuối ủ vi sinh) giúp quả bóng mọng.', 'Tưới nước sạch duy trì độ ẩm ổn định, không để đọng úng.', 'Bổ sung dịch chuối ủ men giàu Kali hữu cơ + Amino Acid giúp thân mập, bẹ nở to giòn ngọt.', 'Theo dõi sâu bệnh thường xuyên; ưu tiên bắt thủ công hoặc bẫy dính vàng nếu mật độ thấp.', 'Dịch chuối ủ Kali vi sinh, phân bón lá Amino Acid sinh học.', 'Ảnh các chùm quả lớn đẫy sức', 'Thực hiện đầy đủ kỹ thuật bước Tỉa lá già & Bón thúc quả lớn, đạt chỉ tiêu sinh trưởng theo ngày tuổi 58.', 20.0, 30.0, 65.0, 75.0),
(34, 4, 9, 'Ngừng thuốc BVTV & Thúc ngọt', 'SAFETY_INTERVAL', 1, 68, 'Ngừng toàn bộ thuốc BVTV. Tưới thúc kali lần cuối giúp quả chuyển màu đỏ tươi và tăng độ ngọt (Brix).', 'Tưới phun sương nhẹ 2 lần/ngày (07:00 và 16:30), độ ẩm đạt 60-70%.', 'Không áp dụng phân bón ở bước này.', 'Giai đoạn cách ly an toàn (PHI): TUYỆT ĐỐI NGỪNG toàn bộ phân bón hóa học và thuốc BVTV. Chỉ tưới nước sạch.', 'Dụng cụ làm vườn chuyên dụng.', 'Ảnh quả bắt đầu chuyển màu vàng cam', 'Thực hiện đầy đủ kỹ thuật bước Ngừng thuốc BVTV & Thúc ngọt, đạt chỉ tiêu sinh trưởng theo ngày tuổi 68.', 20.0, 30.0, 60.0, 70.0),
(35, 4, 10, 'Thu hoạch đợt 1 (Quả chín đỏ)', 'HARVEST', 1, 75, 'Dùng kéo cắt từng chùm hoặc quả đơn đạt độ chín 85%. Cân điện tử, chụp ảnh hiện trường lưu Harvest Result.', 'Ngừng tưới 24h trước thu hái để rau ráo nước, bảo quản tươi ngon lâu dài.', 'Không áp dụng phân bón ở bước này.', 'Theo dõi sâu bệnh thường xuyên; ưu tiên bắt thủ công hoặc bẫy dính vàng nếu mật độ thấp.', 'Dụng cụ làm vườn chuyên dụng.', 'Ảnh chùm quả chín đỏ rực & cân ký', 'Đạt chỉ tiêu thu hái an toàn: không dư lượng BVTV (PHI >= 5 ngày), tươi giòn, đúng kích thước thương phẩm, cân điện tử ghi nhận chính xác.', 20.0, 28.0, 55.0, 65.0),
(36, 4, 11, 'Thu hoạch vét & Thu dọn tàn dư', 'HARVEST', 1, 82, 'Thu toàn bộ quả còn lại, cắt dây hạ giàn, thu gom gốc rễ chuyển sang chế độ Maintenance nghỉ đất.', 'Ngừng tưới 24h trước thu hái để rau ráo nước, bảo quản tươi ngon lâu dài.', 'Không áp dụng phân bón ở bước này.', 'Theo dõi sâu bệnh thường xuyên; ưu tiên bắt thủ công hoặc bẫy dính vàng nếu mật độ thấp.', 'Dụng cụ làm vườn chuyên dụng.', 'Ảnh Plot dọn sạch tàn dư chuẩn bị ải', 'Đạt chỉ tiêu thu hái an toàn: không dư lượng BVTV (PHI >= 5 ngày), tươi giòn, đúng kích thước thương phẩm, cân điện tử ghi nhận chính xác.', 20.0, 30.0, 55.0, 65.0)
ON CONFLICT (step_id) DO UPDATE SET
    template_id          = EXCLUDED.template_id,
    step_order           = EXCLUDED.step_order,
    step_name            = EXCLUDED.step_name,
    task_type            = EXCLUDED.task_type,
    duration_days        = EXCLUDED.duration_days,
    day_offset           = EXCLUDED.day_offset,
    description          = EXCLUDED.description,
    water_regime         = EXCLUDED.water_regime,
    nutrition_regime     = EXCLUDED.nutrition_regime,
    pest_warning         = EXCLUDED.pest_warning,
    materials_needed     = EXCLUDED.materials_needed,
    evidence_requirement = EXCLUDED.evidence_requirement,
    inspection_criteria  = EXCLUDED.inspection_criteria,
    min_temp             = EXCLUDED.min_temp,
    max_temp             = EXCLUDED.max_temp,
    min_humidity         = EXCLUDED.min_humidity,
    max_humidity         = EXCLUDED.max_humidity;

-- ============================================================================
-- TEMPLATE 5: Dưa Leo Baby (Mini Cucumber) (10 TASKS)
-- ============================================================================
INSERT INTO template_steps (step_id, template_id, step_order, step_name, task_type, duration_days, day_offset, description, water_regime, nutrition_regime, pest_warning, materials_needed, evidence_requirement, inspection_criteria, min_temp, max_temp, min_humidity, max_humidity) VALUES
(37, 5, 1, 'Làm đất xốp & Bón lót rãnh', 'SOIL_PREP', 1, 0, 'Đánh luống cao 25cm, rạch rãnh bón lót phân trùn quế 2kg/m2 + lân nung chảy + nấm đối kháng Trichoderma. Lấp đất màu.', 'Tưới nước sạch duy trì độ ẩm ổn định, không để đọng úng.', 'Bón lót phân trùn quế hoai mục (1.2 - 2.0 kg/m²) phối trộn vôi khử khuẩn và nấm Trichoderma.', 'Theo dõi sâu bệnh thường xuyên; ưu tiên bắt thủ công hoặc bẫy dính vàng nếu mật độ thấp.', 'Phân trùn quế hoai mục, vôi bột nông nghiệp, nấm đối kháng Trichoderma.', 'Ảnh luống cao rãnh rạch phân lót', 'Đất tơi xốp sâu >= 20cm, luống thẳng cao ráo thoát nước, phân lót san phẳng đều.', 22.0, 32.0, 65.0, 75.0),
(38, 5, 2, 'Cấy cây con bầu ươm', 'PLANTING', 1, 1, 'Cấy cây con 8 ngày tuổi mật độ 40x50cm. Tưới đẫm nước xung quanh bầu rễ.', 'Tưới phun sương nhẹ 2 lần/ngày (07:00 và 16:30), độ ẩm đạt 70-80%.', 'Không áp dụng phân bón ở bước này.', 'Theo dõi sâu bệnh thường xuyên; ưu tiên bắt thủ công hoặc bẫy dính vàng nếu mật độ thấp.', 'Hạt giống F1 đạt kiểm định VietGAP (hoặc cây con vỉ ươm 3-4 lá), dung dịch kích rễ nhẹ.', 'Ảnh bầu cây con thẳng hàng trên luống', 'Mật độ cấy đều, cây con thẳng đứng, không vỡ bầu đất, rễ được tưới ẩm tiếp xúc tốt.', 22.0, 32.0, 70.0, 80.0),
(39, 5, 3, 'Bén rễ & Bón kích ngọn đọt', 'FERTILIZATION', 1, 7, 'Cây bén rễ nhanh, tưới thúc đạm cá hữu cơ loãng kích thích phát triển rễ phụ và ngọn leo.', 'Tưới nước sạch duy trì độ ẩm ổn định, không để đọng úng.', 'Tưới đạm cá hữu cơ lên men vi sinh pha loãng tỷ lệ 1:200 hoặc Acid Humic kích thích bộ rễ ăn sâu.', 'Theo dõi sâu bệnh thường xuyên; ưu tiên bắt thủ công hoặc bẫy dính vàng nếu mật độ thấp.', 'Phân đạm cá vi sinh EM, chế phẩm Acid Humic loãng, thùng tưới ô doa.', 'Ảnh ngọn non vươn tua cuốn', 'Thực hiện đầy đủ kỹ thuật bước Bén rễ & Bón kích ngọn đọt, đạt chỉ tiêu sinh trưởng theo ngày tuổi 7.', 22.0, 32.0, 70.0, 80.0),
(40, 5, 4, 'Cắm giàn chữ A & Căng lưới', 'PRUNING', 1, 14, 'Cắm cọc tre chữ A cao 2m, giăng lưới cước mắt 15cm. Cố định ngọn leo vào mắt lưới đầu tiên.', 'Tưới nước sạch duy trì độ ẩm ổn định, không để đọng úng.', 'Không áp dụng phân bón ở bước này.', 'Theo dõi sâu bệnh thường xuyên; ưu tiên bắt thủ công hoặc bẫy dính vàng nếu mật độ thấp.', 'Kéo cắt cành chuyên dụng (đã khử trùng cồn 70°), cọc tre, dây đay hoặc lưới giàn cước.', 'Ảnh giàn lưới chữ A hoàn thiện', 'Thực hiện đầy đủ kỹ thuật bước Cắm giàn chữ A & Căng lưới, đạt chỉ tiêu sinh trưởng theo ngày tuổi 14.', 22.0, 32.0, 65.0, 75.0),
(41, 5, 5, 'Vặt nhánh gốc & Bấm hoa sớm', 'PRUNING', 1, 20, 'Vặt sạch toàn bộ nhánh phụ và hoa từ nách lá 1 đến 5 để cây dồn sức nuôi thân leo lên đỉnh giàn.', 'Tưới nước sạch duy trì độ ẩm ổn định, không để đọng úng.', 'Không áp dụng phân bón ở bước này.', 'Theo dõi sâu bệnh thường xuyên; ưu tiên bắt thủ công hoặc bẫy dính vàng nếu mật độ thấp.', 'Kéo cắt cành chuyên dụng (đã khử trùng cồn 70°), cọc tre, dây đay hoặc lưới giàn cước.', 'Ảnh thân chính sạch nhánh dưới gốc', 'Thực hiện đầy đủ kỹ thuật bước Vặt nhánh gốc & Bấm hoa sớm, đạt chỉ tiêu sinh trưởng theo ngày tuổi 20.', 22.0, 32.0, 65.0, 75.0),
(42, 5, 6, 'Bón thúc nuôi quả & Phòng nấm', 'FERTILIZATION', 1, 28, 'Bón thúc NPK 16-16-16 hữu cơ. Phun phòng nấm phấn trắng bằng Bacillus amyloliquefaciens (Serenade ASO).', 'Tưới nước sạch duy trì độ ẩm ổn định, không để đọng úng.', 'Tưới bổ sung dịch trùn quế hoặc phân hữu cơ vi sinh cân đối N-P-K.', 'Theo dõi sâu bệnh thường xuyên; ưu tiên bắt thủ công hoặc bẫy dính vàng nếu mật độ thấp.', 'Phân hữu cơ sinh học đạt chuẩn VietGAP.', 'Ảnh hoa cái nở rộ trên các nách lá', 'Thực hiện đầy đủ kỹ thuật bước Bón thúc nuôi quả & Phòng nấm, đạt chỉ tiêu sinh trưởng theo ngày tuổi 28.', 22.0, 30.0, 65.0, 75.0),
(43, 5, 7, 'Tưới đủ ẩm & Bổ sung Kali', 'IRRIGATION', 1, 35, 'Dưa leo nuôi quả rất cần nước, tưới 2 lần/ngày không để khô hạn làm đắng trái. Bổ sung dịch chuối ủ men.', 'Tưới phun sương nhẹ 2 lần/ngày (07:00 và 16:30), độ ẩm đạt 70-80%.', 'Không áp dụng phân bón ở bước này.', 'Theo dõi sâu bệnh thường xuyên; ưu tiên bắt thủ công hoặc bẫy dính vàng nếu mật độ thấp.', 'Dụng cụ làm vườn chuyên dụng.', 'Ảnh chùm quả non suôn thẳng', 'Thực hiện đầy đủ kỹ thuật bước Tưới đủ ẩm & Bổ sung Kali, đạt chỉ tiêu sinh trưởng theo ngày tuổi 35.', 22.0, 32.0, 70.0, 80.0),
(44, 5, 8, 'Ngừng thuốc BVTV & Cách ly', 'SAFETY_INTERVAL', 1, 42, 'Ngừng hoàn toàn mọi loại thuốc BVTV, đảm bảo an toàn tuyệt đối khi thu hoạch.', 'Ngừng tưới 24h trước thu hái để rau ráo nước, bảo quản tươi ngon lâu dài.', 'Không áp dụng phân bón ở bước này.', 'Giai đoạn cách ly an toàn (PHI): TUYỆT ĐỐI NGỪNG toàn bộ phân bón hóa học và thuốc BVTV. Chỉ tưới nước sạch.', 'Dụng cụ làm vườn chuyên dụng.', 'Ảnh quả dưa leo xanh mướt', 'Thực hiện đầy đủ kỹ thuật bước Ngừng thuốc BVTV & Cách ly, đạt chỉ tiêu sinh trưởng theo ngày tuổi 42.', 22.0, 30.0, 65.0, 75.0),
(45, 5, 9, 'Thu hoạch rộ lứa đầu', 'HARVEST', 1, 46, 'Thu hoạch quả dài 10-12cm khi vỏ còn lớp phấn trắng mịn. Cắt bằng kéo, thu cách ngày 1 lần.', 'Ngừng tưới 24h trước thu hái để rau ráo nước, bảo quản tươi ngon lâu dài.', 'Không áp dụng phân bón ở bước này.', 'Theo dõi sâu bệnh thường xuyên; ưu tiên bắt thủ công hoặc bẫy dính vàng nếu mật độ thấp.', 'Dụng cụ làm vườn chuyên dụng.', 'Ảnh sọt dưa leo baby & cân ký', 'Đạt chỉ tiêu thu hái an toàn: không dư lượng BVTV (PHI >= 5 ngày), tươi giòn, đúng kích thước thương phẩm, cân điện tử ghi nhận chính xác.', 20.0, 30.0, 60.0, 70.0),
(46, 5, 10, 'Thu hoạch vét & Vệ sinh giàn', 'HARVEST', 1, 56, 'Thu hết lứa quả cuối, cắt gốc dây dưa, tháo gỡ lưới thu gom tàn dư chuẩn bị phơi ải đất.', 'Ngừng tưới 24h trước thu hái để rau ráo nước, bảo quản tươi ngon lâu dài.', 'Không áp dụng phân bón ở bước này.', 'Theo dõi sâu bệnh thường xuyên; ưu tiên bắt thủ công hoặc bẫy dính vàng nếu mật độ thấp.', 'Dụng cụ làm vườn chuyên dụng.', 'Ảnh dọn sạch giàn lưới sau thu hoạch', 'Đạt chỉ tiêu thu hái an toàn: không dư lượng BVTV (PHI >= 5 ngày), tươi giòn, đúng kích thước thương phẩm, cân điện tử ghi nhận chính xác.', 22.0, 32.0, 60.0, 70.0)
ON CONFLICT (step_id) DO UPDATE SET
    template_id          = EXCLUDED.template_id,
    step_order           = EXCLUDED.step_order,
    step_name            = EXCLUDED.step_name,
    task_type            = EXCLUDED.task_type,
    duration_days        = EXCLUDED.duration_days,
    day_offset           = EXCLUDED.day_offset,
    description          = EXCLUDED.description,
    water_regime         = EXCLUDED.water_regime,
    nutrition_regime     = EXCLUDED.nutrition_regime,
    pest_warning         = EXCLUDED.pest_warning,
    materials_needed     = EXCLUDED.materials_needed,
    evidence_requirement = EXCLUDED.evidence_requirement,
    inspection_criteria  = EXCLUDED.inspection_criteria,
    min_temp             = EXCLUDED.min_temp,
    max_temp             = EXCLUDED.max_temp,
    min_humidity         = EXCLUDED.min_humidity,
    max_humidity         = EXCLUDED.max_humidity;

-- ============================================================================
-- TEMPLATE 6: Đậu Cô Ve (French Green Bean) (9 TASKS)
-- ============================================================================
INSERT INTO template_steps (step_id, template_id, step_order, step_name, task_type, duration_days, day_offset, description, water_regime, nutrition_regime, pest_warning, materials_needed, evidence_requirement, inspection_criteria, min_temp, max_temp, min_humidity, max_humidity) VALUES
(47, 6, 1, 'Làm đất & Bón lót luống', 'SOIL_PREP', 1, 0, 'Lên luống cao 25cm thoát nước tốt. Bón lót phân chuồng hoai mục + lân super + vôi bột khử khuẩn. Rạch hàng.', 'Tưới nước sạch duy trì độ ẩm ổn định, không để đọng úng.', 'Bón lót phân trùn quế hoai mục (1.2 - 2.0 kg/m²) phối trộn vôi khử khuẩn và nấm Trichoderma.', 'Theo dõi sâu bệnh thường xuyên; ưu tiên bắt thủ công hoặc bẫy dính vàng nếu mật độ thấp.', 'Phân trùn quế hoai mục, vôi bột nông nghiệp, nấm đối kháng Trichoderma.', 'Ảnh luống cao ráo bón lót phân hoai', 'Đất tơi xốp sâu >= 20cm, luống thẳng cao ráo thoát nước, phân lót san phẳng đều.', 20.0, 30.0, 60.0, 70.0),
(48, 6, 2, 'Gieo hạt hốc', 'PLANTING', 1, 1, 'Gieo 2 hạt/hốc cách nhau 30cm, sâu 2cm. Phủ tro trấu mỏng giữ ẩm, tưới nhẹ bằng ô doa.', 'Tưới nước sạch duy trì độ ẩm ổn định, không để đọng úng.', 'Không áp dụng phân bón ở bước này.', 'Theo dõi sâu bệnh thường xuyên; ưu tiên bắt thủ công hoặc bẫy dính vàng nếu mật độ thấp.', 'Hạt giống F1 đạt kiểm định VietGAP (hoặc cây con vỉ ươm 3-4 lá), dung dịch kích rễ nhẹ.', 'Ảnh hốc gieo hạt phủ tro trấu', 'Mật độ cấy đều, cây con thẳng đứng, không vỡ bầu đất, rễ được tưới ẩm tiếp xúc tốt.', 20.0, 30.0, 65.0, 75.0),
(49, 6, 3, 'Tỉa định cây & Xới nhẹ', 'CARE', 1, 5, 'Hạt mọc mầm đều, tỉa giữ lại 1 cây khỏe nhất/hốc. Dùng cào nhỏ xới nhẹ váng đất quanh gốc.', 'Tưới nước sạch duy trì độ ẩm ổn định, không để đọng úng.', 'Không áp dụng phân bón ở bước này.', 'Theo dõi sâu bệnh thường xuyên; ưu tiên bắt thủ công hoặc bẫy dính vàng nếu mật độ thấp.', 'Dụng cụ làm vườn chuyên dụng.', 'Ảnh mầm đậu xanh khỏe 1 cây/hốc', 'Thực hiện đầy đủ kỹ thuật bước Tỉa định cây & Xới nhẹ, đạt chỉ tiêu sinh trưởng theo ngày tuổi 5.', 20.0, 30.0, 65.0, 75.0),
(50, 6, 4, 'Bón thúc đợt 1 & Vun nhẹ gốc', 'FERTILIZATION', 1, 14, 'Tưới thúc đạm cá hữu cơ loãng. Vun một lớp đất mỏng vào cổ rễ giúp cây đứng vững.', 'Tưới phun sương nhẹ 2 lần/ngày (07:00 và 16:30), độ ẩm đạt 65-75%.', 'Tưới đạm cá hữu cơ lên men vi sinh pha loãng tỷ lệ 1:200 hoặc Acid Humic kích thích bộ rễ ăn sâu.', 'Theo dõi sâu bệnh thường xuyên; ưu tiên bắt thủ công hoặc bẫy dính vàng nếu mật độ thấp.', 'Phân đạm cá vi sinh EM, chế phẩm Acid Humic loãng, thùng tưới ô doa.', 'Ảnh gốc đậu được vun đất màu', 'Thực hiện đầy đủ kỹ thuật bước Bón thúc đợt 1 & Vun nhẹ gốc, đạt chỉ tiêu sinh trưởng theo ngày tuổi 14.', 20.0, 30.0, 65.0, 75.0),
(51, 6, 5, 'Cắm giàn leo chữ A', 'PRUNING', 1, 20, 'Cắm giàn tre chữ A cao 1.8m, buộc nẹp ngang. Hướng dẫn ngọn đậu bám vào thân cọc.', 'Tưới nước sạch duy trì độ ẩm ổn định, không để đọng úng.', 'Không áp dụng phân bón ở bước này.', 'Theo dõi sâu bệnh thường xuyên; ưu tiên bắt thủ công hoặc bẫy dính vàng nếu mật độ thấp.', 'Kéo cắt cành chuyên dụng (đã khử trùng cồn 70°), cọc tre, dây đay hoặc lưới giàn cước.', 'Ảnh giàn cọc tre thẳng tắp', 'Thực hiện đầy đủ kỹ thuật bước Cắm giàn leo chữ A, đạt chỉ tiêu sinh trưởng theo ngày tuổi 20.', 20.0, 30.0, 60.0, 70.0),
(52, 6, 6, 'Bón thúc đón hoa & Phun Bo', 'FERTILIZATION', 1, 30, 'Bón NPK hữu cơ cân đối. Phun phân bón lá Bo sinh học chống rụng hoa tăng tỷ lệ đậu quả.', 'Tưới nước sạch duy trì độ ẩm ổn định, không để đọng úng.', 'Phun phân bón lá Canxi - Bo hữu cơ chống rụng hoa, ngăn ngừa thối đuôi trái và cháy bìa lá (Tip-burn).', 'Theo dõi sâu bệnh thường xuyên; ưu tiên bắt thủ công hoặc bẫy dính vàng nếu mật độ thấp.', 'Chế phẩm Canxi-Bo sinh học, bình phun sương áp suất nhẹ.', 'Ảnh chùm hoa đậu trắng tím nở rộ', 'Thực hiện đầy đủ kỹ thuật bước Bón thúc đón hoa & Phun Bo, đạt chỉ tiêu sinh trưởng theo ngày tuổi 30.', 20.0, 28.0, 60.0, 70.0),
(53, 6, 7, 'Phòng dòi đục thân & Sâu quả', 'PEST_CONTROL', 1, 38, 'Phun chế phẩm vi khuẩn BT hoặc Emamectin benzoate (Tasieu 1.9EC) phòng sâu đục quả. Bắt đầu thời kỳ cách ly.', 'Tưới nước sạch duy trì độ ẩm ổn định, không để đọng úng.', 'Không áp dụng phân bón ở bước này.', 'Sâu tơ, sâu xanh, sâu khoang: Phun vi khuẩn sinh học Bacillus thuringiensis (BT - Delfin WG 15g/16L). PHI: 2-3 ngày.', 'Chế phẩm vi khuẩn BT (Delfin WG), bình phun chuyên dụng.', 'Ảnh phun thuốc sinh học đều giàn', 'Thực hiện đầy đủ kỹ thuật bước Phòng dòi đục thân & Sâu quả, đạt chỉ tiêu sinh trưởng theo ngày tuổi 38.', 20.0, 28.0, 60.0, 70.0),
(54, 6, 8, 'Thu hoạch lứa đầu', 'HARVEST', 1, 45, 'Thu hoạch quả bánh tẻ màu xanh tươi, hạt chưa gồ to. Hái nhẹ tay tránh rách cành hoa.', 'Ngừng tưới 24h trước thu hái để rau ráo nước, bảo quản tươi ngon lâu dài.', 'Không áp dụng phân bón ở bước này.', 'Theo dõi sâu bệnh thường xuyên; ưu tiên bắt thủ công hoặc bẫy dính vàng nếu mật độ thấp.', 'Dụng cụ làm vườn chuyên dụng.', 'Ảnh rổ đậu cô ve tươi giòn', 'Đạt chỉ tiêu thu hái an toàn: không dư lượng BVTV (PHI >= 5 ngày), tươi giòn, đúng kích thước thương phẩm, cân điện tử ghi nhận chính xác.', 20.0, 28.0, 55.0, 65.0),
(55, 6, 9, 'Thu hoạch lứa 2 & Dọn tàn dư', 'HARVEST', 1, 52, 'Thu hết các quả còn lại, cắt bỏ dây đậu gom vào khu ủ rác hữu cơ.', 'Ngừng tưới 24h trước thu hái để rau ráo nước, bảo quản tươi ngon lâu dài.', 'Không áp dụng phân bón ở bước này.', 'Theo dõi sâu bệnh thường xuyên; ưu tiên bắt thủ công hoặc bẫy dính vàng nếu mật độ thấp.', 'Dụng cụ làm vườn chuyên dụng.', 'Ảnh cân ký sản lượng cuối vụ', 'Đạt chỉ tiêu thu hái an toàn: không dư lượng BVTV (PHI >= 5 ngày), tươi giòn, đúng kích thước thương phẩm, cân điện tử ghi nhận chính xác.', 20.0, 30.0, 55.0, 65.0)
ON CONFLICT (step_id) DO UPDATE SET
    template_id          = EXCLUDED.template_id,
    step_order           = EXCLUDED.step_order,
    step_name            = EXCLUDED.step_name,
    task_type            = EXCLUDED.task_type,
    duration_days        = EXCLUDED.duration_days,
    day_offset           = EXCLUDED.day_offset,
    description          = EXCLUDED.description,
    water_regime         = EXCLUDED.water_regime,
    nutrition_regime     = EXCLUDED.nutrition_regime,
    pest_warning         = EXCLUDED.pest_warning,
    materials_needed     = EXCLUDED.materials_needed,
    evidence_requirement = EXCLUDED.evidence_requirement,
    inspection_criteria  = EXCLUDED.inspection_criteria,
    min_temp             = EXCLUDED.min_temp,
    max_temp             = EXCLUDED.max_temp,
    min_humidity         = EXCLUDED.min_humidity,
    max_humidity         = EXCLUDED.max_humidity;

-- ============================================================================
-- TEMPLATE 7: Mướp Hương Cao Sản (10 TASKS)
-- ============================================================================
INSERT INTO template_steps (step_id, template_id, step_order, step_name, task_type, duration_days, day_offset, description, water_regime, nutrition_regime, pest_warning, materials_needed, evidence_requirement, inspection_criteria, min_temp, max_temp, min_humidity, max_humidity) VALUES
(56, 7, 1, 'Đào hố & Bón lót đáy', 'SOIL_PREP', 1, 0, 'Đào hố 40x40cm, sâu 30cm. Bón lót 3kg phân chuồng ủ hoai + 100g lân + vôi khử trùng + nấm Trichoderma. Lấp đất ủ 2 ngày.', 'Tưới nước sạch duy trì độ ẩm ổn định, không để đọng úng.', 'Bón lót phân trùn quế hoai mục (1.2 - 2.0 kg/m²) phối trộn vôi khử khuẩn và nấm Trichoderma.', 'Theo dõi sâu bệnh thường xuyên; ưu tiên bắt thủ công hoặc bẫy dính vàng nếu mật độ thấp.', 'Phân trùn quế hoai mục, vôi bột nông nghiệp, nấm đối kháng Trichoderma.', 'Ảnh hố phân lót đáy tơi xốp', 'Đất tơi xốp sâu >= 20cm, luống thẳng cao ráo thoát nước, phân lót san phẳng đều.', 22.0, 35.0, 65.0, 75.0),
(57, 7, 2, 'Cấy cây con bầu ươm', 'PLANTING', 1, 1, 'Ngâm ủ hạt gieo bầu 7 ngày trước. Cấy cây con 2 lá thật vào hố, khoảng cách hốc 1m. Tưới đẫm nước.', 'Tưới phun sương nhẹ 2 lần/ngày (07:00 và 16:30), độ ẩm đạt 70-85%.', 'Không áp dụng phân bón ở bước này.', 'Theo dõi sâu bệnh thường xuyên; ưu tiên bắt thủ công hoặc bẫy dính vàng nếu mật độ thấp.', 'Hạt giống F1 đạt kiểm định VietGAP (hoặc cây con vỉ ươm 3-4 lá), dung dịch kích rễ nhẹ.', 'Ảnh cây con mướp trong hố đất', 'Mật độ cấy đều, cây con thẳng đứng, không vỡ bầu đất, rễ được tưới ẩm tiếp xúc tốt.', 25.0, 35.0, 70.0, 85.0),
(58, 7, 3, 'Bén rễ & Bón thúc kích ngọn', 'FERTILIZATION', 1, 10, 'Cây bén rễ nhú tua cuốn, tưới dịch trùn quế loãng kích thích thân dây vươn dài khỏe.', 'Tưới nước sạch duy trì độ ẩm ổn định, không để đọng úng.', 'Tưới bổ sung dịch trùn quế hoặc phân hữu cơ vi sinh cân đối N-P-K.', 'Theo dõi sâu bệnh thường xuyên; ưu tiên bắt thủ công hoặc bẫy dính vàng nếu mật độ thấp.', 'Phân hữu cơ sinh học đạt chuẩn VietGAP.', 'Ảnh ngọn mướp mập mạp xanh tốt', 'Thực hiện đầy đủ kỹ thuật bước Bén rễ & Bón thúc kích ngọn, đạt chỉ tiêu sinh trưởng theo ngày tuổi 10.', 25.0, 35.0, 70.0, 80.0),
(59, 7, 4, 'Bắt giàn mái bằng / Giàn lưới', 'PRUNING', 1, 18, 'Làm giàn mái bằng hoặc giàn lưới cao 2m. Cắm cọc dắt ngọn mướp bò lên mặt giàn.', 'Tưới nước sạch duy trì độ ẩm ổn định, không để đọng úng.', 'Không áp dụng phân bón ở bước này.', 'Theo dõi sâu bệnh thường xuyên; ưu tiên bắt thủ công hoặc bẫy dính vàng nếu mật độ thấp.', 'Kéo cắt cành chuyên dụng (đã khử trùng cồn 70°), cọc tre, dây đay hoặc lưới giàn cước.', 'Ảnh ngọn mướp leo chạm mặt giàn', 'Thực hiện đầy đủ kỹ thuật bước Bắt giàn mái bằng / Giàn lưới, đạt chỉ tiêu sinh trưởng theo ngày tuổi 18.', 25.0, 35.0, 65.0, 75.0),
(60, 7, 5, 'Bấm ngọn chính kích nhánh cái', 'PRUNING', 1, 28, 'Khi ngọn chính bò lên giàn được 1m, bấm ngọn sinh trưởng để kích thích bung nhiều nhánh cấp 1 mang hoa cái.', 'Tưới nước sạch duy trì độ ẩm ổn định, không để đọng úng.', 'Không áp dụng phân bón ở bước này.', 'Theo dõi sâu bệnh thường xuyên; ưu tiên bắt thủ công hoặc bẫy dính vàng nếu mật độ thấp.', 'Kéo cắt cành chuyên dụng (đã khử trùng cồn 70°), cọc tre, dây đay hoặc lưới giàn cước.', 'Ảnh vết bấm ngọn & các chồi nhánh', 'Thực hiện đầy đủ kỹ thuật bước Bấm ngọn chính kích nhánh cái, đạt chỉ tiêu sinh trưởng theo ngày tuổi 28.', 25.0, 35.0, 65.0, 75.0),
(61, 7, 6, 'Treo bẫy ruồi vàng & Bón hoa', 'PEST_CONTROL', 1, 38, 'Treo bẫy dẫn dụ Pheromone (Vizubon-D) ngoài rìa giàn trừ ruồi đục quả. Bón NPK hữu cơ nuôi hoa.', 'Tưới nước sạch duy trì độ ẩm ổn định, không để đọng úng.', 'Tưới bổ sung dịch trùn quế hoặc phân hữu cơ vi sinh cân đối N-P-K.', 'Ruồi vàng hại quả: Treo bẫy bả Pheromone sinh học (Vizubon-D) ngoài rìa giàn. PHI: 0 ngày.', 'Bẫy bả Pheromone sinh học Vizubon-D.', 'Ảnh bẫy ruồi vàng treo đầu giàn', 'Thực hiện đầy đủ kỹ thuật bước Treo bẫy ruồi vàng & Bón hoa, đạt chỉ tiêu sinh trưởng theo ngày tuổi 38.', 25.0, 32.0, 65.0, 75.0),
(62, 7, 7, 'Nuôi quả lớn & Tưới đủ nước', 'IRRIGATION', 1, 48, 'Mướp nuôi quả cần rất nhiều nước, tưới giữ ẩm 70-80%. Bổ sung dịch chuối trứng giàu Kali.', 'Tưới phun sương nhẹ 2 lần/ngày (07:00 và 16:30), độ ẩm đạt 70-80%.', 'Không áp dụng phân bón ở bước này.', 'Theo dõi sâu bệnh thường xuyên; ưu tiên bắt thủ công hoặc bẫy dính vàng nếu mật độ thấp.', 'Dụng cụ làm vườn chuyên dụng.', 'Ảnh quả mướp non treo lủng lẳng', 'Thực hiện đầy đủ kỹ thuật bước Nuôi quả lớn & Tưới đủ nước, đạt chỉ tiêu sinh trưởng theo ngày tuổi 48.', 25.0, 35.0, 70.0, 80.0),
(63, 7, 8, 'Cách ly tuyệt đối & Tỉa lá già', 'SAFETY_INTERVAL', 1, 56, 'Ngừng toàn bộ thuốc BVTV. Cắt bỏ bớt các lá già vàng phía dưới giúp giàn thông thoáng đón gió.', 'Ngừng tưới 24h trước thu hái để rau ráo nước, bảo quản tươi ngon lâu dài.', 'Không áp dụng phân bón ở bước này.', 'Giai đoạn cách ly an toàn (PHI): TUYỆT ĐỐI NGỪNG toàn bộ phân bón hóa học và thuốc BVTV. Chỉ tưới nước sạch.', 'Dụng cụ làm vườn chuyên dụng.', 'Ảnh giàn mướp thông thoáng, sai quả', 'Thực hiện đầy đủ kỹ thuật bước Cách ly tuyệt đối & Tỉa lá già, đạt chỉ tiêu sinh trưởng theo ngày tuổi 56.', 25.0, 35.0, 65.0, 75.0),
(64, 7, 9, 'Thu hoạch đợt 1 (Quả thẳng thơm)', 'HARVEST', 1, 60, 'Cắt quả khi đạt độ dài 25-30cm, vỏ mềm thơm ngát. Cân ký và chụp ảnh nghiệm thu.', 'Ngừng tưới 24h trước thu hái để rau ráo nước, bảo quản tươi ngon lâu dài.', 'Không áp dụng phân bón ở bước này.', 'Theo dõi sâu bệnh thường xuyên; ưu tiên bắt thủ công hoặc bẫy dính vàng nếu mật độ thấp.', 'Dụng cụ làm vườn chuyên dụng.', 'Ảnh quả mướp hương trên cân điện tử', 'Đạt chỉ tiêu thu hái an toàn: không dư lượng BVTV (PHI >= 5 ngày), tươi giòn, đúng kích thước thương phẩm, cân điện tử ghi nhận chính xác.', 22.0, 32.0, 60.0, 70.0),
(65, 7, 10, 'Thu hoạch đợt 2 & Vệ sinh giàn', 'HARVEST', 1, 68, 'Thu các lứa quả còn lại, cắt gốc dọn dây tàn dư để chuẩn bị chu kỳ nghỉ đất.', 'Ngừng tưới 24h trước thu hái để rau ráo nước, bảo quản tươi ngon lâu dài.', 'Không áp dụng phân bón ở bước này.', 'Theo dõi sâu bệnh thường xuyên; ưu tiên bắt thủ công hoặc bẫy dính vàng nếu mật độ thấp.', 'Dụng cụ làm vườn chuyên dụng.', 'Ảnh dọn sạch giàn chuẩn bị cày ải', 'Đạt chỉ tiêu thu hái an toàn: không dư lượng BVTV (PHI >= 5 ngày), tươi giòn, đúng kích thước thương phẩm, cân điện tử ghi nhận chính xác.', 25.0, 35.0, 60.0, 70.0)
ON CONFLICT (step_id) DO UPDATE SET
    template_id          = EXCLUDED.template_id,
    step_order           = EXCLUDED.step_order,
    step_name            = EXCLUDED.step_name,
    task_type            = EXCLUDED.task_type,
    duration_days        = EXCLUDED.duration_days,
    day_offset           = EXCLUDED.day_offset,
    description          = EXCLUDED.description,
    water_regime         = EXCLUDED.water_regime,
    nutrition_regime     = EXCLUDED.nutrition_regime,
    pest_warning         = EXCLUDED.pest_warning,
    materials_needed     = EXCLUDED.materials_needed,
    evidence_requirement = EXCLUDED.evidence_requirement,
    inspection_criteria  = EXCLUDED.inspection_criteria,
    min_temp             = EXCLUDED.min_temp,
    max_temp             = EXCLUDED.max_temp,
    min_humidity         = EXCLUDED.min_humidity,
    max_humidity         = EXCLUDED.max_humidity;

-- ============================================================================
-- TEMPLATE 8: Rau Mồng Tơi (7 TASKS)
-- ============================================================================
INSERT INTO template_steps (step_id, template_id, step_order, step_name, task_type, duration_days, day_offset, description, water_regime, nutrition_regime, pest_warning, materials_needed, evidence_requirement, inspection_criteria, min_temp, max_temp, min_humidity, max_humidity) VALUES
(66, 8, 1, 'Lên luống & Bón lót hữu cơ', 'SOIL_PREP', 1, 0, 'Đất nhiều mùn, tơi xốp. Lên luống cao 20cm, bón lót phân trùn quế 1.5kg/m2 + lân vi sinh. Cào phẳng.', 'Tưới nước sạch duy trì độ ẩm ổn định, không để đọng úng.', 'Bón lót phân trùn quế hoai mục (1.2 - 2.0 kg/m²) phối trộn vôi khử khuẩn và nấm Trichoderma.', 'Theo dõi sâu bệnh thường xuyên; ưu tiên bắt thủ công hoặc bẫy dính vàng nếu mật độ thấp.', 'Phân trùn quế hoai mục, vôi bột nông nghiệp, nấm đối kháng Trichoderma.', 'Ảnh luống phẳng mịn, bón phân đều', 'Đất tơi xốp sâu >= 20cm, luống thẳng cao ráo thoát nước, phân lót san phẳng đều.', 22.0, 35.0, 65.0, 75.0),
(67, 8, 2, 'Gieo hạt theo hàng', 'PLANTING', 1, 1, 'Ngâm hạt nước ấm 4 giờ. Rạch hàng cách nhau 20cm, gieo hạt cách 10cm, phủ lớp đất mỏng 1cm. Tưới đẫm.', 'Tưới phun sương nhẹ 2 lần/ngày (07:00 và 16:30), độ ẩm đạt 75-85%.', 'Không áp dụng phân bón ở bước này.', 'Theo dõi sâu bệnh thường xuyên; ưu tiên bắt thủ công hoặc bẫy dính vàng nếu mật độ thấp.', 'Hạt giống F1 đạt kiểm định VietGAP (hoặc cây con vỉ ươm 3-4 lá), dung dịch kích rễ nhẹ.', 'Ảnh luống sau gieo được phủ ẩm', 'Mật độ cấy đều, cây con thẳng đứng, không vỡ bầu đất, rễ được tưới ẩm tiếp xúc tốt.', 25.0, 35.0, 75.0, 85.0),
(68, 8, 3, 'Kiểm tra mầm & Tỉa dặm', 'CARE', 1, 6, 'Hạt mọc mầm 2 lá, tỉa giữ khoảng cách 12-15cm. Tưới nước giữ ẩm ngày 2 lần.', 'Tưới phun sương nhẹ 2 lần/ngày (07:00 và 16:30), độ ẩm đạt 70-85%.', 'Không áp dụng phân bón ở bước này.', 'Theo dõi sâu bệnh thường xuyên; ưu tiên bắt thủ công hoặc bẫy dính vàng nếu mật độ thấp.', 'Dụng cụ làm vườn chuyên dụng.', 'Ảnh cây con mồng tơi mập xanh', 'Thực hiện đầy đủ kỹ thuật bước Kiểm tra mầm & Tỉa dặm, đạt chỉ tiêu sinh trưởng theo ngày tuổi 6.', 25.0, 35.0, 70.0, 85.0),
(69, 8, 4, 'Bón thúc đợt 1 (Đạm cá)', 'FERTILIZATION', 1, 12, 'Tưới thúc đạm cá lên men hoặc bánh dầu ngâm ủ vi sinh loãng giúp bẹ lá dày, ngọn vươn nhanh.', 'Tưới phun sương nhẹ 2 lần/ngày (07:00 và 16:30), độ ẩm đạt 70-85%.', 'Tưới đạm cá hữu cơ lên men vi sinh pha loãng tỷ lệ 1:200 hoặc Acid Humic kích thích bộ rễ ăn sâu.', 'Theo dõi sâu bệnh thường xuyên; ưu tiên bắt thủ công hoặc bẫy dính vàng nếu mật độ thấp.', 'Phân đạm cá vi sinh EM, chế phẩm Acid Humic loãng, thùng tưới ô doa.', 'Ảnh tưới phân hữu cơ quanh gốc', 'Thực hiện đầy đủ kỹ thuật bước Bón thúc đợt 1 (Đạm cá), đạt chỉ tiêu sinh trưởng theo ngày tuổi 12.', 25.0, 35.0, 70.0, 85.0),
(70, 8, 5, 'Bón thúc đợt 2 & Xới xáo', 'FERTILIZATION', 1, 18, 'Xới nhẹ rãnh luống, bón bổ sung phân trùn quế rải mặt + dịch chuối Humic. Nhặt sạch cỏ dại.', 'Tưới nước sạch duy trì độ ẩm ổn định, không để đọng úng.', 'Bổ sung dịch chuối ủ men giàu Kali hữu cơ + Amino Acid giúp thân mập, bẹ nở to giòn ngọt.', 'Theo dõi sâu bệnh thường xuyên; ưu tiên bắt thủ công hoặc bẫy dính vàng nếu mật độ thấp.', 'Dịch chuối ủ Kali vi sinh, phân bón lá Amino Acid sinh học.', 'Ảnh lá mồng tơi to tròn, xanh bóng', 'Thực hiện đầy đủ kỹ thuật bước Bón thúc đợt 2 & Xới xáo, đạt chỉ tiêu sinh trưởng theo ngày tuổi 18.', 25.0, 35.0, 70.0, 85.0),
(71, 8, 6, 'Kiểm tra sâu khoang & Cách ly', 'PEST_CONTROL', 1, 24, 'Vạch lá bắt sâu khoang thủ công. Phun vi khuẩn BT nếu mật độ cao. Bắt đầu ngừng phân bón thuốc trừ sâu.', 'Tưới nước sạch duy trì độ ẩm ổn định, không để đọng úng.', 'Không áp dụng phân bón ở bước này.', 'Sâu tơ, sâu xanh, sâu khoang: Phun vi khuẩn sinh học Bacillus thuringiensis (BT - Delfin WG 15g/16L). PHI: 2-3 ngày.', 'Chế phẩm vi khuẩn BT (Delfin WG), bình phun chuyên dụng.', 'Ảnh kiểm tra tán lá lành lặn', 'Thực hiện đầy đủ kỹ thuật bước Kiểm tra sâu khoang & Cách ly, đạt chỉ tiêu sinh trưởng theo ngày tuổi 24.', 22.0, 35.0, 65.0, 80.0),
(72, 8, 7, 'Thu hoạch đọt & Nghiệm thu', 'HARVEST', 1, 30, 'Cắt đọt non dài 15-20cm chừa lại 2 nách lá sát gốc để tiếp tục sinh nhánh lứa 2. Cân ký giao khách.', 'Ngừng tưới 24h trước thu hái để rau ráo nước, bảo quản tươi ngon lâu dài.', 'Không áp dụng phân bón ở bước này.', 'Theo dõi sâu bệnh thường xuyên; ưu tiên bắt thủ công hoặc bẫy dính vàng nếu mật độ thấp.', 'Dụng cụ làm vườn chuyên dụng.', 'Ảnh đọt mồng tơi trên cân & sọt rau', 'Đạt chỉ tiêu thu hái an toàn: không dư lượng BVTV (PHI >= 5 ngày), tươi giòn, đúng kích thước thương phẩm, cân điện tử ghi nhận chính xác.', 22.0, 32.0, 60.0, 75.0)
ON CONFLICT (step_id) DO UPDATE SET
    template_id          = EXCLUDED.template_id,
    step_order           = EXCLUDED.step_order,
    step_name            = EXCLUDED.step_name,
    task_type            = EXCLUDED.task_type,
    duration_days        = EXCLUDED.duration_days,
    day_offset           = EXCLUDED.day_offset,
    description          = EXCLUDED.description,
    water_regime         = EXCLUDED.water_regime,
    nutrition_regime     = EXCLUDED.nutrition_regime,
    pest_warning         = EXCLUDED.pest_warning,
    materials_needed     = EXCLUDED.materials_needed,
    evidence_requirement = EXCLUDED.evidence_requirement,
    inspection_criteria  = EXCLUDED.inspection_criteria,
    min_temp             = EXCLUDED.min_temp,
    max_temp             = EXCLUDED.max_temp,
    min_humidity         = EXCLUDED.min_humidity,
    max_humidity         = EXCLUDED.max_humidity;

-- ============================================================================
-- TEMPLATE 9: Ớt Cay / Ớt Chỉ Thiên (9 TASKS)
-- ============================================================================
INSERT INTO template_steps (step_id, template_id, step_order, step_name, task_type, duration_days, day_offset, description, water_regime, nutrition_regime, pest_warning, materials_needed, evidence_requirement, inspection_criteria, min_temp, max_temp, min_humidity, max_humidity) VALUES
(73, 9, 1, 'Lên luống cao & Bón lót sâu', 'SOIL_PREP', 1, 0, 'Lên luống cao 30cm rãnh sâu chống úng. Bón lót phân chuồng hoai 2kg/m2 + vôi bột khử nấm + lân + Trichoderma.', 'Tưới nước sạch duy trì độ ẩm ổn định, không để đọng úng.', 'Bón lót phân trùn quế hoai mục (1.2 - 2.0 kg/m²) phối trộn vôi khử khuẩn và nấm Trichoderma.', 'Sâu tơ, sâu xanh, sâu khoang: Phun vi khuẩn sinh học Bacillus thuringiensis (BT - Delfin WG 15g/16L). PHI: 2-3 ngày.', 'Chế phẩm vi khuẩn BT (Delfin WG), bình phun chuyên dụng.', 'Ảnh luống cao rãnh sâu thoát nước', 'Đất tơi xốp sâu >= 20cm, luống thẳng cao ráo thoát nước, phân lót san phẳng đều.', 22.0, 32.0, 60.0, 70.0),
(74, 9, 2, 'Cấy cây con giống vỉ ươm', 'PLANTING', 1, 1, 'Cấy cây con 20 ngày tuổi (4-5 lá thật) theo khoảng cách 45x50cm. Tưới đẫm nước định vị gốc.', 'Tưới phun sương nhẹ 2 lần/ngày (07:00 và 16:30), độ ẩm đạt 65-75%.', 'Không áp dụng phân bón ở bước này.', 'Theo dõi sâu bệnh thường xuyên; ưu tiên bắt thủ công hoặc bẫy dính vàng nếu mật độ thấp.', 'Hạt giống F1 đạt kiểm định VietGAP (hoặc cây con vỉ ươm 3-4 lá), dung dịch kích rễ nhẹ.', 'Ảnh hàng ớt cấy ngay ngắn', 'Mật độ cấy đều, cây con thẳng đứng, không vỡ bầu đất, rễ được tưới ẩm tiếp xúc tốt.', 22.0, 32.0, 65.0, 75.0),
(75, 9, 3, 'Bén rễ & Tưới kích rễ đợt 1', 'FERTILIZATION', 1, 12, 'Tưới phân kích rễ Humic + đạm cá loãng. Xới nhẹ đất mặt luống giúp rễ ăn sâu.', 'Tưới phun sương nhẹ 2 lần/ngày (07:00 và 16:30), độ ẩm đạt 65-75%.', 'Tưới đạm cá hữu cơ lên men vi sinh pha loãng tỷ lệ 1:200 hoặc Acid Humic kích thích bộ rễ ăn sâu.', 'Theo dõi sâu bệnh thường xuyên; ưu tiên bắt thủ công hoặc bẫy dính vàng nếu mật độ thấp.', 'Phân đạm cá vi sinh EM, chế phẩm Acid Humic loãng, thùng tưới ô doa.', 'Ảnh đọt non nhú lá xanh đậm', 'Thực hiện đầy đủ kỹ thuật bước Bén rễ & Tưới kích rễ đợt 1, đạt chỉ tiêu sinh trưởng theo ngày tuổi 12.', 22.0, 32.0, 65.0, 75.0),
(76, 9, 4, 'Tỉa cành chạc V & Cắm cọc', 'PRUNING', 1, 25, 'Vặt sạch toàn bộ chồi nách và lá phía dưới chạc chữ V đầu tiên. Cắm cọc tre buộc thân chống đổ ngã.', 'Tưới nước sạch duy trì độ ẩm ổn định, không để đọng úng.', 'Không áp dụng phân bón ở bước này.', 'Theo dõi sâu bệnh thường xuyên; ưu tiên bắt thủ công hoặc bẫy dính vàng nếu mật độ thấp.', 'Kéo cắt cành chuyên dụng (đã khử trùng cồn 70°), cọc tre, dây đay hoặc lưới giàn cước.', 'Ảnh thân ớt thông thoáng dưới chạc V', 'Thực hiện đầy đủ kỹ thuật bước Tỉa cành chạc V & Cắm cọc, đạt chỉ tiêu sinh trưởng theo ngày tuổi 25.', 22.0, 32.0, 60.0, 70.0),
(77, 9, 5, 'Bón thúc đợt 2 & Phun vi lượng', 'FERTILIZATION', 1, 40, 'Bón NPK hữu cơ 20-20-15. Phun Bo vi lượng sinh học chống rụng hoa tăng tỷ lệ đậu trái.', 'Tưới nước sạch duy trì độ ẩm ổn định, không để đọng úng.', 'Bổ sung dịch chuối ủ men giàu Kali hữu cơ + Amino Acid giúp thân mập, bẹ nở to giòn ngọt.', 'Theo dõi sâu bệnh thường xuyên; ưu tiên bắt thủ công hoặc bẫy dính vàng nếu mật độ thấp.', 'Dịch chuối ủ Kali vi sinh, phân bón lá Amino Acid sinh học.', 'Ảnh hoa ớt trắng nở đều trên chạc', 'Thực hiện đầy đủ kỹ thuật bước Bón thúc đợt 2 & Phun vi lượng, đạt chỉ tiêu sinh trưởng theo ngày tuổi 40.', 22.0, 30.0, 60.0, 70.0),
(78, 9, 6, 'Phòng trừ bọ trĩ & Thán thư', 'PEST_CONTROL', 1, 55, 'Phun tinh dầu Neem + Nano Bạc Đồng phòng bọ trĩ làm xoăn đọt và bệnh thán thư nổ trái.', 'Tưới nước sạch duy trì độ ẩm ổn định, không để đọng úng.', 'Không áp dụng phân bón ở bước này.', 'Bọ trĩ, rệp muội: Phun tinh dầu Neem hữu cơ hoặc dầu khoáng SK Enspray 99EC (0.3%). PHI: 2-3 ngày.', 'Tinh dầu Neem hữu cơ hoặc dầu khoáng SK Enspray 99EC, bẫy dính màu vàng.', 'Ảnh chùm quả ớt non chỉ thiên', 'Thực hiện đầy đủ kỹ thuật bước Phòng trừ bọ trĩ & Thán thư, đạt chỉ tiêu sinh trưởng theo ngày tuổi 55.', 22.0, 30.0, 60.0, 70.0),
(79, 9, 7, 'Thúc chín quả & Ngừng thuốc', 'SAFETY_INTERVAL', 1, 70, 'Ngừng toàn bộ thuốc BVTV. Tưới kali hữu cơ (dịch chuối lên men) giúp quả chuyển màu đỏ tươi, tăng độ cay.', 'Tưới phun sương nhẹ 2 lần/ngày (07:00 và 16:30), độ ẩm đạt 60-70%.', 'Không áp dụng phân bón ở bước này.', 'Giai đoạn cách ly an toàn (PHI): TUYỆT ĐỐI NGỪNG toàn bộ phân bón hóa học và thuốc BVTV. Chỉ tưới nước sạch.', 'Dụng cụ làm vườn chuyên dụng.', 'Ảnh quả ớt chuyển màu đỏ rực', 'Thực hiện đầy đủ kỹ thuật bước Thúc chín quả & Ngừng thuốc, đạt chỉ tiêu sinh trưởng theo ngày tuổi 70.', 22.0, 32.0, 60.0, 70.0),
(80, 9, 8, 'Thu hoạch quả đỏ đợt 1', 'HARVEST', 1, 80, 'Hái từng quả chín đỏ đều kèm cuống. Cân điện tử, chụp ảnh nghiệm thu sản lượng.', 'Ngừng tưới 24h trước thu hái để rau ráo nước, bảo quản tươi ngon lâu dài.', 'Không áp dụng phân bón ở bước này.', 'Theo dõi sâu bệnh thường xuyên; ưu tiên bắt thủ công hoặc bẫy dính vàng nếu mật độ thấp.', 'Dụng cụ làm vườn chuyên dụng.', 'Ảnh rổ ớt đỏ tươi trên cân điện tử', 'Đạt chỉ tiêu thu hái an toàn: không dư lượng BVTV (PHI >= 5 ngày), tươi giòn, đúng kích thước thương phẩm, cân điện tử ghi nhận chính xác.', 20.0, 30.0, 55.0, 65.0),
(81, 9, 9, 'Thu hoạch đợt 2 & Dưỡng cây', 'HARVEST', 1, 88, 'Thu hoạch đợt 2, bón bổ sung phân trùn quế gốc để duy trì cây ra hoa lứa tiếp theo.', 'Ngừng tưới 24h trước thu hái để rau ráo nước, bảo quản tươi ngon lâu dài.', 'Không áp dụng phân bón ở bước này.', 'Theo dõi sâu bệnh thường xuyên; ưu tiên bắt thủ công hoặc bẫy dính vàng nếu mật độ thấp.', 'Dụng cụ làm vườn chuyên dụng.', 'Ảnh gốc ớt sau khi bón dưỡng lứa 2', 'Đạt chỉ tiêu thu hái an toàn: không dư lượng BVTV (PHI >= 5 ngày), tươi giòn, đúng kích thước thương phẩm, cân điện tử ghi nhận chính xác.', 22.0, 32.0, 60.0, 70.0)
ON CONFLICT (step_id) DO UPDATE SET
    template_id          = EXCLUDED.template_id,
    step_order           = EXCLUDED.step_order,
    step_name            = EXCLUDED.step_name,
    task_type            = EXCLUDED.task_type,
    duration_days        = EXCLUDED.duration_days,
    day_offset           = EXCLUDED.day_offset,
    description          = EXCLUDED.description,
    water_regime         = EXCLUDED.water_regime,
    nutrition_regime     = EXCLUDED.nutrition_regime,
    pest_warning         = EXCLUDED.pest_warning,
    materials_needed     = EXCLUDED.materials_needed,
    evidence_requirement = EXCLUDED.evidence_requirement,
    inspection_criteria  = EXCLUDED.inspection_criteria,
    min_temp             = EXCLUDED.min_temp,
    max_temp             = EXCLUDED.max_temp,
    min_humidity         = EXCLUDED.min_humidity,
    max_humidity         = EXCLUDED.max_humidity;

-- ============================================================================
-- TEMPLATE 10: Rau Dền Đỏ / Dền Cơm (7 TASKS)
-- ============================================================================
INSERT INTO template_steps (step_id, template_id, step_order, step_name, task_type, duration_days, day_offset, description, water_regime, nutrition_regime, pest_warning, materials_needed, evidence_requirement, inspection_criteria, min_temp, max_temp, min_humidity, max_humidity) VALUES
(82, 10, 1, 'Làm đất mịn & Bón lót', 'SOIL_PREP', 1, 0, 'Đất cày xới kỹ, tán nhỏ tơi mịn. Bón lót phân trùn quế hoai 1.2kg/m2 + vôi bột khử khuẩn. San phẳng mặt luống.', 'Tưới nước sạch duy trì độ ẩm ổn định, không để đọng úng.', 'Bón lót phân trùn quế hoai mục (1.2 - 2.0 kg/m²) phối trộn vôi khử khuẩn và nấm Trichoderma.', 'Theo dõi sâu bệnh thường xuyên; ưu tiên bắt thủ công hoặc bẫy dính vàng nếu mật độ thấp.', 'Phân trùn quế hoai mục, vôi bột nông nghiệp, nấm đối kháng Trichoderma.', 'Ảnh mặt luống phẳng mịn', 'Đất tơi xốp sâu >= 20cm, luống thẳng cao ráo thoát nước, phân lót san phẳng đều.', 22.0, 35.0, 65.0, 75.0),
(83, 10, 2, 'Gieo vãi hạt trộn cát', 'PLANTING', 1, 1, 'Hạt dền rất nhỏ, trộn đều với cát mịn hoặc tro bếp theo tỷ lệ 1:5 rồi rắc đều trên mặt luống. Phủ rơm mục mỏng, tưới đẫm.', 'Tưới nước sạch duy trì độ ẩm ổn định, không để đọng úng.', 'Không áp dụng phân bón ở bước này.', 'Theo dõi sâu bệnh thường xuyên; ưu tiên bắt thủ công hoặc bẫy dính vàng nếu mật độ thấp.', 'Hạt giống F1 đạt kiểm định VietGAP (hoặc cây con vỉ ươm 3-4 lá), dung dịch kích rễ nhẹ.', 'Ảnh luống sau gieo phủ rơm tưới ẩm', 'Mật độ cấy đều, cây con thẳng đứng, không vỡ bầu đất, rễ được tưới ẩm tiếp xúc tốt.', 25.0, 35.0, 75.0, 85.0),
(84, 10, 3, 'Kiểm tra mầm & Tưới sương', 'IRRIGATION', 1, 4, 'Hạt nảy mầm sau 2-3 ngày. Tưới phun sương nhẹ nhàng ngày 2 lần, tránh vòi xịt mạnh làm dập mầm.', 'Tưới phun sương nhẹ 2 lần/ngày (07:00 và 16:30), độ ẩm đạt 70-80%.', 'Không áp dụng phân bón ở bước này.', 'Theo dõi sâu bệnh thường xuyên; ưu tiên bắt thủ công hoặc bẫy dính vàng nếu mật độ thấp.', 'Dụng cụ làm vườn chuyên dụng.', 'Ảnh thảm mầm đỏ tía nhú đều', 'Thực hiện đầy đủ kỹ thuật bước Kiểm tra mầm & Tưới sương, đạt chỉ tiêu sinh trưởng theo ngày tuổi 4.', 25.0, 35.0, 70.0, 80.0),
(85, 10, 4, 'Tỉa thưa & Bón thúc đợt 1', 'FERTILIZATION', 1, 10, 'Tỉa thưa bớt chỗ quá dày giữ khoảng cách 5-7cm/cây. Tưới thúc đạm cá hữu cơ loãng giúp vươn ngọn.', 'Tưới phun sương nhẹ 2 lần/ngày (07:00 và 16:30), độ ẩm đạt 70-80%.', 'Tưới đạm cá hữu cơ lên men vi sinh pha loãng tỷ lệ 1:200 hoặc Acid Humic kích thích bộ rễ ăn sâu.', 'Theo dõi sâu bệnh thường xuyên; ưu tiên bắt thủ công hoặc bẫy dính vàng nếu mật độ thấp.', 'Phân đạm cá vi sinh EM, chế phẩm Acid Humic loãng, thùng tưới ô doa.', 'Ảnh hàng rau dền sau tỉa thoáng', 'Thực hiện đầy đủ kỹ thuật bước Tỉa thưa & Bón thúc đợt 1, đạt chỉ tiêu sinh trưởng theo ngày tuổi 10.', 25.0, 35.0, 70.0, 80.0),
(86, 10, 5, 'Bón thúc đợt 2 & Nhặt cỏ', 'FERTILIZATION', 1, 16, 'Tưới bổ sung dịch trùn quế. Nhặt sạch cỏ dại cạnh tranh dinh dưỡng. Đảm bảo độ ẩm đất 65-80%.', 'Tưới phun sương nhẹ 2 lần/ngày (07:00 và 16:30), độ ẩm đạt 65-80%.', 'Bổ sung dịch chuối ủ men giàu Kali hữu cơ + Amino Acid giúp thân mập, bẹ nở to giòn ngọt.', 'Theo dõi sâu bệnh thường xuyên; ưu tiên bắt thủ công hoặc bẫy dính vàng nếu mật độ thấp.', 'Dịch chuối ủ Kali vi sinh, phân bón lá Amino Acid sinh học.', 'Ảnh lá rau dền đỏ tía mọc rộ', 'Thực hiện đầy đủ kỹ thuật bước Bón thúc đợt 2 & Nhặt cỏ, đạt chỉ tiêu sinh trưởng theo ngày tuổi 16.', 25.0, 35.0, 65.0, 80.0),
(87, 10, 6, 'Kiểm tra sâu & Cách ly tuyệt đối', 'SAFETY_INTERVAL', 1, 21, 'Kiểm tra sâu xanh ăn lá (bắt tay hoặc phun BT nếu mật độ cao). Ngừng tuyệt đối phân bón thuốc BVTV.', 'Ngừng tưới 24h trước thu hái để rau ráo nước, bảo quản tươi ngon lâu dài.', 'Không áp dụng phân bón ở bước này.', 'Sâu tơ, sâu xanh, sâu khoang: Phun vi khuẩn sinh học Bacillus thuringiensis (BT - Delfin WG 15g/16L). PHI: 2-3 ngày.', 'Chế phẩm vi khuẩn BT (Delfin WG), bình phun chuyên dụng.', 'Ảnh thảm rau dền đỏ mơn mởn', 'Thực hiện đầy đủ kỹ thuật bước Kiểm tra sâu & Cách ly tuyệt đối, đạt chỉ tiêu sinh trưởng theo ngày tuổi 21.', 22.0, 32.0, 60.0, 75.0),
(88, 10, 7, 'Thu hoạch & Nghiệm thu', 'HARVEST', 1, 26, 'Nhổ cả cây rửa sạch đất rễ (hoặc cắt ngang thân chừa 3cm để tái sinh). Cân ký và chụp ảnh minh chứng.', 'Ngừng tưới 24h trước thu hái để rau ráo nước, bảo quản tươi ngon lâu dài.', 'Không áp dụng phân bón ở bước này.', 'Theo dõi sâu bệnh thường xuyên; ưu tiên bắt thủ công hoặc bẫy dính vàng nếu mật độ thấp.', 'Dụng cụ làm vườn chuyên dụng.', 'Ảnh bó rau dền đỏ trên cân điện tử', 'Đạt chỉ tiêu thu hái an toàn: không dư lượng BVTV (PHI >= 5 ngày), tươi giòn, đúng kích thước thương phẩm, cân điện tử ghi nhận chính xác.', 20.0, 30.0, 60.0, 70.0)
ON CONFLICT (step_id) DO UPDATE SET
    template_id          = EXCLUDED.template_id,
    step_order           = EXCLUDED.step_order,
    step_name            = EXCLUDED.step_name,
    task_type            = EXCLUDED.task_type,
    duration_days        = EXCLUDED.duration_days,
    day_offset           = EXCLUDED.day_offset,
    description          = EXCLUDED.description,
    water_regime         = EXCLUDED.water_regime,
    nutrition_regime     = EXCLUDED.nutrition_regime,
    pest_warning         = EXCLUDED.pest_warning,
    materials_needed     = EXCLUDED.materials_needed,
    evidence_requirement = EXCLUDED.evidence_requirement,
    inspection_criteria  = EXCLUDED.inspection_criteria,
    min_temp             = EXCLUDED.min_temp,
    max_temp             = EXCLUDED.max_temp,
    min_humidity         = EXCLUDED.min_humidity,
    max_humidity         = EXCLUDED.max_humidity;

-- 6. CẬP NHẬT LẠI SEQUENCE CHO BẢNG TEMPLATE_STEPS
SELECT setval(pg_get_serial_sequence('template_steps', 'step_id'), COALESCE(MAX(step_id), 1)) FROM template_steps;
