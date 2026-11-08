package com.smartagrirent.farm.repository;

import com.smartagrirent.farm.entity.Land;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LandRepository extends JpaRepository<Land, Integer> {
    Optional<Land> findByLandName(String landName);
}
