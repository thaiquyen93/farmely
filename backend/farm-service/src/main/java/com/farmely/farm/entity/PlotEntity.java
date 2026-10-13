package com.farmely.farm.entity;

import com.farmely.farm.constant.PlotStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcType;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.dialect.PostgreSQLEnumJdbcType;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "plots")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlotEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "plot_id")
    private Integer plotId;

    @Column(name = "land_id", nullable = false)
    private Integer landId;

    @Column(name = "plot_code", nullable = false, unique = true, length = 50)
    private String plotCode;

    @Column(name = "area", nullable = false, precision = 10, scale = 2)
    private BigDecimal area;

    @Column(name = "image_url", columnDefinition = "TEXT")
    private String imageUrl;

    /** Ranh giới thửa: chuỗi GeoJSON Polygon (WGS84, ring đóng). Null = chưa khoanh vùng. */
    @Column(name = "boundary_geojson", columnDefinition = "TEXT")
    private String boundaryGeojson;

    @Column(name = "price_per_period", nullable = false, precision = 15, scale = 2)
    private BigDecimal pricePerPeriod;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, columnDefinition = "plot_status_enum")
    @JdbcType(PostgreSQLEnumJdbcType.class)
    @Builder.Default
    private PlotStatus status = PlotStatus.AVAIL;

    @Column(name = "is_published", nullable = false)
    @Builder.Default
    private Boolean isPublished = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "land_id", insertable = false, updatable = false)
    private LandEntity land;
}
