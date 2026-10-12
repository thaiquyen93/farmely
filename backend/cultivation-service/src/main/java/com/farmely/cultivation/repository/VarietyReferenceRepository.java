package com.farmely.cultivation.repository;

import com.farmely.cultivation.entity.VarietyReference;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface VarietyReferenceRepository extends JpaRepository<VarietyReference, Integer> {
}
