package com.parakh.backend.repository;

import com.parakh.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    List<User> findByRoleAndStatus(String role, String status);

    List<User> findByStatus(String status);

    org.springframework.data.domain.Page<User> findByRoleAndStatus(String role, String status,
            org.springframework.data.domain.Pageable pageable);

    org.springframework.data.domain.Page<User> findByRole(String role,
            org.springframework.data.domain.Pageable pageable);

    org.springframework.data.domain.Page<User> findByStatus(String status,
            org.springframework.data.domain.Pageable pageable);

    // Pagination & Multi-tenant support
    org.springframework.data.domain.Page<User> findByInstitutionId(Long institutionId,
            org.springframework.data.domain.Pageable pageable);

    org.springframework.data.domain.Page<User> findByRoleAndInstitutionId(String role, Long institutionId,
            org.springframework.data.domain.Pageable pageable);
}
