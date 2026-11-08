package com.farmely.cultivation.repository;

import com.farmely.cultivation.entity.RentalReference;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RentalReferenceRepository extends JpaRepository<RentalReference, Integer> {
}
