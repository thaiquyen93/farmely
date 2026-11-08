package com.farmely.farm.repository;

import com.farmely.farm.constant.VisitStatus;
import com.farmely.farm.entity.SiteVisitEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface SiteVisitRepository extends JpaRepository<SiteVisitEntity, Integer>, JpaSpecificationExecutor<SiteVisitEntity> {

    List<SiteVisitEntity> findByPlotId(Integer plotId);

    List<SiteVisitEntity> findByStatus(VisitStatus status);

    List<SiteVisitEntity> findByVisitDate(LocalDate visitDate);

    List<SiteVisitEntity> findByVisitorPhone(String visitorPhone);
}
