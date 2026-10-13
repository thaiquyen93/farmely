package com.farmely.farm.repository;

import com.farmely.farm.entity.CropReferenceEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CropReferenceRepository extends JpaRepository<CropReferenceEntity, Integer> {

    Optional<CropReferenceEntity> findByCropName(String cropName);
}
