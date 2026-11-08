package com.farmely.farm.repository;

import com.farmely.farm.entity.LandEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LandRepository extends JpaRepository<LandEntity, Integer> {

    boolean existsByLandName(String landName);

    boolean existsByLandNameAndLandIdNot(String landName, Integer landId);

    @Query("SELECT l FROM LandEntity l WHERE " +
           "LOWER(l.landName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(l.address) LIKE LOWER(CONCAT('%', :search, '%'))")
    List<LandEntity> searchLands(@Param("search") String search);
}
