package com.smartagrirent.payment.service;

import com.smartagrirent.payment.dto.request.CardPaymentRequest;
import com.smartagrirent.payment.dto.request.CultivationPaymentRequest;
import com.smartagrirent.payment.dto.request.VietQrGenerateRequest;
import com.smartagrirent.payment.dto.response.PaymentResponse;
import com.smartagrirent.payment.dto.response.ServiceRequestResponse;
import com.smartagrirent.payment.dto.response.VietQrResponse;

import java.util.List;

public interface PaymentService {
    // General / Plot Rental Payment
    VietQrResponse generateVietQr(VietQrGenerateRequest request);
    PaymentResponse confirmPayment(Integer transactionId);
    PaymentResponse processCardPayment(CardPaymentRequest request);
    PaymentResponse getTransactionById(Integer transactionId);
    List<PaymentResponse> getAllTransactions();

    // Cultivation Service Payment (Linked to service_requests and payment_transactions)
    VietQrResponse generateServiceVietQr(CultivationPaymentRequest request);
    PaymentResponse processServiceCard(CultivationPaymentRequest request);
    PaymentResponse processServiceWallet(CultivationPaymentRequest request);
    List<ServiceRequestResponse> getAllServiceRequests();
}
