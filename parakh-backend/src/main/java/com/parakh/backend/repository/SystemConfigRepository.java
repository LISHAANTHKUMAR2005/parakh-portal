package com.parakh.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.parakh.backend.model.SystemConfig;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SystemConfigRepository extends JpaRepository<SystemConfig, String> {
    Optional<SystemConfig> findByConfigKey(String key);
}
