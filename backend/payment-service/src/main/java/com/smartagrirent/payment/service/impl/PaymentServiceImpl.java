package com.smartagrirent.payment.service.impl;

import com.smartagrirent.payment.constant.PaymentStatus;
import com.smartagrirent.payment.constant.RequestStatus;
import com.smartagrirent.payment.constant.TransactionType;
import com.smartagrirent.payment.dto.request.CardPaymentRequest;
import com.smartagrirent.payment.dto.request.CultivationPaymentRequest;
import com.smartagrirent.payment.dto.request.VietQrGenerateRequest;
import com.smartagrirent.payment.dto.response.PaymentResponse;
import com.smartagrirent.payment.dto.response.ServiceRequestResponse;
import com.smartagrirent.payment.dto.response.VietQrResponse;
import com.smartagrirent.payment.entity.CultivationService;
import com.smartagrirent.payment.entity.PaymentTransaction;
import com.smartagrirent.payment.entity.ServiceRequest;
import com.smartagrirent.payment.repository.CultivationServiceRepository;
import com.smartagrirent.payment.repository.PaymentTransactionRepository;
import com.smartagrirent.payment.repository.ServiceRequestRepository;
import com.smartagrirent.payment.service.PaymentService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class PaymentServiceImpl implements PaymentService {

    private final PaymentTransactionRepository paymentTransactionRepository;
    private final ServiceRequestRepository serviceRequestRepository;
    private final CultivationServiceRepository cultivationServiceRepository;

    private static final String DEFAULT_BANK_ID = "ICB"; // VietinBank
    private static final String DEFAULT_BANK_NAME = "VietinBank (Ngân hàng TMCP Công Thương Việt Nam)";
    private static final String DEFAULT_ACCOUNT_NO = "108876543210";
    private static final String DEFAULT_ACCOUNT_NAME = "FARMELY AGRIRENT CORP";

    public PaymentServiceImpl(PaymentTransactionRepository paymentTransactionRepository,
                              ServiceRequestRepository serviceRequestRepository,
                              CultivationServiceRepository cultivationServiceRepository) {
        this.paymentTransactionRepository = paymentTransactionRepository;
        this.serviceRequestRepository = serviceRequestRepository;
        this.cultivationServiceRepository = cultivationServiceRepository;
    }

    @Override
    @Transactional
    public VietQrResponse generateVietQr(VietQrGenerateRequest request) {
        String bankId = (request.getBankId() != null && !request.getBankId().isBlank())
                ? request.getBankId().trim()
                : DEFAULT_BANK_ID;

        String accountNo = (request.getAccountNo() != null && !request.getAccountNo().isBlank())
                ? request.getAccountNo().trim()
                : DEFAULT_ACCOUNT_NO;

        String accountName = (request.getAccountName() != null && !request.getAccountName().isBlank())
                ? request.getAccountName().trim()
                : DEFAULT_ACCOUNT_NAME;

        BigDecimal amount = (request.getAmount() != null && request.getAmount().compareTo(BigDecimal.ZERO) > 0)
                ? request.getAmount()
                : new BigDecimal("1800000.00");

        long timestamp = System.currentTimeMillis();
        String gatewayRef = "VQR_" + (timestamp % 10000000);

        String description = (request.getDescription() != null && !request.getDescription().isBlank())
                ? request.getDescription().trim()
                : ("FARMELY " + (request.getPlotCode() != null ? request.getPlotCode() : "DAT") + " " + (timestamp % 100000));

        PaymentTransaction transaction = PaymentTransaction.builder()
                .contractId(request.getContractId())
                .serviceRequestId(request.getServiceRequestId())
                .type(TransactionType.PAYMENT)
                .amount(amount)
                .paymentMethod("VIETQR")
                .gatewayRef(gatewayRef)
                .status(PaymentStatus.PENDING)
                .build();

        PaymentTransaction saved = paymentTransactionRepository.save(transaction);
        return buildVietQrResponse(saved, bankId, accountNo, accountName, description, gatewayRef);
    }

    @Override
    @Transactional
    public PaymentResponse confirmPayment(Integer transactionId) {
        PaymentTransaction transaction = paymentTransactionRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Giao dịch không tồn tại với ID: " + transactionId));

        transaction.setStatus(PaymentStatus.SUCCESS);
        PaymentTransaction updated = paymentTransactionRepository.save(transaction);

        if (updated.getServiceRequestId() != null) {
            serviceRequestRepository.findById(updated.getServiceRequestId()).ifPresent(req -> {
                req.setStatus(RequestStatus.ASSIGNED);
                serviceRequestRepository.save(req);
            });
        }

        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public PaymentResponse processCardPayment(CardPaymentRequest request) {
        BigDecimal amount = (request.getAmount() != null && request.getAmount().compareTo(BigDecimal.ZERO) > 0)
                ? request.getAmount()
                : new BigDecimal("1800000.00");

        String method = (request.getCardType() != null && !request.getCardType().isBlank())
                ? request.getCardType().trim().toUpperCase()
                : (request.getPaymentMethod() != null ? request.getPaymentMethod().trim().toUpperCase() : "VISA");

        if (method.contains("NAPAS") || method.contains("ATM")) {
            method = "NAPAS_ATM";
        }

        Integer serviceRequestId = request.getServiceRequestId();
        // If this request is for a cultivation service:
        if (serviceRequestId == null && (request.getServiceName() != null || request.getServiceId() != null)) {
            Integer resolvedSvcId = mapServiceCodeToId(request.getServiceId(), request.getServiceName());
            ServiceRequest svcReq = ServiceRequest.builder()
                    .rentalId(request.getRentalId() != null && request.getRentalId() > 0 ? request.getRentalId() : 1)
                    .serviceId(resolvedSvcId)
                    .scheduledDate(request.getScheduledDate() != null ? request.getScheduledDate() : LocalDate.now().plusDays(1))
                    .status(RequestStatus.ASSIGNED)
                    .build();
            ServiceRequest savedSvcReq = serviceRequestRepository.save(svcReq);
            serviceRequestId = savedSvcReq.getRequestId();
        }

        String cleanCard = request.getCardNumber() != null ? request.getCardNumber().replaceAll("\\s+", "") : "";
        String last4 = cleanCard.length() >= 4 ? cleanCard.substring(cleanCard.length() - 4) : "4242";
        long timestamp = System.currentTimeMillis();
        String gatewayRef = method + "_TXN_" + (timestamp % 10000000) + "_L4_" + last4;

        PaymentTransaction transaction = PaymentTransaction.builder()
                .contractId(request.getContractId())
                .serviceRequestId(serviceRequestId)
                .type(TransactionType.PAYMENT)
                .amount(amount)
                .paymentMethod(method)
                .gatewayRef(gatewayRef)
                .status(PaymentStatus.SUCCESS)
                .build();

        PaymentTransaction saved = paymentTransactionRepository.save(transaction);
        return mapToResponse(saved);
    }

    // =========================================================================
    // CULTIVATION SERVICE PAYMENT WITH RELATIONSHIP PERSISTENCE
    // =========================================================================

    @Override
    @Transactional
    public VietQrResponse generateServiceVietQr(CultivationPaymentRequest request) {
        Integer resolvedServiceId = resolveServiceId(request);
        Integer resolvedRentalId = (request.getRentalId() != null && request.getRentalId() > 0)
                ? request.getRentalId()
                : 1;

        LocalDate schedDate = request.getScheduledDate() != null
                ? request.getScheduledDate()
                : LocalDate.now().plusDays(1);

        ServiceRequest serviceRequest = ServiceRequest.builder()
                .rentalId(resolvedRentalId)
                .serviceId(resolvedServiceId)
                .scheduledDate(schedDate)
                .status(RequestStatus.PENDING)
                .build();

        ServiceRequest savedRequest = serviceRequestRepository.save(serviceRequest);

        BigDecimal amount = resolveAmount(request, resolvedServiceId);
        long timestamp = System.currentTimeMillis();
        String gatewayRef = "VQR_SVC_" + (timestamp % 10000000);
        String description = "FARMELY DV" + savedRequest.getRequestId() + " " + (request.getPlotCode() != null ? request.getPlotCode() : "PLOT");

        PaymentTransaction transaction = PaymentTransaction.builder()
                .serviceRequestId(savedRequest.getRequestId())
                .type(TransactionType.PAYMENT)
                .amount(amount)
                .paymentMethod("VIETQR")
                .gatewayRef(gatewayRef)
                .status(PaymentStatus.PENDING)
                .build();

        PaymentTransaction savedTx = paymentTransactionRepository.save(transaction);
        return buildVietQrResponse(savedTx, DEFAULT_BANK_ID, DEFAULT_ACCOUNT_NO, DEFAULT_ACCOUNT_NAME, description, gatewayRef);
    }

    @Override
    @Transactional
    public PaymentResponse processServiceCard(CultivationPaymentRequest request) {
        Integer resolvedServiceId = resolveServiceId(request);
        Integer resolvedRentalId = (request.getRentalId() != null && request.getRentalId() > 0)
                ? request.getRentalId()
                : 1;

        LocalDate schedDate = request.getScheduledDate() != null
                ? request.getScheduledDate()
                : LocalDate.now().plusDays(1);

        ServiceRequest serviceRequest = ServiceRequest.builder()
                .rentalId(resolvedRentalId)
                .serviceId(resolvedServiceId)
                .scheduledDate(schedDate)
                .status(RequestStatus.ASSIGNED)
                .build();

        ServiceRequest savedRequest = serviceRequestRepository.save(serviceRequest);

        BigDecimal amount = resolveAmount(request, resolvedServiceId);
        String method = (request.getCardType() != null && !request.getCardType().isBlank())
                ? request.getCardType().trim().toUpperCase()
                : (request.getPaymentMethod() != null && !request.getPaymentMethod().isBlank()
                        ? request.getPaymentMethod().trim().toUpperCase()
                        : "VISA");

        if (method.contains("NAPAS") || method.contains("ATM")) {
            method = "NAPAS_ATM";
        }

        String cleanCard = request.getCardNumber() != null ? request.getCardNumber().replaceAll("\\s+", "") : "";
        String last4 = cleanCard.length() >= 4 ? cleanCard.substring(cleanCard.length() - 4) : "8899";
        long timestamp = System.currentTimeMillis();
        String gatewayRef = method + "_SVC_" + (timestamp % 10000000) + "_L4_" + last4;

        PaymentTransaction transaction = PaymentTransaction.builder()
                .serviceRequestId(savedRequest.getRequestId())
                .type(TransactionType.PAYMENT)
                .amount(amount)
                .paymentMethod(method)
                .gatewayRef(gatewayRef)
                .status(PaymentStatus.SUCCESS)
                .build();

        PaymentTransaction savedTx = paymentTransactionRepository.save(transaction);
        return mapToResponse(savedTx);
    }

    @Override
    @Transactional
    public PaymentResponse processServiceWallet(CultivationPaymentRequest request) {
        Integer resolvedServiceId = resolveServiceId(request);
        Integer resolvedRentalId = (request.getRentalId() != null && request.getRentalId() > 0)
                ? request.getRentalId()
                : 1;

        LocalDate schedDate = request.getScheduledDate() != null
                ? request.getScheduledDate()
                : LocalDate.now().plusDays(1);

        ServiceRequest serviceRequest = ServiceRequest.builder()
                .rentalId(resolvedRentalId)
                .serviceId(resolvedServiceId)
                .scheduledDate(schedDate)
                .status(RequestStatus.ASSIGNED)
                .build();

        ServiceRequest savedRequest = serviceRequestRepository.save(serviceRequest);

        BigDecimal amount = resolveAmount(request, resolvedServiceId);
        long timestamp = System.currentTimeMillis();
        String gatewayRef = "WALLET_SVC_" + (timestamp % 10000000);

        PaymentTransaction transaction = PaymentTransaction.builder()
                .serviceRequestId(savedRequest.getRequestId())
                .type(TransactionType.PAYMENT)
                .amount(amount)
                .paymentMethod("WALLET")
                .gatewayRef(gatewayRef)
                .status(PaymentStatus.SUCCESS)
                .build();

        PaymentTransaction savedTx = paymentTransactionRepository.save(transaction);
        return mapToResponse(savedTx);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ServiceRequestResponse> getAllServiceRequests() {
        return serviceRequestRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(req -> {
                    PaymentTransaction latestTx = (req.getTransactions() != null && !req.getTransactions().isEmpty())
                            ? req.getTransactions().get(req.getTransactions().size() - 1)
                            : null;

                    CultivationService svc = req.getService();

                    return ServiceRequestResponse.builder()
                            .requestId(req.getRequestId())
                            .rentalId(req.getRentalId())
                            .serviceId(req.getServiceId())
                            .serviceName(svc != null ? svc.getServiceName() : "Dịch vụ canh tác #" + req.getServiceId())
                            .serviceType(svc != null ? svc.getServiceType() : "A_LA_CARTE")
                            .unit(svc != null ? svc.getUnit() : "/ lần")
                            .price(svc != null ? svc.getPrice() : (latestTx != null ? latestTx.getAmount() : BigDecimal.ZERO))
                            .scheduledDate(req.getScheduledDate())
                            .status(req.getStatus() != null ? req.getStatus().name() : "PENDING")
                            .createdAt(req.getCreatedAt())
                            .transactionId(latestTx != null ? latestTx.getTransactionId() : null)
                            .paymentMethod(latestTx != null ? latestTx.getPaymentMethod() : null)
                            .paymentStatus(latestTx != null && latestTx.getStatus() != null ? latestTx.getStatus().name() : null)
                            .gatewayRef(latestTx != null ? latestTx.getGatewayRef() : null)
                            .build();
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentResponse getTransactionById(Integer transactionId) {
        PaymentTransaction transaction = paymentTransactionRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Giao dịch không tồn tại với ID: " + transactionId));
        return mapToResponse(transaction);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PaymentResponse> getAllTransactions() {
        return paymentTransactionRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // =========================================================================
    // HELPER METHODS
    // =========================================================================

    private Integer resolveServiceId(CultivationPaymentRequest request) {
        Integer numId = request.getNumericServiceId();
        if (numId != null && numId > 0) {
            return numId;
        }

        String code = request.getServiceId() != null ? request.getServiceId() : request.getServiceCode();
        return mapServiceCodeToId(code, request.getServiceName());
    }

    private Integer mapServiceCodeToId(String code, String serviceName) {
        if (code != null) {
            switch (code.toUpperCase().trim()) {
                case "SVC-FULL-CYCLE": return 1;
                case "SVC-WEEKLY-CARE": return 2;
                case "SVC-DAILY-CARE": return 2;
                case "SVC-FERTILIZING": return 5;
                case "SVC-WEEDING": return 3;
                case "SVC-PEST-CONTROL": return 3;
                case "SVC-HARVEST-PACK": return 4;
            }
        }

        if (serviceName != null && !serviceName.isBlank()) {
            Optional<CultivationService> matched = cultivationServiceRepository
                    .findFirstByServiceNameContainingIgnoreCase(serviceName.trim());
            if (matched.isPresent()) {
                return matched.get().getServiceId();
            }
        }

        return 2;
    }

    private BigDecimal resolveAmount(CultivationPaymentRequest request, Integer serviceId) {
        if (request.getAmount() != null && request.getAmount().compareTo(BigDecimal.ZERO) > 0) {
            return request.getAmount();
        }
        Optional<CultivationService> svc = cultivationServiceRepository.findById(serviceId);
        return svc.map(CultivationService::getPrice).orElse(new BigDecimal("150000.00"));
    }

    private VietQrResponse buildVietQrResponse(PaymentTransaction saved, String bankId, String accountNo,
                                               String accountName, String description, String gatewayRef) {
        String encodedDesc = URLEncoder.encode(description, StandardCharsets.UTF_8);
        String encodedName = URLEncoder.encode(accountName, StandardCharsets.UTF_8);
        long amountLong = saved.getAmount().longValue();

        String qrImageUrl = String.format(
                "https://img.vietqr.io/image/%s-%s-compact2.png?amount=%d&addInfo=%s&accountName=%s",
                bankId, accountNo, amountLong, encodedDesc, encodedName
        );

        String qrQuickLink = String.format(
                "https://vietqr.me/%s/%s/%d/%s",
                bankId, accountNo, amountLong, encodedDesc
        );

        return VietQrResponse.builder()
                .transactionId(saved.getTransactionId())
                .qrImageUrl(qrImageUrl)
                .qrQuickLink(qrQuickLink)
                .amount(saved.getAmount())
                .bankId(bankId)
                .bankName(DEFAULT_BANK_NAME)
                .accountNo(accountNo)
                .accountName(accountName)
                .description(description)
                .gatewayRef(gatewayRef)
                .status(saved.getStatus().name())
                .createdAt(saved.getCreatedAt())
                .build();
    }

    private PaymentResponse mapToResponse(PaymentTransaction tx) {
        return PaymentResponse.builder()
                .transactionId(tx.getTransactionId())
                .contractId(tx.getContractId())
                .serviceRequestId(tx.getServiceRequestId())
                .cancellationRequestId(tx.getCancellationRequestId())
                .type(tx.getType())
                .amount(tx.getAmount())
                .paymentMethod(tx.getPaymentMethod())
                .gatewayRef(tx.getGatewayRef())
                .status(tx.getStatus())
                .createdAt(tx.getCreatedAt())
                .build();
    }
}
