package com.smartagrirent.payment.dto.response;

import com.smartagrirent.payment.constant.PaymentStatus;
import com.smartagrirent.payment.constant.TransactionType;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public class PaymentResponse {
    private Integer transactionId;
    private Integer contractId;
    private Integer serviceRequestId;
    private Integer cancellationRequestId;
    private TransactionType type;
    private BigDecimal amount;
    private String paymentMethod;
    private String gatewayRef;
    private PaymentStatus status;
    private OffsetDateTime createdAt;

    public PaymentResponse() {
    }

    public PaymentResponse(Integer transactionId, Integer contractId, Integer serviceRequestId,
                           Integer cancellationRequestId, TransactionType type, BigDecimal amount,
                           String paymentMethod, String gatewayRef, PaymentStatus status,
                           OffsetDateTime createdAt) {
        this.transactionId = transactionId;
        this.contractId = contractId;
        this.serviceRequestId = serviceRequestId;
        this.cancellationRequestId = cancellationRequestId;
        this.type = type;
        this.amount = amount;
        this.paymentMethod = paymentMethod;
        this.gatewayRef = gatewayRef;
        this.status = status;
        this.createdAt = createdAt;
    }

    public static PaymentResponseBuilder builder() {
        return new PaymentResponseBuilder();
    }

    public static class PaymentResponseBuilder {
        private Integer transactionId;
        private Integer contractId;
        private Integer serviceRequestId;
        private Integer cancellationRequestId;
        private TransactionType type;
        private BigDecimal amount;
        private String paymentMethod;
        private String gatewayRef;
        private PaymentStatus status;
        private OffsetDateTime createdAt;

        public PaymentResponseBuilder transactionId(Integer transactionId) {
            this.transactionId = transactionId;
            return this;
        }

        public PaymentResponseBuilder contractId(Integer contractId) {
            this.contractId = contractId;
            return this;
        }

        public PaymentResponseBuilder serviceRequestId(Integer serviceRequestId) {
            this.serviceRequestId = serviceRequestId;
            return this;
        }

        public PaymentResponseBuilder cancellationRequestId(Integer cancellationRequestId) {
            this.cancellationRequestId = cancellationRequestId;
            return this;
        }

        public PaymentResponseBuilder type(TransactionType type) {
            this.type = type;
            return this;
        }

        public PaymentResponseBuilder amount(BigDecimal amount) {
            this.amount = amount;
            return this;
        }

        public PaymentResponseBuilder paymentMethod(String paymentMethod) {
            this.paymentMethod = paymentMethod;
            return this;
        }

        public PaymentResponseBuilder gatewayRef(String gatewayRef) {
            this.gatewayRef = gatewayRef;
            return this;
        }

        public PaymentResponseBuilder status(PaymentStatus status) {
            this.status = status;
            return this;
        }

        public PaymentResponseBuilder createdAt(OffsetDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public PaymentResponse build() {
            return new PaymentResponse(transactionId, contractId, serviceRequestId, cancellationRequestId,
                    type, amount, paymentMethod, gatewayRef, status, createdAt);
        }
    }

    public Integer getTransactionId() {
        return transactionId;
    }

    public void setTransactionId(Integer transactionId) {
        this.transactionId = transactionId;
    }

    public Integer getContractId() {
        return contractId;
    }

    public void setContractId(Integer contractId) {
        this.contractId = contractId;
    }

    public Integer getServiceRequestId() {
        return serviceRequestId;
    }

    public void setServiceRequestId(Integer serviceRequestId) {
        this.serviceRequestId = serviceRequestId;
    }

    public Integer getCancellationRequestId() {
        return cancellationRequestId;
    }

    public void setCancellationRequestId(Integer cancellationRequestId) {
        this.cancellationRequestId = cancellationRequestId;
    }

    public TransactionType getType() {
        return type;
    }

    public void setType(TransactionType type) {
        this.type = type;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public String getGatewayRef() {
        return gatewayRef;
    }

    public void setGatewayRef(String gatewayRef) {
        this.gatewayRef = gatewayRef;
    }

    public PaymentStatus getStatus() {
        return status;
    }

    public void setStatus(PaymentStatus status) {
        this.status = status;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
