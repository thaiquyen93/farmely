# 📚 TÀI LIỆU THAM KHẢO HỆ THỐNG (REFERENCES)

Thư mục này lưu trữ các tài liệu học tập và kiến trúc chuẩn quốc tế phục vụ cho đồ án **ISP392**.

---

## 1. System Design Primer (Donne Martin)
* **Đường dẫn thư mục:** [`references/system-design-primer/`](system-design-primer/README.md)
* **Kho lưu trữ gốc:** [GitHub - donnemartin/system-design-primer](https://github.com/donnemartin/system-design-primer)
* **Mô tả:** Bộ cẩm nang thiết kế hệ thống phân tán nổi tiếng thế giới, bao gồm lý thuyết về Scalability, High Availability, Caching, Load Balancing, Database Replication, Message Queues và Asynchronous Processing.

### Các chương trọng tâm áp dụng trực tiếp vào đồ án ISP392:
1. **[Performance vs Scalability](system-design-primer/README.md#performance-vs-scalability):** Hiểu rõ cách tối ưu hóa hiệu năng và mở rộng theo chiều ngang.
2. **[CAP Theorem & Consistency Patterns](system-design-primer/README.md#cap-theorem):** Lựa chọn CP cho giao dịch thuê đất (Rental) và AP cho cảm biến IoT.
3. **[Load Balancer & Reverse Proxy](system-design-primer/README.md#load-balancer):** Cấu hình NGINX làm Reverse Proxy, SSL Termination và Rate Limiting.
4. **[Caching (Redis)](system-design-primer/README.md#cache):** Chiến lược Cache-Aside, phòng chống Cache Stampede và quản lý khóa phân tán (Distributed Lock).
5. **[Asynchronism & Message Queues](system-design-primer/README.md#asynchronism):** Hàng đợi xử lý tác vụ nền: hủy đơn giữ chỗ hết hạn 15 phút, gọi AI sinh đề xuất canh tác, nén ảnh hiện trường.
6. **[Database Replication & Sharding](system-design-primer/README.md#database):** Master-Slave RDBMS cho giao dịch ACID và Time-series table cho telemetry cảm biến.

---

## 2. Tài liệu thiết kế kiến trúc chuẩn hóa cho ISP392
* **Đặc tả kiến trúc chi tiết:** [`SYSTEM_DESIGN_SPECIFICATION.md`](../SYSTEM_DESIGN_SPECIFICATION.md)
* **Sơ đồ kiến trúc PlantUML:** [`diagrams/06_System_Architecture_Primer.puml`](../diagrams/06_System_Architecture_Primer.puml)
* **Hình ảnh sơ đồ kiến trúc:** [`diagrams/06_System_Architecture_Primer.png`](../diagrams/06_System_Architecture_Primer.png)
