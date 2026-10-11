package com.smartagrirent.payment.entity;

import com.smartagrirent.payment.constant.RequestStatus;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "service_requests")
public class ServiceRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "request_id")
    private Integer requestId;

    @Column(name = "rental_id", nullable = false)
    private Integer rentalId = 1;

    @Column(name = "service_id", nullable = false)
    private Integer serviceId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "service_id", insertable = false, updatable = false)
    private CultivationService service;

    @Column(name = "scheduled_date")
    private LocalDate scheduledDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private RequestStatus status = RequestStatus.PENDING;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @OneToMany(mappedBy = "serviceRequestId", fetch = FetchType.LAZY)
    private List<PaymentTransaction> transactions = new ArrayList<>();

    public ServiceRequest() {
    }

    public ServiceRequest(Integer requestId, Integer rentalId, Integer serviceId,
                          CultivationService service, LocalDate scheduledDate,
                          RequestStatus status, OffsetDateTime createdAt) {
        this.requestId = requestId;
        this.rentalId = rentalId != null ? rentalId : 1;
        this.serviceId = serviceId;
        this.service = service;
        this.scheduledDate = scheduledDate;
        this.status = status != null ? status : RequestStatus.PENDING;
        this.createdAt = createdAt;
    }

    public static ServiceRequestBuilder builder() {
        return new ServiceRequestBuilder();
    }

    public static class ServiceRequestBuilder {
        private Integer requestId;
        private Integer rentalId = 1;
        private Integer serviceId;
        private CultivationService service;
        private LocalDate scheduledDate;
        private RequestStatus status = RequestStatus.PENDING;
        private OffsetDateTime createdAt;

        public ServiceRequestBuilder requestId(Integer requestId) {
            this.requestId = requestId;
            return this;
        }

        public ServiceRequestBuilder rentalId(Integer rentalId) {
            this.rentalId = rentalId;
            return this;
        }

        public ServiceRequestBuilder serviceId(Integer serviceId) {
            this.serviceId = serviceId;
            return this;
        }

        public ServiceRequestBuilder service(CultivationService service) {
            this.service = service;
            return this;
        }

        public ServiceRequestBuilder scheduledDate(LocalDate scheduledDate) {
            this.scheduledDate = scheduledDate;
            return this;
        }

        public ServiceRequestBuilder status(RequestStatus status) {
            this.status = status;
            return this;
        }

        public ServiceRequestBuilder createdAt(OffsetDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public ServiceRequest build() {
            return new ServiceRequest(requestId, rentalId, serviceId, service, scheduledDate, status, createdAt);
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

    public CultivationService getService() {
        return service;
    }

    public void setService(CultivationService service) {
        this.service = service;
    }

    public LocalDate getScheduledDate() {
        return scheduledDate;
    }

    public void setScheduledDate(LocalDate scheduledDate) {
        this.scheduledDate = scheduledDate;
    }

    public RequestStatus getStatus() {
        return status;
    }

    public void setStatus(RequestStatus status) {
        this.status = status;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public List<PaymentTransaction> getTransactions() {
        return transactions;
    }

    public void setTransactions(List<PaymentTransaction> transactions) {
        this.transactions = transactions;
    }
}
