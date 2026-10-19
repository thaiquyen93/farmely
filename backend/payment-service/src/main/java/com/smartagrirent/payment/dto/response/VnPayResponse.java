package com.smartagrirent.payment.dto.response;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public class VnPayResponse {
    private Integer transactionId;
    private String txnRef;
    private String paymentUrl;
    private BigDecimal amount;
    private String orderInfo;
    private String status;
    private String tmnCode;
    private String returnUrl;
    private OffsetDateTime createdAt;

    public VnPayResponse() {
    }

    public VnPayResponse(Integer transactionId, String txnRef, String paymentUrl, BigDecimal amount,
                         String orderInfo, String status, String tmnCode, String returnUrl, OffsetDateTime createdAt) {
        this.transactionId = transactionId;
        this.txnRef = txnRef;
        this.paymentUrl = paymentUrl;
        this.amount = amount;
        this.orderInfo = orderInfo;
        this.status = status;
        this.tmnCode = tmnCode;
        this.returnUrl = returnUrl;
        this.createdAt = createdAt;
    }

    public Integer getTransactionId() {
        return transactionId;
    }

    public void setTransactionId(Integer transactionId) {
        this.transactionId = transactionId;
    }

    public String getTxnRef() {
        return txnRef;
    }

    public void setTxnRef(String txnRef) {
        this.txnRef = txnRef;
    }

    public String getPaymentUrl() {
        return paymentUrl;
    }

    public void setPaymentUrl(String paymentUrl) {
        this.paymentUrl = paymentUrl;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getOrderInfo() {
        return orderInfo;
    }

    public void setOrderInfo(String orderInfo) {
        this.orderInfo = orderInfo;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getTmnCode() {
        return tmnCode;
    }

    public void setTmnCode(String tmnCode) {
        this.tmnCode = tmnCode;
    }

    public String getReturnUrl() {
        return returnUrl;
    }

    public void setReturnUrl(String returnUrl) {
        this.returnUrl = returnUrl;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
