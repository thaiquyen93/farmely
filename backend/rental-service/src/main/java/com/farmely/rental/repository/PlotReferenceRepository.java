package com.farmely.rental.repository;

import com.farmely.rental.entity.PlotReference;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PlotReferenceRepository extends JpaRepository<PlotReference, Integer> {
    List<PlotReference> findByStatus(String status);
}
