package com.farmely.cultivation.repository;

import com.farmely.cultivation.entity.UserReference;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserReferenceRepository extends JpaRepository<UserReference, Integer> {
}
