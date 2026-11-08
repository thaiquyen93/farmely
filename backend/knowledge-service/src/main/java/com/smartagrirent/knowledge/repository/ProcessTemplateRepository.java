package com.smartagrirent.knowledge.repository;

import com.smartagrirent.knowledge.entity.ProcessTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProcessTemplateRepository extends JpaRepository<ProcessTemplate, Integer> {
    List<ProcessTemplate> findByVarietyId(Integer varietyId);
}
