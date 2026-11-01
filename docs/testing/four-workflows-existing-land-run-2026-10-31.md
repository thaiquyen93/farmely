# Chạy thử bốn luồng trên plot mới trong land có sẵn — 31/10/2026

**Môi trường:** Playwright Chromium, `http://127.0.0.1:3300`, PostgreSQL `farmely_e2e` (port 5544). Kiểm tra cô lập chạy trước test. Không ghi dữ liệu vào `localhost:3000`. Thanh toán dùng mock. Test tạo plot chính P-6626766 và plot hủy riêng trong **land ID 1**; không tạo land. Sau test đã dọn hai plot do test tạo: DB trở về 3 land, 16 plot.

**Lệnh:** `cd frontend; npx playwright test --config=playwright.workflow.config.ts e2e/four-workflows-existing-land.workflow.spec.ts`

**Kết quả:** 1 test tích hợp FAIL; 14/22 checkpoint PASS, 8/22 FAIL. Đây là một tuyến xuyên vai trò, không phải 76 case của test matrix. HTML report và trace được tạo cục bộ trong `frontend/playwright-report-workflow/` và `frontend/test-results/`; chúng không được đưa vào Git.

| Luồng | PASS | FAIL | Kết luận |
| --- | ---: | ---: | --- |
| 1. Chuẩn bị cho thuê | 2 | 0 | Tạo plot trong land có sẵn, gắn giống/quy trình/giá, công bố và tìm thấy trên Marketplace. |
| 2. Thuê và đặt dịch vụ | 4 | 0 | Quyền thuê plot, thanh toán mock, nhận hợp đồng; Admin giao Nam/Lực; mua dịch vụ thành công. Tư vấn trước thuê chưa thử trong tuyến này. |
| 3. Canh tác đến nông sản | 4 | 8 | Xử lý sự cố, task hoàn thành khi giao riêng, API chat khi tự tạo kênh, thu hoạch/nghiệm thu chạy; nối chat, IoT, task, nhật ký và yêu cầu thu hoạch còn lỗi. |
| 2. Nhánh hủy/hoàn riêng | 1 | 0 | Plot thứ hai hủy, hoàn 80% và ghi REFUND thành công. |
| 4. Hiệu quả kinh doanh | 2 | 0 | Thực thu sau hoàn, giao dịch hoàn gần nhất, lấp đầy và tổng task khớp DB. |
| Dữ liệu test | 1 | 0 | Không tạo land; đã dọn hai plot test. |

## Tám checkpoint FAIL

1. **Chat Quyền ↔ Nam:** Sau phân công Expert 5, không có conversation `CUST_EXP` gắn đúng rental và plot. API phân công cố chèn conversation thiếu `type` bắt buộc và thiếu `plot_id`, rồi nuốt lỗi. Ảnh hưởng: không demo được tư vấn theo plot mới.
2. **Chat Lực ↔ Nam:** Không có conversation `STAFF_EXP` cho rental/plot; tự tạo kênh bằng fixture rồi gửi tin qua API thì PASS. Ảnh hưởng: trao đổi nghiệp vụ tự động bị đứt.
3. **Inbox Expert:** Dù fixture có conversation/tin nhắn trong DB, dashboard Expert không hiện plot mới. `chatService.syncBackendMessages` chỉ cập nhật thread có sẵn ở localStorage, không thêm thread mới. Ảnh hưởng: Nam không thấy trao đổi của plot mới.
4. **IoT alert:** Đã chèn sensor reading 39°C cho plot mới nhưng `/api/alerts?plotId=...` trả danh sách mẫu P-01/P-02/P-03, không có plot mới. Ảnh hưởng: demo cảnh báo IoT theo plot mới sai.
5. **IoT latest:** Gọi `/api/sensors/plots/142/latest` trả reading của plot ID 20. Điều kiện tìm plot dùng `LPAD(id,2,'0')`, cắt ID ba chữ số thành hai chữ số, chọn nhầm P-14. Ảnh hưởng: cảm biến có thể hiển thị dữ liệu thửa khác.
6. **Giao task:** Rental được giao Lực (user 8), nhưng task đã sinh vẫn giao user 10. Giao task lại qua API riêng và hoàn thành có ảnh thì PASS. Ảnh hưởng: Lực không nhận đúng việc khi Admin chỉ phân công ở rental.
7. **Nhật ký task:** Task của rental ID 94 hoàn thành, nhưng diary được tạo với `rental_id=1`. API parse kết quả SQL như JSON; khi không parse được thì fallback về 1. Ảnh hưởng: khách của plot mới không thấy nhật ký của mình, có nguy cơ lẫn dữ liệu.
8. **Yêu cầu thu hoạch:** `POST /api/harvest-plans` trả HTTP 500; log Vite: `http proxy error: /api/harvest-plans — ECONNREFUSED`. Giao diện Expert đang lưu kế hoạch trong localStorage. Ảnh hưởng: yêu cầu từ Customer không bền và không đi được qua session riêng sang Nam.

**Đã PASS trong luồng 3:** chat API hoạt động nếu fixture tạo kênh đúng; Admin giao task riêng cho Lực, Lực hoàn thành có ảnh; Lực báo issue, Nam chẩn đoán; ghi kết quả thu hoạch và Quyền xác nhận nhận nông sản.

**Chưa khẳng định:** thông báo hoàn tất hiển thị ở Customer, tự chuyển rental khi tới Start Date, giao hàng thực tế, đánh giá lưu bền và mọi negative/authorization case. Test này dùng API Playwright cho thao tác nghiệp vụ và trình duyệt cho các mốc Marketplace/dashboard/chat; chưa phải toàn bộ thao tác bằng chuột.
