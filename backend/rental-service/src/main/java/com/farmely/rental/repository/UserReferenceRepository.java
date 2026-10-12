package com.farmely.rental.repository;

import com.farmely.rental.entity.UserReference;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserReferenceRepository extends JpaRepository<UserReference, Integer> {
}
