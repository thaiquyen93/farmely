package com.farmely.rental.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "varieties")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VarietyReference {

    @Id
    @Column(name = "variety_id")
    private Integer varietyId;

    @Column(name = "crop_id")
    private Integer cropId;

    @Column(name = "variety_name")
    private String varietyName;

    @Column(name = "expected_duration")
    private Integer expectedDuration;

    @Column(name = "buffer_time")
    private Integer bufferTime;
}
