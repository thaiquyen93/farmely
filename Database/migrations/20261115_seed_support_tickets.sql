INSERT INTO support_tickets (id, customer_id, category, title, description, status, created_at, updated_at)
VALUES 
(1, 1, 'CULTIVATION', 'Hỗ trợ về canh tác & theo dõi', 'Cây xà lách Romaine có dấu hiệu vàng lá mép dưới sau đợt mưa lớn hôm qua, nhờ chuyên gia kiểm tra giúp tình trạng đất và lịch tưới.', 'NEW', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '3 hours'),
(2, 1, 'RENTAL', 'Hỗ trợ về thuê đất, hợp đồng & thanh toán', 'Hợp đồng của tôi sắp hết hạn vào cuối tháng, tôi muốn hỏi thủ tục gia hạn thêm 1 mùa vụ nữa thì hệ thống có tự động giữ thửa P-02 không?', 'RESPONDED', NOW() - INTERVAL '1 day', NOW() - INTERVAL '5 hours'),
(3, 1, 'FEEDBACK', 'Góp ý cho Farmely', 'Giao diện theo dõi thời tiết và cẩm nang canh tác rất trực quan, mong trang trại bổ sung thêm cảnh báo mưa giông trước 2 giờ.', 'CLOSED', NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO support_events (ticket_id, actor_id, actor_role, type, body, to_status, created_at)
VALUES 
(1, 1, 'CUSTOMER', 'CREATED', 'Cây xà lách Romaine có dấu hiệu vàng lá mép dưới sau đợt mưa lớn hôm qua, nhờ chuyên gia kiểm tra giúp tình trạng đất và lịch tưới.', 'NEW', NOW() - INTERVAL '3 hours'),
(2, 1, 'CUSTOMER', 'CREATED', 'Hợp đồng của tôi sắp hết hạn vào cuối tháng, tôi muốn hỏi thủ tục gia hạn thêm 1 mùa vụ nữa thì hệ thống có tự động giữ thửa P-02 không?', 'NEW', NOW() - INTERVAL '1 day'),
(2, 11, 'ADMIN', 'REPLY', 'Dạ chào bạn, hệ thống Farmely hỗ trợ gia hạn trực tiếp tại mục Hợp Đồng. Bạn chỉ cần bấm Gia hạn trước ngày kết thúc là thửa đất sẽ tiếp tục được giữ canh tác nhé!', NULL, NOW() - INTERVAL '5 hours'),
(3, 1, 'CUSTOMER', 'CREATED', 'Giao diện theo dõi thời tiết và cẩm nang canh tác rất trực quan, mong trang trại bổ sung thêm cảnh báo mưa giông trước 2 giờ.', 'NEW', NOW() - INTERVAL '3 days'),
(3, 11, 'ADMIN', 'REPLY', 'Cảm ơn bạn đã góp ý! Farmely đã tích hợp hệ thống cảnh báo thời tiết tự động theo thời gian thực rồi nhé.', NULL, NOW() - INTERVAL '2 days')
ON CONFLICT DO NOTHING;

SELECT setval(pg_get_serial_sequence('support_tickets', 'id'), (SELECT COALESCE(MAX(id), 1) FROM support_tickets));

