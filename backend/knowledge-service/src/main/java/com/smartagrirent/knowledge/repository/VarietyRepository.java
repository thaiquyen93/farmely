package com.smartagrirent.knowledge.repository;

import com.smartagrirent.knowledge.entity.Variety;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VarietyRepository extends JpaRepository<Variety, Integer> {
    List<Variety> findByCropId(Integer cropId);
}
