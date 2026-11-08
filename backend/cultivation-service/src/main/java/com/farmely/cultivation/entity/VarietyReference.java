package com.farmely.cultivation.entity;

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

    @Column(name = "variety_name")
    private String varietyName;

    @Column(name = "expected_duration")
    private Integer expectedDuration;
}
