package com.smartagrirent.payment.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public class ServiceRequestResponse {
    private Integer requestId;
    private Integer rentalId;
    private Integer serviceId;
    private String serviceName;
    private String serviceType;
    private String unit;
    private BigDecimal price;
    private LocalDate scheduledDate;
    private String status;
    private OffsetDateTime createdAt;

    // Transaction info
    private Integer transactionId;
    private String paymentMethod;
    private String paymentStatus;
    private String gatewayRef;

    public ServiceRequestResponse() {
    }

    public static ServiceRequestResponseBuilder builder() {
        return new ServiceRequestResponseBuilder();
    }

    public static class ServiceRequestResponseBuilder {
        private Integer requestId;
        private Integer rentalId;
        private Integer serviceId;
        private String serviceName;
        private String serviceType;
        private String unit;
        private BigDecimal price;
        private LocalDate scheduledDate;
        private String status;
        private OffsetDateTime createdAt;
        private Integer transactionId;
        private String paymentMethod;
        private String paymentStatus;
        private String gatewayRef;

        public ServiceRequestResponseBuilder requestId(Integer requestId) {
            this.requestId = requestId;
            return this;
        }

        public ServiceRequestResponseBuilder rentalId(Integer rentalId) {
            this.rentalId = rentalId;
            return this;
        }

        public ServiceRequestResponseBuilder serviceId(Integer serviceId) {
            this.serviceId = serviceId;
            return this;
        }

        public ServiceRequestResponseBuilder serviceName(String serviceName) {
            this.serviceName = serviceName;
            return this;
        }

        public ServiceRequestResponseBuilder serviceType(String serviceType) {
            this.serviceType = serviceType;
            return this;
        }

        public ServiceRequestResponseBuilder unit(String unit) {
            this.unit = unit;
            return this;
        }

        public ServiceRequestResponseBuilder price(BigDecimal price) {
            this.price = price;
            return this;
        }

        public ServiceRequestResponseBuilder scheduledDate(LocalDate scheduledDate) {
            this.scheduledDate = scheduledDate;
            return this;
        }

        public ServiceRequestResponseBuilder status(String status) {
            this.status = status;
            return this;
        }

        public ServiceRequestResponseBuilder createdAt(OffsetDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public ServiceRequestResponseBuilder transactionId(Integer transactionId) {
            this.transactionId = transactionId;
            return this;
        }

        public ServiceRequestResponseBuilder paymentMethod(String paymentMethod) {
            this.paymentMethod = paymentMethod;
            return this;
        }

        public ServiceRequestResponseBuilder paymentStatus(String paymentStatus) {
            this.paymentStatus = paymentStatus;
            return this;
        }

        public ServiceRequestResponseBuilder gatewayRef(String gatewayRef) {
            this.gatewayRef = gatewayRef;
            return this;
        }

        public ServiceRequestResponse build() {
            ServiceRequestResponse res = new ServiceRequestResponse();
            res.setRequestId(requestId);
            res.setRentalId(rentalId);
            res.setServiceId(serviceId);
            res.setServiceName(serviceName);
            res.setServiceType(serviceType);
            res.setUnit(unit);
            res.setPrice(price);
            res.setScheduledDate(scheduledDate);
            res.setStatus(status);
            res.setCreatedAt(createdAt);
            res.setTransactionId(transactionId);
            res.setPaymentMethod(paymentMethod);
            res.setPaymentStatus(paymentStatus);
            res.setGatewayRef(gatewayRef);
            return res;
        }
    }

    public Integer getRequestId() {
        return requestId;
    }

    public void setRequestId(Integer requestId) {
        this.requestId = requestId;
    }

    public Integer getRentalId() {
        return rentalId;
    }

    public void setRentalId(Integer rentalId) {
        this.rentalId = rentalId;
    }

    public Integer getServiceId() {
        return serviceId;
    }

    public void setServiceId(Integer serviceId) {
        this.serviceId = serviceId;
    }

    public String getServiceName() {
        return serviceName;
    }

    public void setServiceName(String serviceName) {
        this.serviceName = serviceName;
    }

    public String getServiceType() {
        return serviceType;
    }

    public void setServiceType(String serviceType) {
        this.serviceType = serviceType;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public LocalDate getScheduledDate() {
        return scheduledDate;
    }

    public void setScheduledDate(LocalDate scheduledDate) {
        this.scheduledDate = scheduledDate;
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

    public Integer getTransactionId() {
        return transactionId;
    }

    public void setTransactionId(Integer transactionId) {
        this.transactionId = transactionId;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public String getPaymentStatus() {
        return paymentStatus;
    }

    public void setPaymentStatus(String paymentStatus) {
        this.paymentStatus = paymentStatus;
    }

    public String getGatewayRef() {
        return gatewayRef;
    }

    public void setGatewayRef(String gatewayRef) {
        this.gatewayRef = gatewayRef;
    }
}
