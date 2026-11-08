package com.farmely.rental.repository;

import com.farmely.rental.entity.VarietyReference;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface VarietyReferenceRepository extends JpaRepository<VarietyReference, Integer> {
}
