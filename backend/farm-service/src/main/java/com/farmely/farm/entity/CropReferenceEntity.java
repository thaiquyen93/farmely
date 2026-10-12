package com.farmely.farm.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

@Entity
@Table(name = "crops")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CropReferenceEntity {

    @Id
    @Column(name = "crop_id")
    private Integer cropId;

    @Column(name = "crop_name", nullable = false, unique = true, length = 150)
    private String cropName;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;
}
