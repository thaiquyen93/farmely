package com.farmely.cultivation.repository;

import com.farmely.cultivation.entity.TemplateStepReference;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TemplateStepReferenceRepository extends JpaRepository<TemplateStepReference, Integer> {

    List<TemplateStepReference> findByTemplateIdOrderByDayOffsetAsc(Integer templateId);
}
