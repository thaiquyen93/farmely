package com.smartagrirent.payment.service;

import com.smartagrirent.payment.dto.request.CardPaymentRequest;
import com.smartagrirent.payment.dto.request.CultivationPaymentRequest;

public interface PaymentSandboxService {
    /**
     * Xác thực và kiểm tra thẻ tín dụng / ghi nợ qua Sandbox rules:
     * - Kiểm tra số thẻ theo thuật toán Luhn
     * - Kiểm tra hạn sử dụng MM/YY
     * - Kiểm tra mã bảo mật CVV
     * - Mô phỏng các kịch bản test lỗi (hết tiền, thẻ bị khóa, ngân hàng từ chối)
     */
    void validateCard(CardPaymentRequest request);

    void validateCultivationCard(CultivationPaymentRequest request);
}
