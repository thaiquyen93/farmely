package com.smartagrirent.ai.service.impl;

import com.smartagrirent.ai.dto.ChatRequest;
import com.smartagrirent.ai.dto.ChatResponse;
import com.smartagrirent.ai.dto.ReferencedDocumentDto;
import com.smartagrirent.ai.service.AiChatService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;

@Slf4j
@Service
public class AiChatServiceImpl implements AiChatService {

    @Override
    public ChatResponse processChat(ChatRequest request) {
        String userMsg = request.getMessage() != null ? request.getMessage().trim() : "";
        String convId = (request.getConversationId() != null && !request.getConversationId().isBlank())
                ? request.getConversationId()
                : "conv-" + UUID.randomUUID().toString().substring(0, 8);

        if (userMsg.isEmpty()) {
            return ChatResponse.builder()
                    .conversationId(convId)
                    .reply("Dạ Bác Ba đây! Bạn có câu hỏi nào về vườn rau, độ ẩm đất hay kỹ thuật canh tác không cứ nhắn cho Bác nhé.")
                    .referencedDocuments(Collections.emptyList())
                    .status("SUCCESS")
                    .build();
        }

        String lower = userMsg.toLowerCase();
        String reply;
        List<ReferencedDocumentDto> docs = new ArrayList<>();

        // 1. Nhận diện chào hỏi xã giao
        if (isGreeting(lower)) {
            reply = "Dạ Bác Ba Nông Dân xin chào bạn nhé! Rất vui được gặp bạn trên nông trại thông minh Farmely. "
                    + "Hôm nay bạn cần Bác Ba tư vấn về kỹ thuật gieo trồng, kiểm tra độ ẩm đất IoT hay tìm hiểu thủ tục thuê thửa đất nào không?";
            docs.add(ReferencedDocumentDto.builder()
                    .chunkId("doc-intro-01")
                    .docTitle("Cẩm nang Hướng dẫn Khách hàng Farmely 2026")
                    .source("Farmely General Guide")
                    .similarityScore(0.95)
                    .build());
        }
        // 2. Nhận diện cảm ơn / tạm biệt
        else if (isGratitude(lower)) {
            reply = "Dạ không có chi đâu bạn ơi! Làm nông nghiệp sạch cùng nhau vui và ý nghĩa lắm. "
                    + "Chúc bạn có một mùa vụ tươi tốt, rau lớn nhanh và luôn an lành nhé. Cần gì cứ gọi Bác Ba bất cứ lúc nào!";
        } else if (isGoodbye(lower)) {
            reply = "Tạm biệt bạn nhé! Chúc bạn một ngày ngập tràn niềm vui. Khi nào rảnh ghé thăm luống rau trên bản đồ vệ tinh Farmely nhen!";
        }
        // 3. Tư vấn rau xà lách
        else if (lower.contains("xà lách") || lower.contains("xa lach")) {
            reply = "Rau xà lách (Romaine, mỡ, xoăn) tại Farmely phát triển lý tưởng ở nền nhiệt 18°C – 25°C, độ ẩm đất từ 65% – 75%.\n\n"
                    + "• Kỹ thuật tưới: Tưới phun mưa mịn vào sáng sớm (6h30 - 7h30) và chiều mát (16h - 17h). Tuyệt đối tránh tưới đẫm vào ban đêm để ngăn nấm bệnh thối nhũn bẹ lá.\n"
                    + "• Thu hoạch: Chu kỳ sinh trưởng từ 35 - 45 ngày. Nên thu hoạch vào buổi sáng sớm khi bẹ lá còn ngậm sương giòn ngọt nhất.";
            docs.add(ReferencedDocumentDto.builder()
                    .chunkId("doc-veg-01")
                    .docTitle("Kỹ thuật Canh tác Rau Xà lách Thủy Canh & Thổ Canh")
                    .source("Cẩm nang Sinh học Cây trồng Farmely")
                    .similarityScore(0.92)
                    .build());
        }
        // 4. Tư vấn độ ẩm & điều tiết tưới nước (BR18)
        else if (lower.contains("độ ẩm") || lower.contains("ẩm đất") || lower.contains("tưới nước") || lower.contains("tưới bù") || lower.contains("mưa")) {
            reply = "Theo quy chuẩn điều tiết tưới vi khí hậu Farmely (Quy tắc BR18):\n\n"
                    + "• Độ ẩm đất lý tưởng duy trì ở mức 60% – 75%.\n"
                    + "• Khi cảm biến IoT báo độ ẩm đất giảm sâu dưới 38%: Trạm điều hành sẽ gửi cảnh báo và kích hoạt chu kỳ tưới nhỏ giọt bù ẩm.\n"
                    + "• Khi độ ẩm đất ≥ 80% hoặc dự báo thời tiết có xác suất mưa ≥ 70%: Hệ thống tự động hoãn ca tưới để bảo vệ rễ cây chống úng ngập.";
            docs.add(ReferencedDocumentDto.builder()
                    .chunkId("doc-iot-02")
                    .docTitle("Quy chuẩn Điều tiết Tưới & Vi khí hậu Thông minh (BR18)")
                    .source("Tài liệu Vận hành Trạm IoT Farmely")
                    .similarityScore(0.94)
                    .build());
        }
        // 5. Phòng trừ sâu bệnh sinh học
        else if (lower.contains("sâu") || lower.contains("rầy") || lower.contains("bọ trĩ") || lower.contains("ốc sên") || lower.contains("bệnh") || lower.contains("vàng lá")) {
            reply = "Farmely kiên quyết áp dụng 100% biện pháp bảo vệ thực vật sinh học hữu cơ:\n\n"
                    + "• Bọ trĩ, rầy mềm: Phun chế phẩm sinh học gừng - tỏi - ớt lên men vi sinh hoặc dầu khoáng sinh học SK Enspray 99EC.\n"
                    + "• Ống tưới và rễ: Rải men nấm đối kháng Trichoderma bảo vệ vùng rễ.\n"
                    + "• Ốc sên hại mầm: Rải vỏ trứng vụn quanh gốc hoặc bẫy sinh học men bia.\n\n"
                    + "Nếu diện tích nhiễm rộng, bạn hãy bấm sang tab 'Kênh Chuyên Gia' để ThS. Nguyễn Hoàng Nam kê đơn thuốc đặc trị hiện trường nhé!";
            docs.add(ReferencedDocumentDto.builder()
                    .chunkId("doc-pest-03")
                    .docTitle("Phòng trừ Dịch hại Cây trồng Bằng Biện pháp Sinh học")
                    .source("Sổ tay Nông nghiệp Hữu cơ")
                    .similarityScore(0.89)
                    .build());
        }
        // 6. Quy trình thuê đất & hợp đồng
        else if (lower.contains("thuê") || lower.contains("hợp đồng") || lower.contains("giá") || lower.contains("gia hạn") || lower.contains("chi phí")) {
            reply = "Quy trình thuê thửa đất tại Farmely cực kỳ minh bạch và đơn giản:\n\n"
                    + "1. Chọn thửa đất ưng ý trên bản đồ vệ tinh Marketplace (xem độ phì nhiêu pH, hướng nắng, hạ tầng tưới).\n"
                    + "2. Chọn giống rau canh tác và phương thức (Tự trồng hoặc Trọn gói có nhân viên chăm sóc).\n"
                    + "3. Thanh toán trực tuyến 100% qua VNPay/VietQR để kích hoạt hợp đồng điện tử.\n"
                    + "4. Gia hạn hợp đồng: Bạn có thể chủ động gia hạn trước ngày kết thúc 3 ngày với chiết khấu từ 5% – 15%.";
            docs.add(ReferencedDocumentDto.builder()
                    .chunkId("doc-lease-04")
                    .docTitle("Quy chế Hợp đồng Thuê đất Nông nghiệp Công nghệ cao (BR11, BR12)")
                    .source("Trung tâm Pháp lý Farmely")
                    .similarityScore(0.91)
                    .build());
        }
        // 7. Thu hoạch & Nghiệm thu
        else if (lower.contains("thu hoạch") || lower.contains("sản lượng") || lower.contains("khiếu nại") || lower.contains("giao rau")) {
            reply = "Khi đến kỳ thu hoạch:\n\n"
                    + "• Nhân viên hiện trường sẽ cân sản lượng thực tế, dán tem QR truy xuất nguồn gốc và chụp ảnh đối chứng.\n"
                    + "• Bạn có thể nghiệm thu đánh giá chất lượng (Độ tươi, Đóng gói) trên trang Quản lý.\n"
                    + "• Trường hợp sản lượng thiếu hụt do yếu tố khách quan kỹ thuật, hệ thống bảo hiểm Farmely sẽ thẩm định bồi hoàn tiền hoặc bù sản lượng vụ kế tiếp cho bạn theo quy tắc BR16.";
            docs.add(ReferencedDocumentDto.builder()
                    .chunkId("doc-harvest-05")
                    .docTitle("Quy trình Thu hoạch, Đóng gói & Bồi thường Sau Thu hoạch (BR16, BR17)")
                    .source("Quy chế Vận hành Nông trường")
                    .similarityScore(0.93)
                    .build());
        }
        // 8. Câu hỏi tổng quát
        else {
            if (userMsg.length() <= 8) {
                reply = "Dạ Bác Ba Nông Dân nghe đây! Bạn đang quan tâm đến kỹ thuật gieo trồng, kiểm tra độ ẩm đất vi khí hậu hay muốn tìm hiểu thủ tục thuê thửa đất trên Farmely? Cứ nhắn cụ thể câu hỏi cho Bác Ba nhé! Nếu cần phác đồ chuyên sâu, bạn có thể bấm tab 'Kênh Chuyên Gia' để trao đổi trực tiếp với ThS. Hoàng Nam nha.";
            } else {
                reply = "Dạ Bác Ba đã ghi nhận câu hỏi từ bạn. Đối với canh tác nông nghiệp công nghệ cao tại Farmely, bạn nên thường xuyên theo dõi biểu đồ cảm biến IoT thời gian thực của thửa đất (độ ẩm đất, nhiệt độ, EC) để điều tiết nước tưới và phân bón hợp lý.\n\n"
                        + "Bạn cũng có thể bấm sang tab 'Kênh Chuyên Gia' ở ngay phía trên để trò chuyện trực tiếp và nhận tư vấn chi tiết từ ThS. Hoàng Nam nhé!";
            }
            docs.add(ReferencedDocumentDto.builder()
                    .chunkId("doc-general-00")
                    .docTitle("Cẩm nang Hướng dẫn Canh tác Toàn diện Farmely")
                    .source("Hệ sinh thái Nông nghiệp Thông minh")
                    .similarityScore(0.85)
                    .build());
        }

        log.info("AI Chatbot processed query: '{}' -> convId: {}", userMsg, convId);

        return ChatResponse.builder()
                .conversationId(convId)
                .reply(reply)
                .referencedDocuments(docs)
                .status("SUCCESS")
                .build();
    }

    private boolean isGreeting(String text) {
        return text.matches(".*\\b(chào|chao|hello|hi|xin chào|alo|bác ba ơi|bac ba oi|chào bạn|chao ban)\\b.*")
                || text.equals("chào")
                || text.equals("hi")
                || text.equals("hello")
                || (text.contains("chào") && text.length() <= 20);
    }

    private boolean isGratitude(String text) {
        return text.contains("cảm ơn") || text.contains("cam on") || text.contains("thank") || text.contains("tks");
    }

    private boolean isGoodbye(String text) {
        return text.contains("tạm biệt") || text.contains("tam biet") || text.contains("bye") || text.contains("hẹn gặp lại");
    }
}
