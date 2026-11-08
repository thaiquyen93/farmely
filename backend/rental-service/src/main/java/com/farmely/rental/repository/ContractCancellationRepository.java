package com.farmely.rental.repository;

import com.farmely.rental.entity.CancelStatus;
import com.farmely.rental.entity.ContractCancellationEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ContractCancellationRepository extends JpaRepository<ContractCancellationEntity, Integer> {

    Optional<ContractCancellationEntity> findByContractId(Integer contractId);

    List<ContractCancellationEntity> findByStatus(CancelStatus status);

    long countByStatus(CancelStatus status);
}
