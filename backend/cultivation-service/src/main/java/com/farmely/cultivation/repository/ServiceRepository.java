package com.farmely.cultivation.repository;

import com.farmely.cultivation.entity.ActiveStatus;
import com.farmely.cultivation.entity.ServiceEntity;
import com.farmely.cultivation.entity.ServiceType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ServiceRepository extends JpaRepository<ServiceEntity, Integer> {

    List<ServiceEntity> findByStatus(ActiveStatus status);

    List<ServiceEntity> findByServiceTypeAndStatus(ServiceType serviceType, ActiveStatus status);

    List<ServiceEntity> findByServiceType(ServiceType serviceType);
}
