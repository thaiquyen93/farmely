package com.smartagrirent.knowledge.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;

@Entity
@Table(name = "varieties")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Variety {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "variety_id")
    private Integer varietyId;

    @Column(name = "crop_id", nullable = false)
    private Integer cropId;

    @Column(name = "variety_name", nullable = false, length = 150)
    private String varietyName;

    @Column(name = "expected_duration", nullable = false)
    private Integer expectedDuration;

    @Builder.Default
    @Column(name = "buffer_time", nullable = false)
    private Integer bufferTime = 0;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "crop_id", insertable = false, updatable = false)
    private Crop crop;
}
