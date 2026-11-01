# Kết quả Playwright Chromium — 30/10/2026

Nhánh: `test/playwright`. Lệnh chạy tại `frontend/`:

```powershell
npx playwright test --config=playwright.workflow.config.ts
```

Môi trường: frontend E2E `http://127.0.0.1:3300`; PostgreSQL `farmely_e2e` trên cổng `5544`. Global setup xác minh mọi service và Vite plugin trỏ vào DB này trước khi chạy. Không ghi/xóa DB hiện tại; không gọi cổng thanh toán thật; không xuất body `/api/users` vào log. Sau lượt chạy, fixture `E2E F1-%` và `E2E-F1-%` còn **0** bản ghi.

## Kết quả thực tế

| ID    | Kết quả       | Chứng cứ / giới hạn                                                                                                                 |
| ----- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| F1-01 | PASS một phần | Tạo Land bằng UI, kiểm tra API và reload. Chưa kiểm tra ranh giới hình học.                                                         |
| F1-02 | FAIL          | Tạo Land trùng tên vẫn thành công, không có cảnh báo; cần kiểm tra và sửa rule ở runtime Vite plugin. Fixture đã dọn.               |
| F1-04 | PASS một phần | UI tạo Plot `AVAIL`, `isPublished=false`, diện tích và giá đúng. Chưa chứng minh plot ẩn khỏi Marketplace bằng fixture có hình học. |
| F4-01 | PASS          | Doanh thu trên dashboard khớp API analytics sau reload. Chưa seed ledger cố định để kiểm tra công thức tiền.                        |
| F4-06 | PASS          | Tổng Plot, từng trạng thái và tỷ lệ lấp đầy khớp danh sách Plot API; dashboard hiển thị đúng tỷ lệ.                                 |
| F4-12 | FAIL          | Mock API analytics trả 503 nhưng UI vẫn hiện doanh thu mẫu `19.595.000 đ` và nhãn live.                                             |

**6 test được chạy: 4 PASS, 2 FAIL, 0 BLOCKED trong số test đã triển khai.** Hai PASS ở F1 chỉ xác nhận phần được ghi trong cột chứng cứ, chưa hoàn tất toàn bộ case gốc. So với ma trận 76 case, mới thực thi 6 ID (7,9%); Luồng 1: 3/16, Luồng 2: 0/24, Luồng 3: 0/23, Luồng 4: 3/13. **70 ID chưa chạy**, không được tính là BLOCKED hay PASS.

Nhóm chỉ đọc hiện có được chạy riêng trên Chromium với `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3300` và kết quả **21/21 PASS**. Nhóm này kiểm tra mở trang, form validation và guard điều hướng UI cho Authentication, Customer, Staff, Expert, Admin và cross-role; dùng localStorage demo nên không chứng minh phân quyền backend. **Tổng cả hai nhóm: 27 test đã chạy, 25 PASS, 2 FAIL.** 21 test chỉ đọc không được cộng vào 6/76 ID workflow.

Chưa kiểm thử: công bố và Marketplace với plot có hình học; cấu hình giống/quy trình/dịch vụ; thuê, giữ chỗ, thanh toán sandbox và hợp đồng; vận hành Staff/Expert, IoT, sự cố, thu hoạch; đối soát ledger và phân quyền backend bằng JWT thật. Demo role trong các test này chỉ xác thực điều hướng UI, không chứng minh quyền backend. Không sửa business logic trong lượt này.

HTML report: `frontend/playwright-report-workflow/index.html`. Trace của hai ca FAIL nằm trong `frontend/test-results/`.
