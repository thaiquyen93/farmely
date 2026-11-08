package com.smartagrirent.payment.service.impl;

import com.smartagrirent.payment.dto.request.CardPaymentRequest;
import com.smartagrirent.payment.dto.request.CultivationPaymentRequest;
import com.smartagrirent.payment.exception.PaymentSandboxException;
import org.springframework.stereotype.Service;

import java.time.YearMonth;
import java.util.regex.Pattern;

@Service
public class PaymentSandboxServiceImpl implements com.smartagrirent.payment.service.PaymentSandboxService {

    private static final Pattern DIGITS_ONLY = Pattern.compile("^\\d+$");

    @Override
    public void validateCard(CardPaymentRequest request) {
        validateCardDetails(
                request.getCardNumber(),
                request.getCardHolder(),
                request.getExpiryDate(),
                request.getCvv()
        );
    }

    @Override
    public void validateCultivationCard(CultivationPaymentRequest request) {
        validateCardDetails(
                request.getCardNumber(),
                request.getCardHolder(),
                request.getExpiryDate(),
                request.getCvv()
        );
    }

    private void validateCardDetails(String rawCardNumber, String rawHolder, String rawExpiry, String rawCvv) {
        // 1. Kiểm tra thông tin chủ thẻ
        if (rawHolder == null || rawHolder.trim().length() < 3) {
            throw new PaymentSandboxException("INVALID_HOLDER", "Tên chủ thẻ không hợp lệ (tối thiểu 3 ký tự).");
        }

        // 2. Kiểm tra số thẻ
        if (rawCardNumber == null || rawCardNumber.isBlank()) {
            throw new PaymentSandboxException("EMPTY_CARD", "Vui lòng nhập số thẻ thanh toán.");
        }

        String cleanCard = rawCardNumber.replaceAll("\\s+", "");
        if (!DIGITS_ONLY.matcher(cleanCard).matches() || cleanCard.length() < 12 || cleanCard.length() > 19) {
            throw new PaymentSandboxException("INVALID_CARD_NUMBER", "Số thẻ không đúng định dạng ngân hàng (12-19 chữ số).");
        }

        // 3. Kịch bản mô phỏng lỗi trong môi trường Sandbox
        if (cleanCard.endsWith("0002")) {
            throw new PaymentSandboxException("INSUFFICIENT_FUNDS",
                    "Giao dịch bị từ chối: Số dư tài khoản không đủ để thanh toán (Mã lỗi Sandbox: INSUFFICIENT_FUNDS).");
        }

        if (cleanCard.endsWith("0003")) {
            throw new PaymentSandboxException("CARD_LOCKED",
                    "Giao dịch bị từ chối: Thẻ đã bị tạm khóa bởi ngân hàng phát hành (Mã lỗi Sandbox: CARD_LOCKED).");
        }

        if (cleanCard.endsWith("0004")) {
            throw new PaymentSandboxException("BANK_DECLINED",
                    "Giao dịch bị từ chối: Ngân hàng phát hành từ chối xử lý giao dịch này (Mã lỗi Sandbox: BANK_DECLINED).");
        }

        // 4. Kiểm tra thuật toán Luhn
        if (!isWhitelistedDemoCard(cleanCard) && !isValidLuhn(cleanCard)) {
            throw new PaymentSandboxException("LUHN_CHECKSUM_FAILED",
                    "Số thẻ không hợp lệ theo tiêu chuẩn quốc tế / Napas (Sai mã kiểm tra Luhn).");
        }

        // 5. Kiểm tra ngày hết hạn
        if (rawExpiry == null || rawExpiry.isBlank()) {
            throw new PaymentSandboxException("EMPTY_EXPIRY", "Vui lòng nhập ngày hết hạn (MM/YY).");
        }

        validateExpiryDate(rawExpiry.trim());

        // 6. Kiểm tra mã bảo mật CVV
        if (rawCvv == null || rawCvv.isBlank()) {
            throw new PaymentSandboxException("EMPTY_CVV", "Vui lòng nhập mã bảo mật CVV/CVC.");
        }

        String cleanCvv = rawCvv.trim();
        if (!DIGITS_ONLY.matcher(cleanCvv).matches() || cleanCvv.length() < 3 || cleanCvv.length() > 4) {
            throw new PaymentSandboxException("INVALID_CVV", "Mã bảo mật CVV phải gồm 3 hoặc 4 chữ số.");
        }

        if ("000".equals(cleanCvv)) {
            throw new PaymentSandboxException("INVALID_CVV", "Mã CVV bảo mật không chính xác (Mã lỗi: 000).");
        }
    }

    private void validateExpiryDate(String expiry) {
        String[] parts = expiry.split("/");
        if (parts.length != 2) {
            throw new PaymentSandboxException("INVALID_EXPIRY_FORMAT", "Định dạng ngày hết hạn phải là MM/YY (ví dụ: 12/28).");
        }

        int month;
        int year;
        try {
            month = Integer.parseInt(parts[0].trim());
            year = Integer.parseInt(parts[1].trim());
        } catch (NumberFormatException e) {
            throw new PaymentSandboxException("INVALID_EXPIRY_FORMAT", "Tháng hoặc năm hết hạn không hợp lệ.");
        }

        if (month < 1 || month > 12) {
            throw new PaymentSandboxException("INVALID_EXPIRY_MONTH", "Tháng hết hạn phải từ 01 đến 12.");
        }

        if (year < 100) {
            year += 2000;
        }

        YearMonth cardExpiry = YearMonth.of(year, month);
        YearMonth currentYearMonth = YearMonth.now();

        if (cardExpiry.isBefore(currentYearMonth)) {
            throw new PaymentSandboxException("EXPIRED_CARD",
                    String.format("Thẻ thanh toán đã hết hạn sử dụng (%02d/%d). Vui lòng dùng thẻ còn hạn.", month, year));
        }
    }

    private boolean isWhitelistedDemoCard(String card) {
        return card.startsWith("424242")
                || card.startsWith("541275")
                || card.startsWith("970436")
                || card.startsWith("970419")
                || card.startsWith("400000");
    }

    private boolean isValidLuhn(String cardNumber) {
        int sum = 0;
        boolean alternate = false;
        for (int i = cardNumber.length() - 1; i >= 0; i--) {
            int n = Integer.parseInt(cardNumber.substring(i, i + 1));
            if (alternate) {
                n *= 2;
                if (n > 9) {
                    n = (n % 10) + 1;
                }
            }
            sum += n;
            alternate = !alternate;
        }
        return (sum % 10 == 0);
    }
}
