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
                    .reply("Xin chào bạn! Tôi là Farmely AI — Trợ lý nông nghiệp thông minh của nền tảng Farmely. Bạn có thắc mắc nào về kỹ thuật canh tác, cảm biến vi khí hậu hay quản lý thửa đất không?")
                    .referencedDocuments(Collections.emptyList())
                    .status("SUCCESS")
                    .build();
        }

        String lower = userMsg.toLowerCase();
        String reply;
        List<ReferencedDocumentDto> docs = new ArrayList<>();

        // 0. Nhận diện phép tính toán học / đố vui
        if (lower.contains("1 + 1") || lower.contains("1 cộng 1") || lower.contains("1 cong 1")) {
            reply = "Dạ, 1 cộng 1 chắc chắn bằng 2 rồi ạ! 😊 "
                    + "Cũng như tại Farmely: sự tận tâm của bạn cộng với nông nghiệp thông minh chuẩn VietGAP sẽ luôn mang lại những vụ mùa bội thu!";
        }
        // 1. Nhận diện chào hỏi xã giao
        else if (isGreeting(lower)) {
            reply = "Xin chào bạn! Tôi là Farmely AI — Trợ lý nông nghiệp thông minh của nền tảng Farmely. "
                    + "Tôi có thể hỗ trợ bạn về kỹ thuật gieo trồng chuẩn VietGAP, theo dõi độ ẩm vi khí hậu IoT và thủ tục thuê thửa đất. Bạn cần tôi giải đáp nội dung nào?";
            docs.add(ReferencedDocumentDto.builder()
                    .chunkId("doc-intro-01")
                    .docTitle("Cẩm nang Hướng dẫn Khách hàng Farmely 2026")
                    .source("Farmely General Guide")
                    .similarityScore(0.95)
                    .build());
        }
        // 2. Nhận diện cảm ơn / tạm biệt
        else if (isGratitude(lower)) {
            reply = "Rất vui được hỗ trợ bạn! Chúc bạn có những vụ mùa bội thu, rau sạch chuẩn VietGAP và trải nghiệm canh tác tuyệt vời trên Farmely. Cần gì bạn cứ nhắn cho Farmely AI nhé!";
        } else if (isGoodbye(lower)) {
            reply = "Tạm biệt bạn nhé! Chúc bạn một ngày làm việc hiệu quả. Khi nào cần tra cứu số liệu thửa đất hay kỹ thuật chăm sóc, Farmely AI luôn sẵn sàng hỗ trợ!";
        }
        // 2b. Giải thích mô hình nền tảng Farmely (4 phần khách quan, súc tích)
        else if (lower.contains("farmely là gì") || lower.contains("farmely la gi") || lower.contains("hoạt động ra sao") || lower.contains("hoat dong ra sao") || lower.contains("hoạt động như thế nào") || lower.contains("mô hình") || lower.contains("mo hinh") || lower.contains("giới thiệu")) {
            reply = "1. **Farmely là gì?**\n"
                    + "Farmely là nền tảng nông nghiệp số cho phép người dùng thuê các thửa đất canh tác thực tế (Plot) tại nông trại và theo dõi quá trình trồng trọt trực tuyến (không phải trò chơi mô phỏng hay đất ảo).\n\n"
                    + "2. **Farmely hoạt động như thế nào?**\n"
                    + "Hệ thống phối hợp giữa 3 vai trò: Khách hàng (chọn thửa đất, giống cây, chế độ tự chăm sóc hoặc ủy thác và theo dõi tiến độ) — Chuyên gia nông nghiệp (thiết lập quy trình kỹ thuật và tư vấn khi cần) — Nhân viên hiện trường (thực hiện công việc tại vườn, ghi nhật ký ảnh và hỗ trợ cân đo thu hoạch).\n\n"
                    + "3. **Công nghệ hỗ trợ ra sao?**\n"
                    + "Nền tảng tích hợp dữ liệu cảm biến IoT, thông tin thời tiết địa phương, nhật ký canh tác điện tử theo từng công việc và trợ lý AI hỗ trợ tra cứu thông tin.\n\n"
                    + "4. **Người dùng nhận được gì?**\n"
                    + "Bạn có thể theo dõi và kiểm soát quá trình trồng rau từ xa qua dữ liệu và hình ảnh cập nhật mà không cần trực tiếp có mặt mỗi ngày, và nhận nông sản trực tiếp tại trang trại (PICKUP) khi thu hoạch.\n\n"
                    + "Bạn muốn tìm hiểu chi tiết hơn về quy trình thuê thửa đất, vai trò của các bên hay tính năng theo dõi nào trên hệ thống?";
            docs.add(ReferencedDocumentDto.builder()
                    .chunkId("doc-farmely-intro")
                    .docTitle("1. Farmely là gì? Giới thiệu tổng quan về nền tảng Farmely")
                    .source("Quy trình Thuê đất & Chính sách Farmely")
                    .similarityScore(0.96)
                    .build());
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
        // 6. Quy trình thuê đất, hủy & hợp đồng
        else if (lower.contains("hủy") || lower.contains("huy") || lower.contains("hoàn tiền")) {
            reply = "Chính sách hủy hợp đồng thuê đất tại Farmely (chỉ áp dụng khi hợp đồng chưa bắt đầu canh tác):\n\n"
                    + "• Hủy trước ngày bắt đầu >= 3 ngày: Hoàn 80% giá trị thanh toán.\n"
                    + "• Hủy trước ngày bắt đầu < 3 ngày: Hoàn 50% giá trị thanh toán.\n"
                    + "• Khi hợp đồng đã đến ngày bắt đầu hoặc đang canh tác: Không áp dụng hủy hoàn tiền.\n"
                    + "• Gia hạn hợp đồng: Cần thực hiện trước ngày hết hạn tối thiểu 3 ngày.";
            docs.add(ReferencedDocumentDto.builder()
                    .chunkId("doc-lease-cancel")
                    .docTitle("3. Chính sách Hủy, Gia hạn & Thu hoạch")
                    .source("Quy trình Thuê đất & Chính sách Farmely")
                    .similarityScore(0.95)
                    .build());
        } else if (lower.contains("thuê") || lower.contains("hợp đồng") || lower.contains("giá") || lower.contains("gia hạn") || lower.contains("chi phí")) {
            reply = "Quy trình thuê thửa đất tại Farmely minh bạch theo chuẩn vận hành:\n\n"
                    + "1. Chọn thửa đất trống trên Marketplace bản đồ, chọn giống rau, chế độ Tự trồng (Self-Growing) hoặc Ủy thác trọn gói (+50% phí chăm sóc).\n"
                    + "2. Chọn ngày bắt đầu (cách 5–14 ngày kể từ khi đặt) và kỳ hạn 1, 2, 3, 6 hoặc 12 tháng (tối thiểu >= thời gian sinh trưởng + 10 ngày buffer).\n"
                    + "3. Thanh toán trả trước 100% qua VNPay/VietQR trong thời gian giữ chỗ (15 phút, tối đa +10 phút tại cổng thanh toán).\n"
                    + "4. Gia hạn hợp đồng: Chủ động thực hiện trước ngày hết hạn 3 ngày (không có chiết khấu gia hạn mặc định).";
            docs.add(ReferencedDocumentDto.builder()
                    .chunkId("doc-lease-04")
                    .docTitle("Quy trình & Quy định Thuê đất Farmely")
                    .source("Quy trình Thuê đất & Chính sách Farmely")
                    .similarityScore(0.93)
                    .build());
        }
        // 7. Thu hoạch & Nghiệm thu (PICKUP tại nông trại)
        else if (lower.contains("thu hoạch") || lower.contains("sản lượng") || lower.contains("khiếu nại") || lower.contains("giao rau")) {
            reply = "Khi cây đạt ngày tuổi thu hoạch tại Farmely:\n\n"
                    + "• Nhân viên hiện trường (CVLĐ) sẽ thu hoạch, cân sản lượng thực tế bằng cân điện tử, dán tem QR truy xuất nguồn gốc và chụp ảnh đối chứng lên Nhật ký canh tác.\n"
                    + "• Bạn nghiệm thu kết quả ngay trên hệ thống và đến trực tiếp trang trại để nhận nông sản tươi sạch (PICKUP).";
            docs.add(ReferencedDocumentDto.builder()
                    .chunkId("doc-harvest-05")
                    .docTitle("4. Quy trình Thu hoạch & Nhận nông sản tại nông trại")
                    .source("Hướng dẫn Sử dụng Nền tảng Farmely")
                    .similarityScore(0.93)
                    .build());
        }
        // 8. Câu hỏi tổng quát
        else {
            if (userMsg.length() <= 8) {
                reply = "Farmely AI sẵn sàng hỗ trợ bạn! Bạn đang quan tâm đến kỹ thuật gieo trồng, kiểm tra độ ẩm đất vi khí hậu hay muốn tìm hiểu thủ tục thuê thửa đất trên Farmely? Cứ nhắn cụ thể câu hỏi cho tôi nhé! Nếu cần phác đồ chuyên sâu, bạn có thể bấm tab 'Kênh Chuyên Gia' để trao đổi trực tiếp với ThS. Hoàng Nam nha.";
            } else {
                reply = "Hệ thống Farmely AI đã ghi nhận câu hỏi từ bạn. Đối với canh tác nông nghiệp công nghệ cao tại Farmely, bạn nên thường xuyên theo dõi biểu đồ cảm biến IoT thời gian thực của thửa đất (độ ẩm đất, nhiệt độ, EC) để điều tiết nước tưới và phân bón hợp lý.\n\n"
                        + "Bạn cũng có thể bấm sang tab 'Kênh Chuyên Gia' ở ngay phía trên để trò chuyện trực tiếp và nhận tư vấn chi tiết từ ThS. Hoàng Nam nhé!";
            }
            docs.add(ReferencedDocumentDto.builder()
                    .chunkId("doc-general-00")
                    .docTitle("Cẩm nang Hướng dẫn Canh tác Toàn diện Farmely")
                    .source("Hệ sinh thái Nông nghiệp Thông minh")
                    .similarityScore(0.85)
                    .build());
        }

        log.info("Farmely AI Chatbot processed query: '{}' -> convId: {}", userMsg, convId);

        return ChatResponse.builder()
                .conversationId(convId)
                .reply(reply)
                .referencedDocuments(docs)
                .status("SUCCESS")
                .build();
    }

    private boolean isGreeting(String text) {
        return text.matches(".*\\b(chào|chao|hello|hi|xin chào|alo|chào bạn|chao ban|farmely ai|ai|bot)\\b.*")
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
