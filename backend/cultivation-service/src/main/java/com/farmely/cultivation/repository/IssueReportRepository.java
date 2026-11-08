package com.farmely.cultivation.repository;

import com.farmely.cultivation.entity.IssueReportEntity;
import com.farmely.cultivation.entity.IssueStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IssueReportRepository extends JpaRepository<IssueReportEntity, Integer> {

    List<IssueReportEntity> findByRentalIdOrderByCreatedAtDesc(Integer rentalId);

    List<IssueReportEntity> findByStatusOrderByCreatedAtDesc(IssueStatus status);

    List<IssueReportEntity> findByReportedByOrderByCreatedAtDesc(Integer reportedBy);

    List<IssueReportEntity> findByHandledByOrderByCreatedAtDesc(Integer handledBy);

    long countByStatus(IssueStatus status);
}
