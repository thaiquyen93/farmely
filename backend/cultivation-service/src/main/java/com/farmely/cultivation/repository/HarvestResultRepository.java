package com.farmely.cultivation.repository;

import com.farmely.cultivation.entity.HarvestResultEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface HarvestResultRepository extends JpaRepository<HarvestResultEntity, Integer> {

    Optional<HarvestResultEntity> findByRentalIdAndSeasonKeyAndHarvestTaskId(Integer rentalId, String seasonKey, Integer harvestTaskId);

    List<HarvestResultEntity> findByRentalIdOrderByHarvestDateDesc(Integer rentalId);

    List<HarvestResultEntity> findByCustomerConfirmedOrderByHarvestDateDesc(Boolean customerConfirmed);

    List<HarvestResultEntity> findByEnteredByOrderByHarvestDateDesc(Integer enteredBy);

    long countByCustomerConfirmed(Boolean customerConfirmed);

    @Query("SELECT COALESCE(SUM(h.yieldAmount), 0) FROM HarvestResultEntity h")
    BigDecimal sumTotalYieldAmount();
}
