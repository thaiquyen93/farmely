package com.farmely.cultivation.repository;

import com.farmely.cultivation.entity.FarmDiaryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FarmDiaryRepository extends JpaRepository<FarmDiaryEntity, Integer> {

    List<FarmDiaryEntity> findByRentalIdOrderByCreatedAtDesc(Integer rentalId);

    Optional<FarmDiaryEntity> findByTaskId(Integer taskId);

    boolean existsByTaskId(Integer taskId);
}
