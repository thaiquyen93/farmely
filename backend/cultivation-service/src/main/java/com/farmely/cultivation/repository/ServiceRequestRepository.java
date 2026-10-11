package com.farmely.cultivation.repository;

import com.farmely.cultivation.entity.RequestStatus;
import com.farmely.cultivation.entity.ServiceRequestEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ServiceRequestRepository extends JpaRepository<ServiceRequestEntity, Integer> {

    List<ServiceRequestEntity> findByRentalIdOrderByCreatedAtDesc(Integer rentalId);

    List<ServiceRequestEntity> findByStatusOrderByCreatedAtDesc(RequestStatus status);

    List<ServiceRequestEntity> findByRentalIdAndStatus(Integer rentalId, RequestStatus status);

    long countByStatus(RequestStatus status);
}
