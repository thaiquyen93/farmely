package com.farmely.identity.repository;

import com.farmely.identity.entity.User;
import com.farmely.identity.entity.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    List<User> findByRoleRoleName(String roleName);
    long countByRoleRoleNameAndStatusAndUserIdNot(String roleName, UserStatus status, Integer userId);
}
