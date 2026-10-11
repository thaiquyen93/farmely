package com.farmely.cultivation.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcType;
import org.hibernate.dialect.PostgreSQLEnumJdbcType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "harvest_results")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HarvestResultEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "harvest_id")
    private Integer harvestId;

    @Column(name = "rental_id", nullable = false)
    private Integer rentalId;

    @Column(name = "entered_by", nullable = false)
    private Integer enteredBy;

    @Column(name = "harvest_date", nullable = false)
    private LocalDate harvestDate;

    @Column(name = "yield_amount", precision = 10, scale = 2)
    private BigDecimal yieldAmount;

    @Column(name = "evidence_image_url", columnDefinition = "TEXT")
    private String evidenceImageUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "delivery_type", nullable = false, columnDefinition = "delivery_type_enum")
    @JdbcType(PostgreSQLEnumJdbcType.class)
    private DeliveryType deliveryType;

    @Column(name = "customer_confirmed", nullable = false)
    @Builder.Default
    private Boolean customerConfirmed = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}
