package com.farmely.cultivation.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "rentals")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RentalReference {

    @Id
    @Column(name = "rental_id")
    private Integer rentalId;

    @Column(name = "contract_id")
    private Integer contractId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "plot_id")
    private PlotReference plot;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "variety_id")
    private VarietyReference variety;

    @Column(name = "service_id")
    private Integer serviceId;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "status")
    private String status;
}
