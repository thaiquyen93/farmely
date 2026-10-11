package com.smartagrirent.payment.repository;

import com.smartagrirent.payment.entity.CultivationService;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CultivationServiceRepository extends JpaRepository<CultivationService, Integer> {
    Optional<CultivationService> findFirstByServiceNameContainingIgnoreCase(String name);
}
