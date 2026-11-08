package com.farmely.farm.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

@Entity
@Table(name = "varieties")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VarietyReferenceEntity {

    @Id
    @Column(name = "variety_id")
    private Integer varietyId;

    @Column(name = "crop_id", nullable = false)
    private Integer cropId;

    @Column(name = "variety_name", nullable = false, length = 150)
    private String varietyName;

    @Column(name = "expected_duration", nullable = false)
    private Integer expectedDuration;

    @Column(name = "buffer_time", nullable = false)
    private Integer bufferTime;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "crop_id", insertable = false, updatable = false)
    private CropReferenceEntity crop;
}
