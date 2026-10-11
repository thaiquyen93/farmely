package com.farmely.rental.repository;

import com.farmely.rental.entity.ServiceReference;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ServiceReferenceRepository extends JpaRepository<ServiceReference, Integer> {
    Optional<ServiceReference> findByServiceCode(String serviceCode);
}
