package com.farmely.cultivation.repository;

import com.farmely.cultivation.entity.CareTaskEntity;
import com.farmely.cultivation.entity.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface CareTaskRepository extends JpaRepository<CareTaskEntity, Integer> {

    List<CareTaskEntity> findByRentalIdOrderByDueDateAsc(Integer rentalId);

    List<CareTaskEntity> findByTaskAssignedToOrderByDueDateAsc(Integer taskAssignedTo);

    List<CareTaskEntity> findByTaskAssignedToAndDueDate(Integer taskAssignedTo, LocalDate dueDate);

    List<CareTaskEntity> findByDueDate(LocalDate dueDate);

    List<CareTaskEntity> findByStatus(TaskStatus status);

    List<CareTaskEntity> findByRentalIdAndStatus(Integer rentalId, TaskStatus status);

    List<CareTaskEntity> findByStatusNotAndDueDateBefore(TaskStatus status, LocalDate date);

    boolean existsByRentalIdAndStepId(Integer rentalId, Integer stepId);

    long countByStatus(TaskStatus status);

    @Query("SELECT COUNT(t) FROM CareTaskEntity t WHERE t.status != 'DONE' AND t.dueDate < :today")
    long countOverdueTasks(@Param("today") LocalDate today);

    @Query("SELECT COUNT(t) FROM CareTaskEntity t WHERE t.taskAssignedTo = :workerId AND t.dueDate = :date")
    long countTasksForWorkerOnDate(@Param("workerId") Integer workerId, @Param("date") LocalDate date);

    @Query("SELECT COUNT(t) FROM CareTaskEntity t WHERE t.taskAssignedTo = :workerId AND t.dueDate = :date AND t.status = 'DONE'")
    long countCompletedTasksForWorkerOnDate(@Param("workerId") Integer workerId, @Param("date") LocalDate date);
}
