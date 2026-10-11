package com.farmely.rental.repository;

import com.farmely.rental.entity.ContractEntity;
import com.farmely.rental.entity.ContractStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ContractRepository extends JpaRepository<ContractEntity, Integer> {

    Optional<ContractEntity> findByContractNumber(String contractNumber);

    List<ContractEntity> findByRenterId(Integer renterId);

    List<ContractEntity> findByStatus(ContractStatus status);

    List<ContractEntity> findByRenterIdAndStatus(Integer renterId, ContractStatus status);

    List<ContractEntity> findByStatusAndReservationExpiresAtBefore(ContractStatus status, OffsetDateTime time);

    long countByStatus(ContractStatus status);
}
