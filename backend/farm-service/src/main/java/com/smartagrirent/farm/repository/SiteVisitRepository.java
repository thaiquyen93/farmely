package com.smartagrirent.farm.repository;

import com.smartagrirent.farm.constant.VisitStatus;
import com.smartagrirent.farm.entity.SiteVisit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SiteVisitRepository extends JpaRepository<SiteVisit, Integer> {

    List<SiteVisit> findAllByOrderByVisitIdDesc();

    List<SiteVisit> findByStatusOrderByVisitIdDesc(VisitStatus status);

    List<SiteVisit> findByPlotIdOrderByVisitIdDesc(Integer plotId);
}
