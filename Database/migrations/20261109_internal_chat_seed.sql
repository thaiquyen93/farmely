-- Seed one general Admin–Expert conversation and messages for the existing
-- Expert–Staff conversation. Re-running this migration does not duplicate rows.
INSERT INTO conversations (participant_one, participant_two, rental_id, plot_id, type, status)
SELECT 11, 5, NULL, NULL, 'ADMIN_EXP', 'OPEN'
WHERE NOT EXISTS (
  SELECT 1
  FROM conversations
  WHERE type = 'ADMIN_EXP'
    AND ((participant_one = 11 AND participant_two = 5)
      OR (participant_one = 5 AND participant_two = 11))
);

INSERT INTO conversations (participant_one, participant_two, rental_id, plot_id, type, status)
SELECT 8, 5, NULL, NULL, 'STAFF_EXP', 'OPEN'
WHERE NOT EXISTS (
  SELECT 1
  FROM conversations
  WHERE type = 'STAFF_EXP'
    AND ((participant_one = 8 AND participant_two = 5)
      OR (participant_one = 5 AND participant_two = 8))
);

UPDATE conversations
SET rental_id = NULL, plot_id = NULL
WHERE type = 'STAFF_EXP'
  AND ((participant_one = 8 AND participant_two = 5)
    OR (participant_one = 5 AND participant_two = 8));

INSERT INTO messages (conversation_id, sender_id, content, created_at)
SELECT c.conversation_id, 11,
       'Anh Nam, nhờ anh cập nhật tiến độ quy trình VietGAP và các hạng mục cần Ban Quản Trị hỗ trợ trong tuần này.',
       NOW() - INTERVAL '4 minutes'
FROM conversations c
WHERE c.type = 'ADMIN_EXP'
  AND ((c.participant_one = 11 AND c.participant_two = 5)
    OR (c.participant_one = 5 AND c.participant_two = 11))
  AND NOT EXISTS (
    SELECT 1 FROM messages m
    WHERE m.conversation_id = c.conversation_id
      AND m.content = 'Anh Nam, nhờ anh cập nhật tiến độ quy trình VietGAP và các hạng mục cần Ban Quản Trị hỗ trợ trong tuần này.'
  );

INSERT INTO messages (conversation_id, sender_id, content, created_at)
SELECT c.conversation_id, 5,
       'Tôi đã rà soát tiến độ. Hôm nay tôi sẽ gửi bản cập nhật và danh sách hạng mục cần hỗ trợ để Ban Quản Trị theo dõi.',
       NOW() - INTERVAL '3 minutes'
FROM conversations c
WHERE c.type = 'ADMIN_EXP'
  AND ((c.participant_one = 11 AND c.participant_two = 5)
    OR (c.participant_one = 5 AND c.participant_two = 11))
  AND NOT EXISTS (
    SELECT 1 FROM messages m
    WHERE m.conversation_id = c.conversation_id
      AND m.content = 'Tôi đã rà soát tiến độ. Hôm nay tôi sẽ gửi bản cập nhật và danh sách hạng mục cần hỗ trợ để Ban Quản Trị theo dõi.'
  );

INSERT INTO messages (conversation_id, sender_id, content, created_at)
SELECT c.conversation_id, 5,
       'Lực, chiều nay em kiểm tra hệ thống tưới ở khu P-03 giúp anh và báo lại tình trạng sau khi hoàn tất nhé.',
       NOW() - INTERVAL '2 minutes'
FROM conversations c
WHERE c.type = 'STAFF_EXP'
  AND ((c.participant_one = 8 AND c.participant_two = 5)
    OR (c.participant_one = 5 AND c.participant_two = 8))
  AND NOT EXISTS (
    SELECT 1 FROM messages m
    WHERE m.conversation_id = c.conversation_id
      AND m.content = 'Lực, chiều nay em kiểm tra hệ thống tưới ở khu P-03 giúp anh và báo lại tình trạng sau khi hoàn tất nhé.'
  );

INSERT INTO messages (conversation_id, sender_id, content, created_at)
SELECT c.conversation_id, 8,
       'Dạ, em sẽ kiểm tra khu P-03 trong ca chiều và gửi kết quả kèm ảnh hiện trường cho anh.',
       NOW() - INTERVAL '1 minute'
FROM conversations c
WHERE c.type = 'STAFF_EXP'
  AND ((c.participant_one = 8 AND c.participant_two = 5)
    OR (c.participant_one = 5 AND c.participant_two = 8))
  AND NOT EXISTS (
    SELECT 1 FROM messages m
    WHERE m.conversation_id = c.conversation_id
      AND m.content = 'Dạ, em sẽ kiểm tra khu P-03 trong ca chiều và gửi kết quả kèm ảnh hiện trường cho anh.'
  );
