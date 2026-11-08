package com.smartagrirent.payment.entity;

import com.smartagrirent.payment.constant.PaymentStatus;
import com.smartagrirent.payment.constant.TransactionType;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "payment_transactions")
public class PaymentTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "transaction_id")
    private Integer transactionId;

    @Column(name = "contract_id")
    private Integer contractId;

    @Column(name = "service_request_id")
    private Integer serviceRequestId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "service_request_id", insertable = false, updatable = false)
    private ServiceRequest serviceRequest;

    @Column(name = "cancellation_request_id")
    private Integer cancellationRequestId;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    private TransactionType type = TransactionType.PAYMENT;

    @Column(name = "amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(name = "payment_method", length = 50)
    private String paymentMethod;

    @Column(name = "gateway_ref", length = 100)
    private String gatewayRef;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private PaymentStatus status = PaymentStatus.PENDING;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    public PaymentTransaction() {
    }

    public PaymentTransaction(Integer transactionId, Integer contractId, Integer serviceRequestId,
                              Integer cancellationRequestId, TransactionType type, BigDecimal amount,
                              String paymentMethod, String gatewayRef, PaymentStatus status,
                              OffsetDateTime createdAt) {
        this.transactionId = transactionId;
        this.contractId = contractId;
        this.serviceRequestId = serviceRequestId;
        this.cancellationRequestId = cancellationRequestId;
        this.type = type != null ? type : TransactionType.PAYMENT;
        this.amount = amount;
        this.paymentMethod = paymentMethod;
        this.gatewayRef = gatewayRef;
        this.status = status != null ? status : PaymentStatus.PENDING;
        this.createdAt = createdAt;
    }

    public static PaymentTransactionBuilder builder() {
        return new PaymentTransactionBuilder();
    }

    public static class PaymentTransactionBuilder {
        private Integer transactionId;
        private Integer contractId;
        private Integer serviceRequestId;
        private Integer cancellationRequestId;
        private TransactionType type = TransactionType.PAYMENT;
        private BigDecimal amount;
        private String paymentMethod;
        private String gatewayRef;
        private PaymentStatus status = PaymentStatus.PENDING;
        private OffsetDateTime createdAt;

        public PaymentTransactionBuilder transactionId(Integer transactionId) {
            this.transactionId = transactionId;
            return this;
        }

        public PaymentTransactionBuilder contractId(Integer contractId) {
            this.contractId = contractId;
            return this;
        }

        public PaymentTransactionBuilder serviceRequestId(Integer serviceRequestId) {
            this.serviceRequestId = serviceRequestId;
            return this;
        }

        public PaymentTransactionBuilder cancellationRequestId(Integer cancellationRequestId) {
            this.cancellationRequestId = cancellationRequestId;
            return this;
        }

        public PaymentTransactionBuilder type(TransactionType type) {
            this.type = type;
            return this;
        }

        public PaymentTransactionBuilder amount(BigDecimal amount) {
            this.amount = amount;
            return this;
        }

        public PaymentTransactionBuilder paymentMethod(String paymentMethod) {
            this.paymentMethod = paymentMethod;
            return this;
        }

        public PaymentTransactionBuilder gatewayRef(String gatewayRef) {
            this.gatewayRef = gatewayRef;
            return this;
        }

        public PaymentTransactionBuilder status(PaymentStatus status) {
            this.status = status;
            return this;
        }

        public PaymentTransactionBuilder createdAt(OffsetDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public PaymentTransaction build() {
            return new PaymentTransaction(transactionId, contractId, serviceRequestId, cancellationRequestId,
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

    public ServiceRequest getServiceRequest() {
        return serviceRequest;
    }

    public void setServiceRequest(ServiceRequest serviceRequest) {
        this.serviceRequest = serviceRequest;
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
