package com.farmely.cultivation.entity;

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

    @Column(name = "plot_code")
    private String plotCode;

    @Column(name = "area")
    private BigDecimal area;

    @Column(name = "image_url")
    private String imageUrl;
}
