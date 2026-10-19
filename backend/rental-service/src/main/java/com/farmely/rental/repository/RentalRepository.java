package com.farmely.rental.repository;

import com.farmely.rental.entity.RentalEntity;
import com.farmely.rental.entity.RentalStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface RentalRepository extends JpaRepository<RentalEntity, Integer> {

    List<RentalEntity> findByContractId(Integer contractId);

    List<RentalEntity> findByPlotId(Integer plotId);

    List<RentalEntity> findByStatus(RentalStatus status);

    List<RentalEntity> findByPlotIdAndStatus(Integer plotId, RentalStatus status);

    @Query("SELECT r FROM RentalEntity r, ContractEntity c WHERE r.contractId = c.contractId AND c.renterId = :renterId")
    List<RentalEntity> findByRenterId(@Param("renterId") Integer renterId);

    @Query("SELECT r FROM RentalEntity r WHERE r.plotId = :plotId " +
           "AND r.status NOT IN ('CANCELLED') " +
           "AND (r.startDate <= :endDate AND r.endDate >= :startDate)")
    List<RentalEntity> findOverlappingRentals(@Param("plotId") Integer plotId,
                                             @Param("startDate") LocalDate startDate,
                                             @Param("endDate") LocalDate endDate);

    @Query("SELECT r FROM RentalEntity r WHERE r.plotId = :plotId " +
           "AND r.rentalId != :excludeRentalId " +
           "AND r.status NOT IN ('CANCELLED') " +
           "AND (r.startDate <= :endDate AND r.endDate >= :startDate)")
    List<RentalEntity> findOverlappingRentalsExcluding(@Param("plotId") Integer plotId,
                                                      @Param("startDate") LocalDate startDate,
                                                      @Param("endDate") LocalDate endDate,
                                                      @Param("excludeRentalId") Integer excludeRentalId);

    long countByStatus(RentalStatus status);
}
