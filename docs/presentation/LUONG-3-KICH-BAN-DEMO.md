# KỊCH BẢN THUYẾT TRÌNH & DEMO: LUỒNG 3 — VÒNG ĐỜI VỤ MÙA THÔNG MINH
> **Người đảm nhiệm:** Tạ Nguyễn Khôi Nguyên (Trưởng nhóm / Core Business Slice)  
> **Thời lượng demo tối ưu:** 3 phút 30 giây đến 4 phút.  
> **Chuẩn bị tab trình duyệt:** 
> 1. Tab 1: Khách hàng (`/customer/dashboard`)
> 2. Tab 2: Chuyên viên lao động Trần Văn Lực (`/staff/dashboard`)
> 3. Tab 3: Chuyên gia nông nghiệp ThS. Nguyễn Hoàng Nam (`/expert/dashboard`)

---

## 📌 QUY TẮC VÀNG VỀ TÍNH NĂNG THỜI TIẾT (WEATHER API / BR18)
* **Định vị:** **TÍNH NĂNG PHỤ LÀM NỀN (SECONDARY SUPPORTING FEATURE)**.
* **Thời lượng:** Lướt nhanh trong **15 - 20 giây**; tuyệt đối KHÔNG sa đà giải thích kỹ thuật API hay biểu đồ thời tiết làm loãng mạch kịch bản chính.
* **Mục đích:** Làm "bàn đạp logic" giải thích tại sao nhân viên hiện trường hoãn việc tưới nước để chuyển sang nhiệm vụ kỹ thuật khác (tránh tưới thừa khi đất đã đủ ẩm theo BR18).

---

## 🎬 DIỄN BIẾN 4 HỒI DEMO CHI TIẾT

### HỒI 1: THỬA TỰ CANH TÁC (P-03) — TRẢI NGHIỆM TỰ TAY & DỊCH VỤ ĐỘT XUẤT (45s)
1. **Mở Tab Khách hàng:** Chọn thửa **P-03 (Self-growing)**.
   * *Thoại:* *"Sau khi ký hợp đồng thuê đất ở Luồng 2, tại thửa tự canh tác P-03, khách hàng được tự do trải nghiệm theo dõi sinh trưởng theo cẩm nang VietGAP. Tuy nhiên, tuần này khách bận công tác đột xuất..."*
2. **Yêu cầu Dịch vụ đột xuất (On-Demand Service):**
   * Bấm sang tab **Dịch vụ** $\rightarrow$ Chọn đặt nhanh gói *"Tưới ẩm vi sinh & tỉa cành đột xuất"*.
3. **Tư vấn 1-on-1 với Chuyên gia (Direct Chat):**
   * Mở khung **Chat với ThS. Nguyễn Hoàng Nam**: *"Thầy Nam ơi, cây nhà em 10 ngày tuổi đang hơi vàng lá nhẹ, gói này có bổ sung vi sinh cải tạo rễ chưa ạ?"*
   * Sang Tab Expert gõ 1 câu trả lời: *"Đã bao gồm chủng vi sinh EM1 nhé, lát nữa nhân viên Lực sẽ qua xử lý ngay."*
   * *Chốt Hồi 1:* Hoàn thành trọn vẹn giá trị hỗ trợ của nền tảng cho người dùng tự trồng trọt.

---

### HỒI 2: THỬA ỦY THÁC (P-12) — VI KHÍ HẬU NỀN & NGHIỆM THU THỰC ĐỊA (60s)
1. **Chuyển sang Thửa P-12 (Assisted-growing):**
   * *Thoại:* *"Còn với thửa đất Farmely chăm sóc trọn gói P-12, khách hàng không cần tốn công sức. Mọi việc đều do kỹ thuật viên phụ trách."*
2. **Điểm nhanh Vi khí hậu thực địa (15s — Tính năng phụ):**
   * Chỉ tay vào thẻ Hero trạng thái: *"Hệ thống tự động cập nhật Weather API theo tọa độ GPS trang trại. Sáng nay ghi nhận đất đạt độ ẩm 82% và chiều có mưa, nên theo BR18 hệ thống hiển thị thông báo hoãn tưới nước để tránh úng rễ."*
3. **Chuyển Tab Staff (Trần Văn Lực):**
   * Mở danh sách công việc hôm nay: Lịch tưới đã được hoãn, Lực làm nhiệm vụ *Làm đất & bón lót vi sinh EM1*.
   * Lực thực hiện xong $\rightarrow$ Bắt buộc nạp **$\ge 1$ ảnh thực địa** (BR15) $\rightarrow$ Bấm **Xác nhận hoàn tất**.
4. **Quay lại Tab Khách hàng:**
   * Không cần F5, công việc tự động đánh dấu hoàn thành.
   * Mở **Nhật ký canh tác (Farm Diary)** xem ngay ảnh thực tế Lực vừa gửi về kèm nhiệt độ/độ ẩm lúc làm việc.

---

### HỒI 3: CAO TRÀO GIỮA VỤ — SỰ CỐ NÔNG HỌC & ĐIỀU PHỐI TAM GIÁC (60s)
1. **Staff phát hiện sâu hại:**
   * Tại tab của Lực, Lực đi tuần phát hiện lá có đốm nấm $\rightarrow$ Bấm **Báo cáo sự cố hiện trường (Issue Report)**, chụp ảnh gửi lên.
2. **Expert ThS. Nam can thiệp:**
   * Sang Tab Chuyên gia: Thấy cảnh báo sự cố đỏ $\rightarrow$ Xem ảnh chẩn đoán *"Bệnh sương mai giai đoạn chớm"*.
   * Bấm **Ra toa phác đồ VietGAP khẩn cấp** $\rightarrow$ Dispatch nhiệm vụ xử lý sinh học xuống cho Lực.
3. **Khắc phục & Đồng bộ:**
   * Lực nhận task khẩn, phun chế phẩm thảo mộc $\rightarrow$ Nghiệm thu.
   * Khách hàng thấy sự cố chuyển sang `RESOLVED`. Thửa rau an toàn!

---

### HỒI 4: KẾT THÚC CÓ HẬU — DUYỆT THU HOẠCH & ĐÓN NHẬN NÔNG SẢN (45s)
1. **Tua nhanh đến cuối vụ:**
   * Bấm nút **`🌾 Ngày kết thúc (Ngày 45 · Thu hoạch)`** trên timeline.
2. **Expert duyệt thu hoạch:**
   * ThS. Nam kiểm tra thời gian cách ly an toàn VietGAP $\rightarrow$ Bấm **Phê duyệt thu hoạch (Harvest Approval)**.
3. **Khách hàng đặt lịch trải nghiệm:**
   * Khách hàng nhận thông báo $\rightarrow$ Bấm chọn: *"Đặt lịch cuối tuần cả nhà xuống nông trại tự tay thu hoạch"*.
4. **Staff nghiệm thu sản lượng:**
   * Lực thu hái, cân sản lượng 18.5 kg, gắn mã `staff_id = 8` (BR20).
   * Khách hàng hoàn tất trọn vẹn vụ mùa sạch 100%!
