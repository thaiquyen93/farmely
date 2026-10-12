package com.farmely.rental.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "plots")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlotReference {

    @Id
    @Column(name = "plot_id")
    private Integer plotId;

    @Column(name = "land_id")
    private Integer landId;

    @Column(name = "plot_code")
    private String plotCode;

    @Column(name = "area")
    private BigDecimal area;

    @Column(name = "price_per_period")
    private BigDecimal pricePerPeriod;

    @Column(name = "status")
    private String status;

    @Column(name = "is_published")
    private Boolean isPublished;

    @Column(name = "image_url")
    private String imageUrl;
}
