package com.smartagrirent.knowledge.repository;

import com.smartagrirent.knowledge.entity.Crop;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CropRepository extends JpaRepository<Crop, Integer> {
    Optional<Crop> findByCropNameIgnoreCase(String cropName);
}
