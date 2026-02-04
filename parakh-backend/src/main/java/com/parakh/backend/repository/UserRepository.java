package com.parakh.backend.repository;

import com.parakh.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    List<User> findByRoleAndStatus(String role, String status);

    List<User> findByStatus(String status);
}
