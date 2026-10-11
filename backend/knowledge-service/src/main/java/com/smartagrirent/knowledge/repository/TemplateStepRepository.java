package com.smartagrirent.knowledge.repository;

import com.smartagrirent.knowledge.entity.TemplateStep;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TemplateStepRepository extends JpaRepository<TemplateStep, Integer> {
    List<TemplateStep> findByTemplateIdOrderByStepOrderAsc(Integer templateId);
}
