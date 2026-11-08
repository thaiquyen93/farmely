package com.smartagrirent.payment.dto.request;

import java.math.BigDecimal;

public class VietQrGenerateRequest {
    private Integer contractId;
    private Integer serviceRequestId;
    private BigDecimal amount;
    private String bankId;
    private String accountNo;
    private String accountName;
    private String description;
    private String plotCode;
    private String customerName;

    public VietQrGenerateRequest() {
    }

    public VietQrGenerateRequest(Integer contractId, Integer serviceRequestId, BigDecimal amount,
                                 String bankId, String accountNo, String accountName, String description,
                                 String plotCode, String customerName) {
        this.contractId = contractId;
        this.serviceRequestId = serviceRequestId;
        this.amount = amount;
        this.bankId = bankId;
        this.accountNo = accountNo;
        this.accountName = accountName;
        this.description = description;
        this.plotCode = plotCode;
        this.customerName = customerName;
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

    public String getPlotCode() {
        return plotCode;
    }

    public void setPlotCode(String plotCode) {
        this.plotCode = plotCode;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }
}
