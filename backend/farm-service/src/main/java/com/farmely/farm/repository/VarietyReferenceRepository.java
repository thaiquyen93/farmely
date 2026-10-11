package com.farmely.farm.repository;

import com.farmely.farm.entity.VarietyReferenceEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VarietyReferenceRepository extends JpaRepository<VarietyReferenceEntity, Integer> {

    List<VarietyReferenceEntity> findByCropId(Integer cropId);
}
