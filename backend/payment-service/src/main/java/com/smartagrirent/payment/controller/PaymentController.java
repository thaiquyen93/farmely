package com.smartagrirent.payment.controller;

import com.smartagrirent.payment.dto.request.CardPaymentRequest;
import com.smartagrirent.payment.dto.request.CultivationPaymentRequest;
import com.smartagrirent.payment.dto.request.VietQrGenerateRequest;
import com.smartagrirent.payment.dto.response.ApiResponse;
import com.smartagrirent.payment.dto.response.PaymentResponse;
import com.smartagrirent.payment.dto.response.ServiceRequestResponse;
import com.smartagrirent.payment.dto.response.VietQrResponse;
import com.smartagrirent.payment.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/payments")
@Tag(name = "Payment & VietQR API", description = "Endpoints for VietQR code generation, card payment, and cultivation service ledger")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    // =========================================================================
    // PLOT RENTAL / GENERAL PAYMENT
    // =========================================================================

    @PostMapping("/vietqr/generate")
    @Operation(summary = "Generate VietQR payment code and record PENDING transaction in PostgreSQL")
    public ApiResponse<VietQrResponse> generateVietQr(@RequestBody VietQrGenerateRequest request) {
        VietQrResponse response = paymentService.generateVietQr(request);
        return ApiResponse.ok("Khởi tạo mã VietQR thanh toán thành công", response);
    }

    @PostMapping("/card/charge")
    @Operation(summary = "Process card payment (Visa, Mastercard, Napas ATM) and save SUCCESS transaction to PostgreSQL")
    public ApiResponse<PaymentResponse> processCardPayment(@RequestBody CardPaymentRequest request) {
        PaymentResponse response = paymentService.processCardPayment(request);
        return ApiResponse.ok("Thanh toán qua thẻ thành công", response);
    }

    @PostMapping("/{transactionId}/confirm")
    @Operation(summary = "Confirm payment completion and mark transaction as SUCCESS in PostgreSQL")
    public ApiResponse<PaymentResponse> confirmPayment(@PathVariable("transactionId") Integer transactionId) {
        PaymentResponse response = paymentService.confirmPayment(transactionId);
        return ApiResponse.ok("Xác nhận thanh toán thành công", response);
    }

    @GetMapping("/{transactionId}")
    @Operation(summary = "Get payment transaction details by ID")
    public ApiResponse<PaymentResponse> getTransactionById(@PathVariable("transactionId") Integer transactionId) {
        PaymentResponse response = paymentService.getTransactionById(transactionId);
        return ApiResponse.ok(response);
    }

    @GetMapping
    @Operation(summary = "Get all payment transactions in PostgreSQL ledger")
    public ApiResponse<List<PaymentResponse>> getAllTransactions() {
        List<PaymentResponse> list = paymentService.getAllTransactions();
        return ApiResponse.ok(list);
    }

    // =========================================================================
    // CULTIVATION SERVICE PAYMENT WITH RELATIONSHIP PERSISTENCE
    // =========================================================================

    @PostMapping("/service/vietqr/generate")
    @Operation(summary = "Generate VietQR for cultivation service; creates service_requests and linked payment_transactions (PENDING)")
    public ApiResponse<VietQrResponse> generateServiceVietQr(@RequestBody CultivationPaymentRequest request) {
        VietQrResponse response = paymentService.generateServiceVietQr(request);
        return ApiResponse.ok("Khởi tạo mã VietQR cho dịch vụ canh tác thành công", response);
    }

    @PostMapping("/service/card/charge")
    @Operation(summary = "Process card payment for cultivation service; creates service_requests (ASSIGNED) and linked payment_transactions (SUCCESS)")
    public ApiResponse<PaymentResponse> processServiceCard(@RequestBody CultivationPaymentRequest request) {
        PaymentResponse response = paymentService.processServiceCard(request);
        return ApiResponse.ok("Thanh toán dịch vụ canh tác qua thẻ thành công", response);
    }

    @PostMapping("/service/wallet/charge")
    @Operation(summary = "Process wallet payment for cultivation service; creates service_requests (ASSIGNED) and linked payment_transactions (SUCCESS)")
    public ApiResponse<PaymentResponse> processServiceWallet(@RequestBody CultivationPaymentRequest request) {
        PaymentResponse response = paymentService.processServiceWallet(request);
        return ApiResponse.ok("Thanh toán dịch vụ canh tác qua ví Farmely thành công", response);
    }

    @GetMapping("/service/requests")
    @Operation(summary = "Get all cultivation service requests with linked payment transactions")
    public ApiResponse<List<ServiceRequestResponse>> getAllServiceRequests() {
        List<ServiceRequestResponse> list = paymentService.getAllServiceRequests();
        return ApiResponse.ok(list);
    }
}
