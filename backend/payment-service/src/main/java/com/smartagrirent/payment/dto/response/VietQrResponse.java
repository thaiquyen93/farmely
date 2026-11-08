package com.smartagrirent.payment.dto.response;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public class VietQrResponse {
    private Integer transactionId;
    private String qrImageUrl;
    private String qrQuickLink;
    private BigDecimal amount;
    private String bankId;
    private String bankName;
    private String accountNo;
    private String accountName;
    private String description;
    private String gatewayRef;
    private String status;
    private OffsetDateTime createdAt;

    public VietQrResponse() {
    }

    public VietQrResponse(Integer transactionId, String qrImageUrl, String qrQuickLink, BigDecimal amount,
                          String bankId, String bankName, String accountNo, String accountName,
                          String description, String gatewayRef, String status, OffsetDateTime createdAt) {
        this.transactionId = transactionId;
        this.qrImageUrl = qrImageUrl;
        this.qrQuickLink = qrQuickLink;
        this.amount = amount;
        this.bankId = bankId;
        this.bankName = bankName;
        this.accountNo = accountNo;
        this.accountName = accountName;
        this.description = description;
        this.gatewayRef = gatewayRef;
        this.status = status;
        this.createdAt = createdAt;
    }

    public static VietQrResponseBuilder builder() {
        return new VietQrResponseBuilder();
    }

    public static class VietQrResponseBuilder {
        private Integer transactionId;
        private String qrImageUrl;
        private String qrQuickLink;
        private BigDecimal amount;
        private String bankId;
        private String bankName;
        private String accountNo;
        private String accountName;
        private String description;
        private String gatewayRef;
        private String status;
        private OffsetDateTime createdAt;

        public VietQrResponseBuilder transactionId(Integer transactionId) {
            this.transactionId = transactionId;
            return this;
        }

        public VietQrResponseBuilder qrImageUrl(String qrImageUrl) {
            this.qrImageUrl = qrImageUrl;
            return this;
        }

        public VietQrResponseBuilder qrQuickLink(String qrQuickLink) {
            this.qrQuickLink = qrQuickLink;
            return this;
        }

        public VietQrResponseBuilder amount(BigDecimal amount) {
            this.amount = amount;
            return this;
        }

        public VietQrResponseBuilder bankId(String bankId) {
            this.bankId = bankId;
            return this;
        }

        public VietQrResponseBuilder bankName(String bankName) {
            this.bankName = bankName;
            return this;
        }

        public VietQrResponseBuilder accountNo(String accountNo) {
            this.accountNo = accountNo;
            return this;
        }

        public VietQrResponseBuilder accountName(String accountName) {
            this.accountName = accountName;
            return this;
        }

        public VietQrResponseBuilder description(String description) {
            this.description = description;
            return this;
        }

        public VietQrResponseBuilder gatewayRef(String gatewayRef) {
            this.gatewayRef = gatewayRef;
            return this;
        }

        public VietQrResponseBuilder status(String status) {
            this.status = status;
            return this;
        }

        public VietQrResponseBuilder createdAt(OffsetDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public VietQrResponse build() {
            return new VietQrResponse(transactionId, qrImageUrl, qrQuickLink, amount, bankId, bankName,
                    accountNo, accountName, description, gatewayRef, status, createdAt);
        }
    }

    public Integer getTransactionId() {
        return transactionId;
    }

    public void setTransactionId(Integer transactionId) {
        this.transactionId = transactionId;
    }

    public String getQrImageUrl() {
        return qrImageUrl;
    }

    public void setQrImageUrl(String qrImageUrl) {
        this.qrImageUrl = qrImageUrl;
    }

    public String getQrQuickLink() {
        return qrQuickLink;
    }

    public void setQrQuickLink(String qrQuickLink) {
        this.qrQuickLink = qrQuickLink;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getBankId() {
        return bankId;
    }

    public void setBankId(String bankId) {
        this.bankId = bankId;
    }

    public String getBankName() {
        return bankName;
    }

    public void setBankName(String bankName) {
        this.bankName = bankName;
    }

    public String getAccountNo() {
        return accountNo;
    }

    public void setAccountNo(String accountNo) {
        this.accountNo = accountNo;
    }

    public String getAccountName() {
        return accountName;
    }

    public void setAccountName(String accountName) {
        this.accountName = accountName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getGatewayRef() {
        return gatewayRef;
    }

    public void setGatewayRef(String gatewayRef) {
        this.gatewayRef = gatewayRef;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
