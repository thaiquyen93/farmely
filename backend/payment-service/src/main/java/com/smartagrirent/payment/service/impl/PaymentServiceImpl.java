package com.smartagrirent.payment.service.impl;

import com.smartagrirent.payment.config.VNPayConfig;
import com.smartagrirent.payment.constant.PaymentStatus;
import com.smartagrirent.payment.constant.RequestStatus;
import com.smartagrirent.payment.constant.TransactionType;
import com.smartagrirent.payment.dto.request.CardPaymentRequest;
import com.smartagrirent.payment.dto.request.CultivationPaymentRequest;
import com.smartagrirent.payment.dto.request.VietQrGenerateRequest;
import com.smartagrirent.payment.dto.request.VnPayCreateRequest;
import com.smartagrirent.payment.dto.response.PaymentResponse;
import com.smartagrirent.payment.dto.response.ServiceRequestResponse;
import com.smartagrirent.payment.dto.response.VietQrResponse;
import com.smartagrirent.payment.dto.response.VnPayResponse;
import com.smartagrirent.payment.entity.CultivationService;
import com.smartagrirent.payment.entity.PaymentTransaction;
import com.smartagrirent.payment.entity.ServiceRequest;
import com.smartagrirent.payment.repository.CultivationServiceRepository;
import com.smartagrirent.payment.repository.PaymentTransactionRepository;
import com.smartagrirent.payment.repository.ServiceRequestRepository;
import com.smartagrirent.payment.exception.PaymentSandboxException;
import com.smartagrirent.payment.service.PaymentSandboxService;
import com.smartagrirent.payment.service.PaymentService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class PaymentServiceImpl implements PaymentService {

    private final PaymentTransactionRepository paymentTransactionRepository;
    private final ServiceRequestRepository serviceRequestRepository;
    private final CultivationServiceRepository cultivationServiceRepository;
    private final PaymentSandboxService paymentSandboxService;
    private final VNPayConfig vnPayConfig;

    private static final String DEFAULT_BANK_ID = "ICB"; // VietinBank
    private static final String DEFAULT_BANK_NAME = "VietinBank (Ngân hàng TMCP Công Thương Việt Nam)";
    private static final String DEFAULT_ACCOUNT_NO = "108876543210";
    private static final String DEFAULT_ACCOUNT_NAME = "FARMELY AGRIRENT CORP";

    public PaymentServiceImpl(PaymentTransactionRepository paymentTransactionRepository,
                              ServiceRequestRepository serviceRequestRepository,
                              CultivationServiceRepository cultivationServiceRepository,
                              PaymentSandboxService paymentSandboxService,
                              VNPayConfig vnPayConfig) {
        this.paymentTransactionRepository = paymentTransactionRepository;
        this.serviceRequestRepository = serviceRequestRepository;
        this.cultivationServiceRepository = cultivationServiceRepository;
        this.paymentSandboxService = paymentSandboxService;
        this.vnPayConfig = vnPayConfig;
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
    public PaymentResponse cancelPayment(Integer transactionId) {
        PaymentTransaction transaction = paymentTransactionRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Giao dịch không tồn tại với ID: " + transactionId));

        if (transaction.getStatus() == PaymentStatus.PENDING) {
            transaction.setStatus(PaymentStatus.FAILED);
            String ref = transaction.getGatewayRef() != null ? transaction.getGatewayRef() : "TXN";
            if (!ref.contains("_CANCELLED")) {
                transaction.setGatewayRef(ref + "_CANCELLED");
            }
            PaymentTransaction updated = paymentTransactionRepository.save(transaction);
            return mapToResponse(updated);
        }

        return mapToResponse(transaction);
    }

    @Override
    @Transactional(noRollbackFor = PaymentSandboxException.class)
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
        if (serviceRequestId == null && (request.getServiceName() != null || request.getServiceId() != null)) {
            Integer resolvedSvcId = mapServiceCodeToId(request.getServiceId(), request.getServiceName());
            ServiceRequest svcReq = ServiceRequest.builder()
                    .rentalId(request.getRentalId() != null && request.getRentalId() > 0 ? request.getRentalId() : 1)
                    .serviceId(resolvedSvcId)
                    .scheduledDate(request.getScheduledDate() != null ? request.getScheduledDate() : LocalDate.now().plusDays(1))
                    .status(RequestStatus.PENDING)
                    .build();
            ServiceRequest savedSvcReq = serviceRequestRepository.save(svcReq);
            serviceRequestId = savedSvcReq.getRequestId();
        }

        String cleanCard = request.getCardNumber() != null ? request.getCardNumber().replaceAll("\\s+", "") : "";
        String last4 = cleanCard.length() >= 4 ? cleanCard.substring(cleanCard.length() - 4) : "4242";
        long timestamp = System.currentTimeMillis();

        // Bước 1: Lưu giao dịch vào Database trước ở trạng thái PENDING
        PaymentTransaction transaction = PaymentTransaction.builder()
                .contractId(request.getContractId())
                .serviceRequestId(serviceRequestId)
                .type(TransactionType.PAYMENT)
                .amount(amount)
                .paymentMethod(method)
                .gatewayRef("SANDBOX_PENDING_" + (timestamp % 10000000) + "_L4_" + last4)
                .status(PaymentStatus.PENDING)
                .build();

        PaymentTransaction savedTx = paymentTransactionRepository.save(transaction);

        // Bước 2: Kiểm tra thông tin thẻ qua Sandbox
        try {
            paymentSandboxService.validateCard(request);

            // Bước 3a: Thẻ hợp lệ -> Cập nhật sang SUCCESS
            savedTx.setStatus(PaymentStatus.SUCCESS);
            savedTx.setGatewayRef("SANDBOX_" + method + "_TXN_" + (timestamp % 10000000) + "_L4_" + last4);
            PaymentTransaction updated = paymentTransactionRepository.save(savedTx);

            if (updated.getServiceRequestId() != null) {
                serviceRequestRepository.findById(updated.getServiceRequestId()).ifPresent(req -> {
                    req.setStatus(RequestStatus.ASSIGNED);
                    serviceRequestRepository.save(req);
                });
            }

            return mapToResponse(updated);
        } catch (PaymentSandboxException ex) {
            // Bước 3b: Thẻ lỗi/từ chối -> Cập nhật FAILED vào Database để lưu vết đối soát
            savedTx.setStatus(PaymentStatus.FAILED);
            savedTx.setGatewayRef("SANDBOX_REJECTED_" + ex.getErrorCode());
            paymentTransactionRepository.save(savedTx);
            throw ex;
        }
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
    @Transactional(noRollbackFor = PaymentSandboxException.class)
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

        // Bước 1: Lưu giao dịch vào Database ở trạng thái PENDING trước
        PaymentTransaction transaction = PaymentTransaction.builder()
                .serviceRequestId(savedRequest.getRequestId())
                .type(TransactionType.PAYMENT)
                .amount(amount)
                .paymentMethod(method)
                .gatewayRef("SANDBOX_PENDING_" + (timestamp % 10000000) + "_L4_" + last4)
                .status(PaymentStatus.PENDING)
                .build();

        PaymentTransaction savedTx = paymentTransactionRepository.save(transaction);

        // Bước 2: Kiểm tra thẻ qua Sandbox
        try {
            paymentSandboxService.validateCultivationCard(request);

            // Bước 3a: Thẻ hợp lệ -> Cập nhật SUCCESS
            savedTx.setStatus(PaymentStatus.SUCCESS);
            savedTx.setGatewayRef("SANDBOX_" + method + "_SVC_" + (timestamp % 10000000) + "_L4_" + last4);
            PaymentTransaction updated = paymentTransactionRepository.save(savedTx);

            savedRequest.setStatus(RequestStatus.ASSIGNED);
            serviceRequestRepository.save(savedRequest);

            return mapToResponse(updated);
        } catch (PaymentSandboxException ex) {
            // Bước 3b: Thẻ lỗi/từ chối -> Cập nhật FAILED vào Database để lưu vết đối soát
            savedTx.setStatus(PaymentStatus.FAILED);
            savedTx.setGatewayRef("SANDBOX_REJECTED_" + ex.getErrorCode());
            paymentTransactionRepository.save(savedTx);
            throw ex;
        }
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

    @Override
    @Transactional
    public PaymentResponse simulateSandboxPayment(Integer transactionId) {
        PaymentTransaction transaction = paymentTransactionRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Giao dịch không tồn tại với ID: " + transactionId));

        transaction.setStatus(PaymentStatus.SUCCESS);
        transaction.setGatewayRef("SANDBOX_WEBHOOK_PAID_" + (System.currentTimeMillis() % 10000000));
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
    @Transactional(readOnly = true)
    public PaymentResponse getTransactionStatus(Integer transactionId) {
        return getTransactionById(transactionId);
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

    // =========================================================================
    // VNPAY SANDBOX INTEGRATION
    // =========================================================================

    @Override
    @Transactional
    public VnPayResponse createVnPayPayment(VnPayCreateRequest request, String ipAddress) {
        BigDecimal amount = (request.getAmount() != null && request.getAmount().compareTo(BigDecimal.ZERO) > 0)
                ? request.getAmount()
                : new BigDecimal("1800000.00");

        // 1. Tạo Transaction PENDING trong PostgreSQL
        PaymentTransaction transaction = new PaymentTransaction();
        transaction.setContractId(request.getContractId());
        transaction.setType(TransactionType.PAYMENT);
        transaction.setAmount(amount);
        transaction.setPaymentMethod("VNPAY");
        transaction.setStatus(PaymentStatus.PENDING);
        PaymentTransaction saved = paymentTransactionRepository.save(transaction);

        // 1.1 Link đơn dịch vụ canh tác nếu có
        if (request.getServiceName() != null || request.getPlotCode() != null) {
            ServiceRequest sRequest = ServiceRequest.builder()
                    .serviceId(request.getServiceId() != null ? request.getServiceId() : 1)
                    .rentalId(request.getRentalId() != null ? request.getRentalId() : 1)
                    .scheduledDate(request.getScheduledDate() != null ? LocalDate.parse(request.getScheduledDate()) : LocalDate.now().plusDays(1))
                    .status(RequestStatus.PENDING)
                    .build();
            ServiceRequest savedSReq = serviceRequestRepository.save(sRequest);
            saved.setServiceRequestId(savedSReq.getRequestId());
        }

        String txnRef = "FARMELY_" + saved.getTransactionId() + "_" + (System.currentTimeMillis() % 100000);
        saved.setGatewayRef(txnRef);
        paymentTransactionRepository.save(saved);

        // 2. Build tham số VNPay 2.1.0
        String vnpVersion = vnPayConfig.getVnpVersion();
        String vnpCommand = vnPayConfig.getVnpCommand();
        String vnpTmnCode = vnPayConfig.getVnpTmnCode();
        long vnpAmount = amount.multiply(new BigDecimal(100)).longValue();

        Map<String, String> vnpParams = new HashMap<>();
        vnpParams.put("vnp_Version", vnpVersion);
        vnpParams.put("vnp_Command", vnpCommand);
        vnpParams.put("vnp_TmnCode", vnpTmnCode);
        vnpParams.put("vnp_Amount", String.valueOf(vnpAmount));
        vnpParams.put("vnp_CurrCode", "VND");

        if (request.getBankCode() != null && !request.getBankCode().isBlank()) {
            vnpParams.put("vnp_BankCode", request.getBankCode());
        }

        vnpParams.put("vnp_TxnRef", txnRef);

        String orderInfo = request.getOrderInfo() != null && !request.getOrderInfo().isBlank()
                ? request.getOrderInfo()
                : ("Thanh toan Farmely GD " + saved.getTransactionId());
        vnpParams.put("vnp_OrderInfo", removeAccents(orderInfo));
        vnpParams.put("vnp_OrderType", "other");
        vnpParams.put("vnp_Locale", "vn");

        String returnUrl = (request.getReturnUrl() != null && !request.getReturnUrl().isBlank())
                ? request.getReturnUrl()
                : vnPayConfig.getVnpReturnUrl();
        vnpParams.put("vnp_ReturnUrl", returnUrl);

        String clientIp = (ipAddress != null && !ipAddress.isBlank() && !ipAddress.equals("0:0:0:0:0:0:0:1")) ? ipAddress : "127.0.0.1";
        vnpParams.put("vnp_IpAddr", clientIp);

        java.text.SimpleDateFormat formatter = new java.text.SimpleDateFormat("yyyyMMddHHmmss");
        formatter.setTimeZone(TimeZone.getTimeZone("Asia/Ho_Chi_Minh"));
        Calendar cld = Calendar.getInstance(TimeZone.getTimeZone("Asia/Ho_Chi_Minh"));
        String vnpCreateDate = formatter.format(cld.getTime());
        vnpParams.put("vnp_CreateDate", vnpCreateDate);

        cld.add(Calendar.MINUTE, 15);
        String vnpExpireDate = formatter.format(cld.getTime());
        vnpParams.put("vnp_ExpireDate", vnpExpireDate);

        // 3. Tạo chữ ký SHA-512 và payment URL
        String queryUrl = VNPayConfig.buildQueryUrl(vnpParams);
        String vnpSecureHash = VNPayConfig.hashAllFields(vnpParams, vnPayConfig.getVnpHashSecret());
        String paymentUrl = vnPayConfig.getVnpPayUrl() + "?" + queryUrl + "&vnp_SecureHash=" + vnpSecureHash;

        return new VnPayResponse(
                saved.getTransactionId(),
                txnRef,
                paymentUrl,
                amount,
                orderInfo,
                PaymentStatus.PENDING.name(),
                vnpTmnCode,
                returnUrl,
                saved.getCreatedAt()
        );
    }

    @Override
    @Transactional
    public PaymentResponse processVnPayReturn(Map<String, String> queryParams) {
        Map<String, String> fields = new HashMap<>();
        for (Map.Entry<String, String> entry : queryParams.entrySet()) {
            String key = entry.getKey();
            String value = entry.getValue();
            if (value != null && !value.isEmpty()) {
                fields.put(key, value);
            }
        }

        fields.remove("vnp_SecureHash");
        fields.remove("vnp_SecureHashType");

        String txnRef = queryParams.get("vnp_TxnRef");
        String responseCode = queryParams.get("vnp_ResponseCode");
        String vnpTransactionNo = queryParams.get("vnp_TransactionNo");

        PaymentTransaction transaction = null;
        if (txnRef != null) {
            transaction = paymentTransactionRepository.findAll().stream()
                    .filter(t -> txnRef.equals(t.getGatewayRef()))
                    .findFirst()
                    .orElse(null);

            if (transaction == null && txnRef.startsWith("FARMELY_")) {
                try {
                    String[] parts = txnRef.split("_");
                    if (parts.length >= 2) {
                        Integer txnId = Integer.parseInt(parts[1]);
                        transaction = paymentTransactionRepository.findById(txnId).orElse(null);
                    }
                } catch (Exception ignored) {
                }
            }
        }

        if (transaction == null) {
            throw new RuntimeException("Không tìm thấy giao dịch với mã tham chiếu: " + txnRef);
        }

        // ResponseCode "00" = Thanh toán thành công trên VNPay Sandbox
        if ("00".equals(responseCode)) {
            transaction.setStatus(PaymentStatus.SUCCESS);
            transaction.setGatewayRef(vnpTransactionNo != null ? ("VNPAY_" + vnpTransactionNo) : txnRef);
            PaymentTransaction saved = paymentTransactionRepository.save(transaction);

            if (saved.getServiceRequestId() != null) {
                serviceRequestRepository.findById(saved.getServiceRequestId()).ifPresent(req -> {
                    req.setStatus(RequestStatus.ASSIGNED);
                    serviceRequestRepository.save(req);
                });
            }
            return mapToResponse(saved);
        } else {
            transaction.setStatus(PaymentStatus.FAILED);
            if (vnpTransactionNo != null) {
                transaction.setGatewayRef("VNPAY_FAILED_" + vnpTransactionNo);
            }
            PaymentTransaction saved = paymentTransactionRepository.save(transaction);
            return mapToResponse(saved);
        }
    }

    private String removeAccents(String text) {
        if (text == null) return "";
        String nfdNormalizedString = java.text.Normalizer.normalize(text, java.text.Normalizer.Form.NFD);
        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("\\p{InCombiningDiacriticalMarks}+");
        return pattern.matcher(nfdNormalizedString).replaceAll("").replaceAll("đ", "d").replaceAll("Đ", "D");
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
