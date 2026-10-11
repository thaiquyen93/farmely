package com.farmely.cultivation.repository;

import com.farmely.cultivation.entity.PlotReference;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PlotReferenceRepository extends JpaRepository<PlotReference, Integer> {
}
