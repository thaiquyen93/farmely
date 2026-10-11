package com.farmely.rental.repository;

import com.farmely.rental.entity.SiteVisitEntity;
import com.farmely.rental.entity.VisitStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface SiteVisitRepository extends JpaRepository<SiteVisitEntity, Integer> {

    List<SiteVisitEntity> findByPlotId(Integer plotId);

    List<SiteVisitEntity> findByVisitDate(LocalDate date);

    List<SiteVisitEntity> findByStatus(VisitStatus status);

    List<SiteVisitEntity> findByPlotIdAndStatus(Integer plotId, VisitStatus status);

    long countByStatus(VisitStatus status);
}
